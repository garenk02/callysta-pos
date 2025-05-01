
'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type AuthError = {
  message: string
}

export async function login(formData: FormData): Promise<{ error: AuthError | null }> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return {
      error: {
        message: 'Email and password are required'
      }
    }
  }

  try {
    const supabase = await createClient()

    // First, authenticate the user
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return {
        error: {
          message: error.message
        }
      }
    }

    // If authentication was successful, check if the user is active
    if (data.user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_active')
        .eq('id', data.user.id)
        .single()

      if (profileError) {
        console.error('Error fetching user profile:', profileError)
        // If there's an error fetching the profile, we'll let the user in
        // as the profile might not exist yet
        return { error: null }
      }

      // If the user is not active, sign them out and return an error
      if (profile && profile.is_active === false) {
        // Sign the user out
        await supabase.auth.signOut()

        return {
          error: {
            message: 'Your account has been deactivated. Please contact an administrator.'
          }
        }
      }
    }

    return { error: null }
  } catch (err: any) {
    return {
      error: {
        message: err.message || 'An error occurred during login'
      }
    }
  }
}

export async function signup(formData: FormData): Promise<{ error: AuthError | null }> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return {
      error: {
        message: 'Email and password are required'
      }
    }
  }

  try {
    const supabase = await createClient()

    console.log('Signing up user:', email)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        data: {
          email: email,
          name: email.split('@')[0] // Use part of email as initial name
        }
      },
    })

    if (error) {
      console.error('Signup error:', error)
      return {
        error: {
          message: error.message
        }
      }
    }

    console.log('Signup successful:', data)
    return { error: null }
  } catch (err: any) {
    console.error('Unexpected signup error:', err)
    return {
      error: {
        message: err.message || 'An error occurred during signup'
      }
    }
  }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()

  // Use the new async cookies API properly
  const cookieStore = await cookies()

  // Get all cookies and delete them one by one
  const cookieList = await cookieStore.getAll()
  for (const cookie of cookieList) {
    await cookieStore.delete(cookie.name)
  }

  redirect('/login')
}

