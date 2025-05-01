
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

export async function signup(formData: FormData): Promise<{ error: AuthError | null, success?: boolean }> {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  // Server-side validation
  if (!name || !email || !password || !confirmPassword) {
    return {
      error: {
        message: 'All fields are required'
      }
    }
  }

  if (password !== confirmPassword) {
    return {
      error: {
        message: 'Passwords do not match'
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
          name: name // Use the provided name
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

    // If we have a user, update the profile with the name
    if (data.user) {
      try {
        // Update the profile with the name
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            name: name,
            email: email,
            updated_at: new Date().toISOString()
          })

        if (profileError) {
          console.error('Error updating profile:', profileError)
          // We don't return an error here as the signup was successful
          // The profile will be updated when the user logs in
        } else {
          console.log('Profile updated successfully with name:', name)
        }
      } catch (profileErr) {
        console.error('Unexpected error updating profile:', profileErr)
      }
    }

    return { error: null, success: true }
  } catch (err: any) {
    console.error('Unexpected signup error:', err)
    return {
      error: {
        message: err.message || 'An error occurred during signup'
      },
      success: false
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

