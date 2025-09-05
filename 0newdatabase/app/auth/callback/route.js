import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request) {
  // Parse the URL to get the search params
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  if (code) {
    // Create a Supabase client
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    
    // Exchange the code for a session
    await supabase.auth.exchangeCodeForSession(code)
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(requestUrl.origin)
}