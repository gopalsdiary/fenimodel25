// Authentication Check Utility for Login Protected Pages
// Used across protected pages. Keep it self-contained to avoid global collisions.

(function () {
    'use strict';

    const SUPABASE_URL = 'https://rtfefxghfbtirfnlbucb.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0ZmVmeGdoZmJ0aXJmbmxidWNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA1MDg3OTcsImV4cCI6MjA1NjA4NDc5N30.fb7_myCmFzbV7WPNjFN_NEl4z0sOmRCefnkQbk6c10w';

    function getLoginIndexUrl() {
        // Use absolute login path to avoid relative resolution issues across nested folders
        // This ensures pages under /z_others/ or other subfolders always redirect to the real login page
        return window.location.origin + '/login/index.html';
    }

    function getReturnToParam() {
        // Return full pathname and query so login can redirect back correctly to the exact page
        const path = (window.location.pathname || '') + (window.location.search || '');
        // If already on a login page, return a safe value to avoid an infinite redirect loop
        if (path.includes('/login/')) {
            return 'index.html';
        }
        return path || '/';
    }

    function redirectToLogin() {
        const loginUrl = new URL(getLoginIndexUrl());
        const returnTo = getReturnToParam();
        // Avoid infinite loop on login page
        if (!returnTo || returnTo.endsWith('/login/index.html') || returnTo === 'index.html') {
            window.location.href = loginUrl.toString();
            return;
        }
        loginUrl.searchParams.set('returnTo', returnTo);
        window.location.href = loginUrl.toString();
    }

    function getSharedSupabaseClient() {
        window.__supabaseClients = window.__supabaseClients || {};
        if (window.__supabaseClients[SUPABASE_URL]) {
            return window.__supabaseClients[SUPABASE_URL];
        }
        if (typeof window.supabase === 'undefined' || typeof window.supabase.createClient !== 'function') {
            return null;
        }
        const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
            auth: {
                persistSession: true,
                autoRefreshToken: true
            }
        });
        window.__supabaseClients[SUPABASE_URL] = client;
        return client;
    }

    // Wait for Supabase to be loaded and then check authentication
    function waitForSupabaseAndCheck() {
        let attempts = 0;
        const maxAttempts = 50; // Maximum 5 seconds (50 * 100ms)
        
        function checkForSupabase() {
            attempts++;
            
            // Check if Supabase is loaded
            if (typeof window.supabase !== 'undefined') {
                // Now Supabase is loaded, proceed with authentication check
                checkAuthenticationAndRedirect();
                return;
            }
            
            // If we haven't reached max attempts, try again
            if (attempts < maxAttempts) {
                setTimeout(checkForSupabase, 100);
            } else {
                // Fallback: Load Supabase manually if it's not loaded
                console.warn('Supabase not loaded, loading manually for auth check...');
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
                script.onload = () => {
                    checkAuthenticationAndRedirect();
                };
                script.onerror = () => {
                    console.error('Failed to load Supabase for authentication check');
                    redirectToLogin();
                };
                document.head.appendChild(script);
            }
        }
        
        checkForSupabase();
    }

    // Authentication check function
    async function checkAuthenticationAndRedirect() {
        try {
            const authClient = getSharedSupabaseClient();
            if (!authClient) {
                console.error('Supabase not available for authentication check');
                redirectToLogin();
                return false;
            }
            const { data: { session }, error } = await authClient.auth.getSession();
            
            if (error || !session) {
                // No valid session, redirect to login page with current page as return URL
                console.log('No valid session found, redirecting to login...');
                redirectToLogin();
                return false;
            }
            
            // Valid session exists
            console.log('Valid session found for user:', session.user.email);
            return true;
            
        } catch (error) {
            console.error('Authentication check failed:', error);
            redirectToLogin();
            return false;
        }
    }

    // Listen for auth state changes and redirect if user logs out
    function setupAuthStateListener() {
        try {
            const authClient = getSharedSupabaseClient();
            if (!authClient) return;
            authClient.auth.onAuthStateChange((event, session) => {
                if (event === 'SIGNED_OUT' || (!session && event !== 'INITIAL_SESSION')) {
                    console.log('User signed out, redirecting to login...');
                    redirectToLogin();
                }
            });
        } catch (error) {
            console.error('Error setting up auth state listener:', error);
        }
    }

    // Setup auth state listener when page is ready
    setTimeout(setupAuthStateListener, 2000);

    // === 15-Minute Inactivity Auto-Logout ===
    (function setupInactivityTimeout() {
    const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds
    let inactivityTimer = null;
    
    // Reset the inactivity timer
    function resetInactivityTimer() {
        // Clear existing timer
        if (inactivityTimer) {
            clearTimeout(inactivityTimer);
        }
        
        // Start new timer
        inactivityTimer = setTimeout(() => {
            console.log('Session expired due to 15 minutes of inactivity');
            
            // Perform logout
            const authClient = getSharedSupabaseClient();
            if (!authClient) {
                alert('Session expired after 15 minutes of inactivity. Please log in again.');
                redirectToLogin();
                return;
            }

            authClient.auth.signOut().then(() => {
                alert('Session expired after 15 minutes of inactivity. Please log in again.');
                redirectToLogin();
            }).catch((error) => {
                console.error('Error during inactivity logout:', error);
                redirectToLogin();
            });
        }, INACTIVITY_TIMEOUT);
    }
    
    // Activity events to monitor
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    // Add event listeners for user activity
    activityEvents.forEach(event => {
        document.addEventListener(event, resetInactivityTimer, true);
    });
    
    // Start the initial timer
    resetInactivityTimer();
    
    // Reset timer when page becomes visible (in case user switches tabs)
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            resetInactivityTimer();
        }
    });
    
    console.log('Inactivity timeout set to 15 minutes');
})();

    // Schedule auth check once
    function scheduleAuthCheck() {
        setTimeout(waitForSupabaseAndCheck, 500);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', scheduleAuthCheck);
    } else {
        scheduleAuthCheck();
    }

})();