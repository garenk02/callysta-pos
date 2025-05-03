'use client'

import { useEffect, useState } from 'react'
import { checkBucketExists, getBucketDetails } from '@/app/api/storage/actions'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle, Loader2, ExternalLink } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface StorageInitializerProps {
  bucketId: string
  isPublic?: boolean
  onSuccess?: () => void
}

export function StorageInitializer({ bucketId, isPublic = true, onSuccess }: StorageInitializerProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [bucketDetails, setBucketDetails] = useState<{
    id: string;
    name: string;
    public: boolean;
  } | null>(null)

  // Check if bucket exists on component mount
  useEffect(() => {
    checkStorageBucket()
  }, [])

  const checkStorageBucket = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await checkBucketExists(bucketId)

      if (error) {
        setError(error.message)
        toast.error(`Failed to check storage bucket: ${error.message}`)
      } else if (data) {
        if (data.exists) {
          // Bucket exists, get details
          const { data: details, error: detailsError } = await getBucketDetails(bucketId)

          if (detailsError) {
            console.error('Error getting bucket details:', detailsError.message)
          } else if (details) {
            setBucketDetails(details)
            setSuccess(true)
            // Call onSuccess callback if provided
            if (onSuccess) {
              onSuccess()
            }
          }
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      setError(errorMessage)
      toast.error(`Error: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {loading ? (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Checking Storage</AlertTitle>
          <AlertDescription>
            Checking if the storage bucket "{bucketId}" exists...
          </AlertDescription>
        </Alert>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            <p>Failed to check storage: {error}</p>
            <p className="mt-2">
              This is likely due to a Row Level Security (RLS) policy restriction. Please create the bucket manually in the Supabase dashboard.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => window.open('https://supabase.com/dashboard/project/_/storage/buckets', '_blank')}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Open Supabase Dashboard
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 ml-2"
              onClick={checkStorageBucket}
            >
              <Loader2 className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Check Again
            </Button>
          </AlertDescription>
        </Alert>
      ) : success && bucketDetails ? (
        <Alert variant="success">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Storage Ready</AlertTitle>
          <AlertDescription>
            <p>The storage bucket "{bucketId}" is ready to use.</p>
            <p className="text-xs mt-1">
              {bucketDetails.public
                ? "This bucket is public, so uploaded files will be accessible without authentication."
                : "This bucket is private. You may need to adjust permissions to access files."}
            </p>
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Storage Setup Required</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <p>
              The storage bucket "{bucketId}" needs to be created in the Supabase dashboard before you can upload images.
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Button
                variant="outline"
                onClick={() => window.open('https://supabase.com/dashboard/project/_/storage/buckets', '_blank')}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Supabase Dashboard
              </Button>
              <Button
                variant="outline"
                onClick={checkStorageBucket}
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Check Again
              </Button>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              <p>Steps to create a bucket:</p>
              <ol className="list-decimal pl-5 space-y-1 mt-1">
                <li>Go to the Supabase dashboard</li>
                <li>Navigate to Storage</li>
                <li>Click "New Bucket"</li>
                <li>Enter "{bucketId}" as the bucket name</li>
                <li>Enable "Public bucket" if you want files to be publicly accessible</li>
                <li>Click "Create bucket"</li>
              </ol>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
