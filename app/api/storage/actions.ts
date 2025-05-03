'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

type StorageActionError = {
  message: string
}

type StorageActionResult<T = void> = {
  data: T | null
  error: StorageActionError | null
}

/**
 * Check if a storage bucket exists
 * This must be run server-side with admin privileges
 */
export async function checkBucketExists(
  bucketId: string
): Promise<StorageActionResult<{ exists: boolean }>> {
  try {
    // Use the admin client which has the service role key
    const supabase = await createAdminClient()

    try {
      // Try to get the bucket directly
      const { data, error } = await supabase.storage.getBucket(bucketId)

      if (error) {
        // If the error is that the bucket doesn't exist, return exists: false
        if (error.message.includes('not found')) {
          return {
            data: { exists: false },
            error: null
          }
        }

        // For other errors, return the error
        return {
          data: null,
          error: { message: error.message }
        }
      }

      // If we got data, the bucket exists
      return {
        data: { exists: true },
        error: null
      }
    } catch (err) {
      // Fallback to listing buckets if getBucket fails
      const { data: buckets, error: listError } = await supabase.storage.listBuckets()

      if (listError) {
        return {
          data: null,
          error: { message: listError.message }
        }
      }

      // Check if our bucket exists in the list
      const bucketExists = buckets.some(bucket => bucket.id === bucketId)

      return {
        data: { exists: bucketExists },
        error: null
      }
    }
  } catch (err) {
    console.error('Unexpected error checking bucket:', err)
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
    return {
      data: null,
      error: { message: errorMessage }
    }
  }
}

/**
 * Get all storage buckets
 */
export async function getStorageBuckets(): Promise<StorageActionResult<{ id: string, name: string }[]>> {
  try {
    const supabase = await createAdminClient()

    const { data: buckets, error } = await supabase.storage.listBuckets()

    if (error) {
      console.error('Error listing buckets:', error.message)
      return {
        data: null,
        error: { message: error.message }
      }
    }

    return {
      data: buckets.map(bucket => ({ id: bucket.id, name: bucket.name })),
      error: null
    }
  } catch (err) {
    console.error('Unexpected error listing buckets:', err)
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
    return {
      data: null,
      error: { message: errorMessage }
    }
  }
}

/**
 * Get bucket details
 */
export async function getBucketDetails(
  bucketId: string
): Promise<StorageActionResult<{ id: string, name: string, public: boolean }>> {
  try {
    const supabase = await createAdminClient()

    const { data, error } = await supabase.storage.getBucket(bucketId)

    if (error) {
      return {
        data: null,
        error: { message: error.message }
      }
    }

    return {
      data: {
        id: data.id,
        name: data.name,
        public: data.public
      },
      error: null
    }
  } catch (err) {
    console.error('Unexpected error getting bucket details:', err)
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
    return {
      data: null,
      error: { message: errorMessage }
    }
  }
}
