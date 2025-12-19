// Authentication Check Utility for Login Protected Pages
// This script should be included in all pages within the login folder (except index.html)

// IMPORTANT: Wrap in a function scope so constants don't collide with page scripts.
(function () {
    'use strict';

    // Supabase config (keep consistent across webadmin pages)
    const SUPABASE_URL = 'https://iujlulmdjudhcbeqynit.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1amx1bG1kanVkaGNiZXF5bml0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0MjE4MDgsImV4cCI6MjA3Mjk5NzgwOH0.d0s84VID4VD76TB0Qtpmx4pgoQ_7T96JVH0Rm03h3rU';

function getSharedSupabaseClient() {
    if (window.__fenimodelSupabaseClient) {
        return window.__fenimodelSupabaseClient;
    }

    if (typeof window.supabase === 'undefined' || typeof window.supabase.createClient !== 'function') {
        return null;
    }

    window.__fenimodelSupabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: {
            persistSession: true,
            autoRefreshToken: true
        }
    });
    return window.__fenimodelSupabaseClient;
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
                // Redirect to login as a fallback
                window.location.href = './index.html';
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
            console.error('Supabase not available for auth check');
            window.location.href = './index.html';
            return false;
        }

        const { data: { session }, error } = await authClient.auth.getSession();
        
        if (error || !session) {
            // No valid session, redirect to login page immediately
            console.log('No valid session found, redirecting to login...');
            window.location.href = './index.html';
            return false;
        }
        
        // Valid session exists
        console.log('Valid session found for user:', session.user.email);
        return true;
        
    } catch (error) {
        console.error('Authentication check failed:', error);
        // Redirect immediately on error
        window.location.href = './index.html';
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
                window.location.href = './index.html';
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
                window.location.href = './index.html';
                return;
            }

            authClient.auth.signOut().then(() => {
                alert('Session expired after 15 minutes of inactivity. Please log in again.');
                window.location.href = './index.html';
            }).catch((error) => {
                console.error('Error during inactivity logout:', error);
                window.location.href = './index.html';
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