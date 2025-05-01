
// lib/supabase/server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Updated implementation for Next.js 15 with async cookies API
export async function createClient() {
  const cookieStore = await cookies() // Now properly awaited

  // Create cookie store methods
  const cookieMethods = {
    get(name: string) {
      return cookieStore.get(name)?.value
    },
    set(name: string, value: string, options: CookieOptions) {
      try {
        cookieStore.set({ name, value, ...options })
      } catch (error) {
        // The `set` method was called from a Server Component.
        // This can be ignored if you have middleware refreshing user sessions.
      }
    },
    remove(name: string, options: CookieOptions) {
      try {
        cookieStore.set({ name, value: '', ...options })
      } catch (error) {
        // The `delete` method was called from a Server Component.
        // This can be ignored if you have middleware refreshing user sessions.
      }
    },
  }

  // Create and return the Supabase client
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: cookieMethods }
  )
}

/**
 * Create a Supabase client with the service role key for admin operations
 * This should ONLY be used in server-side code for admin operations
 */
export async function createAdminClient() {
  const cookieStore = await cookies()

  // Create cookie store methods
  const cookieMethods = {
    get(name: string) {
      return cookieStore.get(name)?.value
    },
    set(name: string, value: string, options: CookieOptions) {
      try {
        cookieStore.set({ name, value, ...options })
      } catch (error) {
        // The `set` method was called from a Server Component.
        // This can be ignored if you have middleware refreshing user sessions.
      }
    },
    remove(name: string, options: CookieOptions) {
      try {
        cookieStore.set({ name, value: '', ...options })
      } catch (error) {
        // The `delete` method was called from a Server Component.
        // This can be ignored if you have middleware refreshing user sessions.
      }
    },
  }

  // Create and return the Supabase client with service role key
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role key for admin operations
    { cookies: cookieMethods }
  )
}
