'use client'

import * as React from 'react'
import { UploadCloud, X, Image, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { getFileUrl } from '@/lib/supabase/storage'

interface FileUploadProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onFileUpload: (file: File) => Promise<string | null>
  onFileRemove?: () => void
  value?: string
  isUploading?: boolean
  className?: string
  accept?: string
  maxSizeMB?: number
}

const FileUpload = React.forwardRef<HTMLInputElement, FileUploadProps>(
  (
    {
      className,
      onFileUpload,
      onFileRemove,
      value,
      isUploading = false,
      accept = 'image/*',
      maxSizeMB = 5,
      ...props
    },
    ref
  ) => {
    const [preview, setPreview] = React.useState<string | null>(value || null)
    const [processedUrl, setProcessedUrl] = React.useState<string | null>(value || null)
    const [error, setError] = React.useState<string | null>(null)
    const [uploading, setUploading] = React.useState<boolean>(isUploading)
    const [imageLoaded, setImageLoaded] = React.useState<boolean>(false)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    // Update preview when value changes
    React.useEffect(() => {
      setPreview(value || null)
      setImageLoaded(false)

      // Try to get a valid URL for the image if it's a Supabase URL
      if (value) {
        let isMounted = true;

        const fetchImageUrl = async () => {
          try {
            const url = await getFileUrl(value);
            if (isMounted) {
              setProcessedUrl(url || value);
            }
          } catch (error) {
            if (isMounted) {
              // Silently handle error and fallback to original URL
              setProcessedUrl(value);
            }
          }
        };

        fetchImageUrl();

        return () => {
          isMounted = false;
        };
      } else {
        setProcessedUrl(null);
      }
    }, [value])

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      // Validate file size
      const maxSizeBytes = maxSizeMB * 1024 * 1024
      if (file.size > maxSizeBytes) {
        setError(`File size exceeds ${maxSizeMB}MB limit`)
        return
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed')
        return
      }

      setError(null)
      setUploading(true)

      try {
        // Create a local preview
        const objectUrl = URL.createObjectURL(file)
        setPreview(objectUrl)

        // Upload the file
        const uploadedUrl = await onFileUpload(file)

        if (!uploadedUrl) {
          setError('Failed to upload file')
          setPreview(value || null) // Revert to previous preview
        }
      } catch (err) {
        console.error('Error uploading file:', err)
        setError('Failed to upload file')
        setPreview(value || null) // Revert to previous preview
      } finally {
        setUploading(false)
      }
    }

    const handleRemove = (e: React.MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()

      setPreview(null)
      setError(null)

      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Call the onFileRemove callback if provided
      if (onFileRemove) {
        onFileRemove()
      }
    }

    const handleClick = () => {
      fileInputRef.current?.click()
    }

    return (
      <div className={cn('space-y-2', className)}>
        <div
          onClick={handleClick}
          className={cn(
            'border-input bg-background hover:bg-accent hover:text-accent-foreground relative flex min-h-[100px] cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed px-4 py-2 text-center transition-colors',
            error && 'border-destructive',
            preview && 'border-solid'
          )}
        >
          {uploading ? (
            <div className="flex flex-col items-center justify-center space-y-1">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Uploading...</p>
            </div>
          ) : preview ? (
            <div className="relative h-full w-full">
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}
              <img
                src={processedUrl || preview}
                alt="Preview"
                className="mx-auto max-h-[80px] max-w-full object-contain"
                onLoad={() => setImageLoaded(true)}
                onError={() => {
                  // If the processed URL fails, try the original URL
                  if (processedUrl !== preview && preview) {
                    setProcessedUrl(preview);
                  } else {
                    setImageLoaded(false);
                  }
                }}
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -right-3 -top-3 h-6 w-6 rounded-full"
                onClick={handleRemove}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-1">
              <UploadCloud className="h-8 w-8 text-muted-foreground" />
              <div className="space-y-0.5">
                <p className="text-xs font-medium">Click to upload</p>
                <p className="text-xs text-muted-foreground">
                  Image up to {maxSizeMB}MB
                </p>
              </div>
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
            accept={accept}
            disabled={uploading}
            {...props}
          />
        </div>

        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}
      </div>
    )
  }
)

FileUpload.displayName = 'FileUpload'

export { FileUpload }
