'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { ImagePlus, X, Loader2 } from "lucide-react"
import Image from "next/image"
import { createClient } from '@/lib/supabase/client'
import { v4 as uuidv4 } from 'uuid'
import { toast } from 'sonner'

interface ProductImageUploadProps {
  value: string
  onChange: (url: string) => void
  onImageChange: (file: File | null) => void
  preview: string | null
  setPreview: (url: string | null) => void
}

export default function ProductImageUpload({
  value,
  onChange,
  onImageChange,
  preview,
  setPreview
}: ProductImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fixedImageUrl, setFixedImageUrl] = useState<string | null>(null)

  // Set preview from value if it exists and preview doesn't
  useEffect(() => {
    async function convertToSignedUrl() {
      if (value && !preview) {
        // Check if it's already a signed URL
        const isSignedUrl = value.includes('/object/sign/') && value.includes('token=');

        if (isSignedUrl) {
          // If it's already a signed URL, use it as is
          // console.log('URL is already a valid signed URL');
          setFixedImageUrl(value);
          setPreview(value);
        } else if (value.includes('/storage/v1/object/public/')) {
          // If it's a public URL, try to convert it to a signed URL
          try {
            // console.log('Converting public URL to signed URL:', value);

            // Extract the bucket and file path from the URL
            const urlObj = new URL(value);
            const pathParts = urlObj.pathname.split('/storage/v1/object/public/');
            if (pathParts.length < 2) {
              setFixedImageUrl(value);
              setPreview(value);
              return;
            }

            const bucketAndPath = pathParts[1];
            const slashIndex = bucketAndPath.indexOf('/');

            if (slashIndex === -1) {
              setFixedImageUrl(value);
              setPreview(value);
              return;
            }

            const bucket = bucketAndPath.substring(0, slashIndex);
            const filePath = bucketAndPath.substring(slashIndex + 1);

            // Create a signed URL
            const supabase = createClient();
            const { data, error } = await supabase.storage
              .from(bucket)
              .createSignedUrl(filePath, 60 * 60 * 24 * 365 * 10); // 10 years expiry

            if (error) {
              console.error('Error creating signed URL:', error);
              setFixedImageUrl(value);
            } else {
              // console.log('Created signed URL:', data.signedUrl);
              setFixedImageUrl(data.signedUrl);
            }

            setPreview(value);
          } catch (err) {
            console.error('Error converting to signed URL:', err);
            setFixedImageUrl(value);
            setPreview(value);
          }
        } else {
          // If it's not a Supabase URL, use it as is
          setFixedImageUrl(value);
          setPreview(value);
        }
      } else if (!value) {
        setFixedImageUrl(null);
      }
    }

    convertToSignedUrl();
  }, [value, preview, setPreview]);

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0]
      if (!file) return

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB')
        return
      }

      // Create a preview
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setPreview(event.target.result as string)
        }
      }
      reader.readAsDataURL(file)

      onImageChange(file)

      // Upload the file
      await uploadImage(file)
    } catch (error: any) {
      console.error('Error handling file selection:', error)
      toast.error(error?.message || 'Failed to process the selected image')
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Upload image to Supabase Storage
  const uploadImage = async (file: File) => {
    setIsUploading(true)
    try {
      const supabase = createClient()

      // Check if Supabase client is properly initialized
      if (!supabase) {
        throw new Error('Failed to initialize Supabase client')
      }

      // Generate a unique filename
      const fileExt = file.name.split('.').pop() || 'jpg'
      const fileName = `${uuidv4()}.${fileExt}`
      const filePath = `products/${fileName}`

      // Upload the file
      const { error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file)

      if (error) {
        throw error
      }

      // Get a signed URL instead of a public URL (valid for 10 years)
      const { data: signedData, error: signError } = await supabase.storage
        .from('product-images')
        .createSignedUrl(filePath, 60 * 60 * 24 * 365 * 10) // 10 years expiry

      if (signError) {
        console.error('Error creating signed URL:', signError);
        throw signError;
      }

      // console.log('Image uploaded successfully, signed URL:', signedData.signedUrl);

      // Set the signed URL for display
      setFixedImageUrl(signedData.signedUrl);

      // Update the form value with the signed URL
      onChange(signedData.signedUrl)

      toast.success('Image uploaded successfully')
    } catch (error: any) {
      console.error('Error uploading image:', error)
      // Provide more specific error message if available
      const errorMessage = error?.message || 'Failed to upload image'
      toast.error(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }

  // Handle removing the image
  const handleRemoveImage = () => {
    // console.log('Removing image, setting image_url to empty string')
    onChange('')
    setPreview(null)
    setFixedImageUrl(null)
    onImageChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Trigger file input click
  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {preview ? (
        <div className="relative w-full h-40 border rounded-md overflow-hidden">
          {/* Use next/image with error handling */}
          {fixedImageUrl ? (
            <Image
              src={fixedImageUrl}
              alt="Product preview"
              fill
              className="object-contain"
              onError={(e) => {
                console.log('Image failed to load:', e);
                // If the fixed URL fails, try falling back to an img tag
                const imgElement = e.currentTarget;
                if (imgElement.parentElement) {
                  const fallbackImg = document.createElement('img');
                  fallbackImg.src = fixedImageUrl;
                  fallbackImg.alt = "Product preview";
                  fallbackImg.className = "object-contain w-full h-full";
                  imgElement.parentElement.appendChild(fallbackImg);
                  imgElement.style.display = 'none';
                }
              }}
              unoptimized={fixedImageUrl.startsWith('data:')} // Don't optimize data URLs
            />
          ) : (
            <div className="flex items-center justify-center h-full w-full bg-muted">
              <p className="text-sm text-muted-foreground">Image URL not valid</p>
            </div>
          )}
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8"
            onClick={handleRemoveImage}
            disabled={isUploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          onClick={handleButtonClick}
          className="w-full h-40 border border-dashed rounded-md flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted/50 transition-colors"
        >
          <ImagePlus className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Click to upload product image
          </p>
        </div>
      )}

      {isUploading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Uploading image...</span>
        </div>
      )}

      <input
        type="hidden"
        value={value || ''}
      />
    </div>
  )
}
