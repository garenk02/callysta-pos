'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { User, UserRole } from '@/types'
import { revalidatePath } from 'next/cache'

export type UserActionError = {
  message: string
}

export type UserActionResult<T = void> = {
  data: T | null
  error: UserActionError | null
}

/**
 * Get all users from the profiles table
 */
export async function getUsers(): Promise<UserActionResult<User[]>> {
  try {
    const supabase = await createClient()

    // Fetch profiles from the profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching users:', error.message)
      return {
        data: null,
        error: { message: error.message }
      }
    }

    return {
      data: data as User[],
      error: null
    }
  } catch (err) {
    console.error('Unexpected error fetching users:', err)
    return {
      data: null,
      error: { message: 'An unexpected error occurred while fetching users' }
    }
  }
}

/**
 * Get a single user by ID
 */
export async function getUserById(userId: string): Promise<UserActionResult<User>> {
  try {
    const supabase = await createClient()

    // Fetch the user profile
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching user:', error.message)
      return {
        data: null,
        error: { message: error.message }
      }
    }

    return {
      data: data as User,
      error: null
    }
  } catch (err) {
    console.error('Unexpected error fetching user:', err)
    return {
      data: null,
      error: { message: 'An unexpected error occurred while fetching the user' }
    }
  }
}

/**
 * Create a new user in Supabase Auth and add a profile
 */
export async function createUser(
  email: string,
  password: string,
  name: string,
  role: UserRole,
  isActive: boolean = true
): Promise<UserActionResult<User>> {
  try {
    // Use the admin client for auth operations
    const adminClient = await createAdminClient()
    // Use regular client for database operations
    const supabase = await createClient()

    // First, create the auth user
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm the email
      user_metadata: {
        name,
        role
      }
    })

    if (authError) {
      console.error('Error creating auth user:', authError.message)
      return {
        data: null,
        error: { message: authError.message }
      }
    }

    if (!authData.user) {
      return {
        data: null,
        error: { message: 'Failed to create user account' }
      }
    }

    // Then create the profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email,
        name,
        role,
        is_active: isActive,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (profileError) {
      console.error('Error creating user profile:', profileError.message)
      return {
        data: null,
        error: { message: profileError.message }
      }
    }

    // Revalidate the users page to update the UI
    revalidatePath('/users')

    return {
      data: profileData as User,
      error: null
    }
  } catch (err) {
    console.error('Unexpected error creating user:', err)
    return {
      data: null,
      error: { message: 'An unexpected error occurred while creating the user' }
    }
  }
}

/**
 * Update a user's profile information
 */
export async function updateUser(
  userId: string,
  data: {
    name?: string
    role?: UserRole
    is_active?: boolean
  }
): Promise<UserActionResult<User>> {
  try {
    // Use the admin client for auth operations
    const adminClient = await createAdminClient()
    // Use regular client for database operations
    const supabase = await createClient()

    // Update the user metadata if name is provided
    if (data.name) {
      const { error: metadataError } = await adminClient.auth.admin.updateUserById(
        userId,
        {
          user_metadata: { name: data.name }
        }
      )

      if (metadataError) {
        console.error('Error updating user metadata:', metadataError.message)
        return {
          data: null,
          error: { message: metadataError.message }
        }
      }
    }

    // Update the profile
    const updateData = {
      ...data,
      updated_at: new Date().toISOString()
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()

    if (profileError) {
      console.error('Error updating user profile:', profileError.message)
      return {
        data: null,
        error: { message: profileError.message }
      }
    }

    // Revalidate the users page to update the UI
    revalidatePath('/users')

    return {
      data: profileData as User,
      error: null
    }
  } catch (err) {
    console.error('Unexpected error updating user:', err)
    return {
      data: null,
      error: { message: 'An unexpected error occurred while updating the user' }
    }
  }
}

/**
 * Toggle a user's active status
 */
export async function toggleUserStatus(
  userId: string,
  isActive: boolean
): Promise<UserActionResult<User>> {
  return updateUser(userId, { is_active: isActive })
}

/**
 * Send a password reset email to a user
 */
export async function resetUserPassword(email: string): Promise<UserActionResult<{ success: boolean }>> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
    })

    if (error) {
      console.error('Error sending password reset email:', error.message)
      return {
        data: null,
        error: { message: error.message }
      }
    }

    return {
      data: { success: true },
      error: null
    }
  } catch (err) {
    console.error('Unexpected error sending password reset email:', err)
    return {
      data: null,
      error: { message: 'An unexpected error occurred while sending the password reset email' }
    }
  }
}

/**
 * Delete a user (admin only)
 * Note: This is a destructive action and should be used with caution
 */
export async function deleteUser(userId: string): Promise<UserActionResult<{ success: boolean }>> {
  try {
    // Use the admin client for auth operations
    const adminClient = await createAdminClient()
    // Use regular client for database operations
    const supabase = await createClient()

    // First delete the profile
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (profileError) {
      console.error('Error deleting user profile:', profileError.message)
      return {
        data: null,
        error: { message: profileError.message }
      }
    }

    // Then delete the auth user
    const { error: authError } = await adminClient.auth.admin.deleteUser(userId)

    if (authError) {
      console.error('Error deleting auth user:', authError.message)
      return {
        data: null,
        error: { message: authError.message }
      }
    }

    // Revalidate the users page to update the UI
    revalidatePath('/users')

    return {
      data: { success: true },
      error: null
    }
  } catch (err) {
    console.error('Unexpected error deleting user:', err)
    return {
      data: null,
      error: { message: 'An unexpected error occurred while deleting the user' }
    }
  }
}
