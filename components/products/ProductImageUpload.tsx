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
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file)

      if (error) {
        throw error
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

      // Update the form value
      onChange(publicUrl)

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
    onChange('')
    setPreview(null)
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
          <Image
            src={preview}
            alt="Product preview"
            fill
            className="object-contain"
          />
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
