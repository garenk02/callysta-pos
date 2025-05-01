// lib/supabase/middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create cookie store methods
  const cookieStore = {
    get(name: string) {
      return request.cookies.get(name)?.value
    },
    set(name: string, value: string, options: CookieOptions) {
      // If the cookie is set, update the request cookies object.
      request.cookies.set({ name, value, ...options })
      // Set the cookie on the response so it is saved in the browser.
      response = NextResponse.next({
        request: {
          headers: request.headers,
        },
      })
      response.cookies.set({ name, value, ...options })
    },
    remove(name: string, options: CookieOptions) {
      // If the cookie is removed, update the request cookies object.
      request.cookies.set({ name, value: '', ...options })
      // Delete the cookie on the response so it is removed from the browser.
      response = NextResponse.next({
        request: {
          headers: request.headers,
        },
      })
      response.cookies.set({ name, value: '', ...options })
    },
  }

  // Create the Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: cookieStore }
  )

  try {
    // Refresh session if expired - important!
    // Use getUser instead of getSession for better security
    await supabase.auth.getUser()
  } catch (error) {
    console.error('Error refreshing auth session:', error)
  }

  return response
}