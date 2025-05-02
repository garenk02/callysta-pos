// lib/supabase/storage.ts
import { createClient } from './client';
import { v4 as uuidv4 } from 'uuid';

/**
 * Upload a file to Supabase Storage
 * @param file The file to upload
 * @param bucket The storage bucket name (default: 'product-images')
 * @returns The URL of the uploaded file or null if upload failed
 */
export async function uploadFile(
  file: File,
  bucket: string = 'product-images'
): Promise<string | null> {
  try {
    const supabase = createClient();

    // Create a unique file name to prevent collisions
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${fileName}`;

    // Try to upload the file directly
    // This assumes the bucket has already been created in the Supabase dashboard
    try {
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) {
        // Handle different error cases
        if (uploadError.message.includes('bucket') && uploadError.message.includes('not found')) {
          console.error(`Bucket '${bucket}' does not exist. Please create it in the Supabase dashboard.`);
          return null;
        }

        if (uploadError.message.includes('row-level security policy')) {
          console.error(`RLS policy violation. Make sure the bucket exists and you have permission to upload.`);
          return null;
        }

        console.error('Error uploading file:', uploadError.message);
        return null;
      }

      // First try to get a signed URL (works even if bucket is not public)
      try {
        const { data: signedData, error: signedError } = await supabase.storage
          .from(bucket)
          .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year expiry

        if (!signedError && signedData) {
          console.log('Generated signed URL:', signedData.signedUrl);
          return signedData.signedUrl;
        }
      } catch (signedErr) {
        console.log('Could not generate signed URL, falling back to public URL');
      }

      // Fall back to public URL
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      // Log the URL for debugging
      console.log('Generated public URL:', data.publicUrl);

      // Ensure the URL is correctly formatted
      // The correct format should be: https://<project-ref>.supabase.co/storage/v1/object/public/<bucket>/<filename>
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      if (supabaseUrl && !data.publicUrl.startsWith(supabaseUrl)) {
        // If the URL doesn't start with the Supabase URL, construct it manually
        const correctUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${filePath}`;
        console.log('Corrected URL:', correctUrl);
        return correctUrl;
      }

      return data.publicUrl;
    } catch (uploadErr) {
      console.error('Error during file upload:', uploadErr);
      return null;
    }
  } catch (err) {
    console.error('Unexpected error uploading file:', err);
    return null;
  }
}

/**
 * Get a download URL for an existing file
 * @param filePath The path of the file in the bucket or the full URL
 * @param bucket The storage bucket name (default: 'product-images')
 * @returns The download URL or null if the file doesn't exist
 */
export async function getFileUrl(
  filePath: string | null | undefined,
  bucket: string = 'product-images'
): Promise<string | null> {
  // Handle null, undefined, or empty string
  if (!filePath) {
    return null;
  }

  try {
    const supabase = createClient();

    // Extract just the filename if it's a full URL
    let fileName = filePath;
    if (filePath.startsWith('http')) {
      try {
        const urlObj = new URL(filePath);
        const pathSegments = urlObj.pathname.split('/');
        fileName = pathSegments[pathSegments.length - 1];
      } catch (parseErr) {
        // If URL parsing fails, use the original path
        console.log('Could not parse URL, using original path');
      }
    }

    // If the filename contains query parameters or hash, remove them
    fileName = fileName.split('?')[0].split('#')[0];

    // First try to get a signed URL (works even if bucket is not public)
    try {
      const { data: signedData, error: signedError } = await supabase.storage
        .from(bucket)
        .createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1 year expiry

      if (!signedError && signedData && signedData.signedUrl) {
        return signedData.signedUrl;
      }
    } catch (signedErr) {
      // Silently fall back to public URL
    }

    // Fall back to public URL
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    if (!data || !data.publicUrl) {
      return filePath; // Return original path if we can't get a public URL
    }

    // Ensure the URL is correctly formatted
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl && !data.publicUrl.startsWith(supabaseUrl)) {
      // If the URL doesn't start with the Supabase URL, construct it manually
      const correctUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${fileName}`;
      return correctUrl;
    }

    return data.publicUrl;
  } catch (err) {
    // Return the original URL if there's an error
    return filePath;
  }
}

/**
 * Check if a file exists in the bucket
 * @param filePath The path of the file in the bucket
 * @param bucket The storage bucket name (default: 'product-images')
 * @returns Whether the file exists
 */
export async function checkFileExists(
  filePath: string,
  bucket: string = 'product-images'
): Promise<boolean> {
  try {
    const supabase = createClient();

    // If filePath is a full URL, extract just the filename
    if (filePath.startsWith('http')) {
      const urlObj = new URL(filePath);
      const pathSegments = urlObj.pathname.split('/');
      filePath = pathSegments[pathSegments.length - 1];
    }

    // List files in the bucket with a search for the specific file
    const { data, error } = await supabase.storage
      .from(bucket)
      .list('', {
        search: filePath
      });

    if (error) {
      console.error('Error checking if file exists:', error.message);
      return false;
    }

    // Check if the file exists in the returned list
    return data.some(item => item.name === filePath);
  } catch (err) {
    console.error('Unexpected error checking if file exists:', err);
    return false;
  }
}

/**
 * Delete a file from Supabase Storage
 * @param url The public URL of the file to delete
 * @param bucket The storage bucket name (default: 'product-images')
 * @returns Whether the deletion was successful
 */
export async function deleteFile(
  url: string,
  bucket: string = 'product-images'
): Promise<boolean> {
  try {
    const supabase = createClient();

    // Extract the file path from the URL
    const urlObj = new URL(url);
    const pathSegments = urlObj.pathname.split('/');
    const filePath = pathSegments[pathSegments.length - 1];

    // Delete the file
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('Error deleting file:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Unexpected error deleting file:', err);
    return false;
  }
}
