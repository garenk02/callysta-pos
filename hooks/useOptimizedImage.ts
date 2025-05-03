'use client'

import { useState, useEffect } from 'react'
import cache from '@/lib/cache'

interface ImageCache {
  src: string
  width: number
  height: number
  placeholder?: string
}

/**
 * Hook for optimizing image loading with caching
 * @param src Image source URL
 * @param options Options for image optimization
 * @returns [optimizedSrc, isLoading, error]
 */
export function useOptimizedImage(
  src: string | null | undefined,
  options?: {
    width?: number
    height?: number
    quality?: number
    format?: 'webp' | 'jpeg' | 'png' | 'avif'
    generatePlaceholder?: boolean
  }
): [string | null, boolean, Error | null] {
  const {
    width,
    height,
    quality = 80,
    format = 'webp',
    generatePlaceholder = false,
  } = options || {}

  const [optimizedSrc, setOptimizedSrc] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(!!src)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!src) {
      setOptimizedSrc(null)
      setIsLoading(false)
      return
    }

    // Generate a cache key based on the parameters
    const cacheKey = `image:${src}:${width}:${height}:${quality}:${format}`

    // Check if the image is already cached
    const cachedImage = cache.get<ImageCache>(cacheKey)
    if (cachedImage) {
      setOptimizedSrc(cachedImage.src)
      setIsLoading(false)
      return
    }

    // Function to optimize the image
    const optimizeImage = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // For now, we'll just use the original image
        // In a real implementation, you would use an image optimization service
        // or Next.js Image component
        let optimizedUrl = src

        // If using Supabase storage, we can add transformation parameters
        if (src.includes('supabase.co/storage/v1/object/public')) {
          const url = new URL(src)
          
          // Add width parameter if specified
          if (width) {
            url.searchParams.append('width', width.toString())
          }
          
          // Add height parameter if specified
          if (height) {
            url.searchParams.append('height', height.toString())
          }
          
          // Add format parameter if specified
          url.searchParams.append('format', format)
          
          // Add quality parameter
          url.searchParams.append('quality', quality.toString())
          
          optimizedUrl = url.toString()
        }

        // Cache the optimized image
        cache.set(
          cacheKey,
          {
            src: optimizedUrl,
            width: width || 0,
            height: height || 0,
          },
          60 * 60 // Cache for 1 hour
        )

        setOptimizedSrc(optimizedUrl)
      } catch (err) {
        console.error('Error optimizing image:', err)
        setError(err instanceof Error ? err : new Error('Failed to optimize image'))
        setOptimizedSrc(src) // Fall back to original source
      } finally {
        setIsLoading(false)
      }
    }

    optimizeImage()
  }, [src, width, height, quality, format, generatePlaceholder])

  return [optimizedSrc, isLoading, error]
}
