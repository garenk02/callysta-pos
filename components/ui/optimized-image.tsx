'use client'

import React from 'react'
import Image from 'next/image'
import { useOptimizedImage } from '@/hooks/useOptimizedImage'
import { cn } from '@/lib/utils'
import { Skeleton } from './skeleton'

interface OptimizedImageProps extends React.ComponentPropsWithoutRef<typeof Image> {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  fallbackSrc?: string
  quality?: number
  format?: 'webp' | 'jpeg' | 'png' | 'avif'
  showSkeleton?: boolean
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  fallbackSrc,
  quality = 80,
  format = 'webp',
  showSkeleton = true,
  ...props
}: OptimizedImageProps) {
  const [optimizedSrc, isLoading, error] = useOptimizedImage(src, {
    width,
    height,
    quality,
    format,
  })

  const [imgSrc, setImgSrc] = React.useState<string | null>(optimizedSrc)
  const [imgLoaded, setImgLoaded] = React.useState(false)

  // Update imgSrc when optimizedSrc changes
  React.useEffect(() => {
    setImgSrc(optimizedSrc)
  }, [optimizedSrc])

  // Handle image load error
  const handleError = () => {
    if (fallbackSrc) {
      setImgSrc(fallbackSrc)
    }
  }

  // Handle image load success
  const handleLoad = () => {
    setImgLoaded(true)
  }

  // If no src or error and no fallback, return null
  if ((!src && !fallbackSrc) || (error && !fallbackSrc)) {
    return null
  }

  return (
    <div className={cn('relative', className)}>
      {(isLoading || !imgLoaded) && showSkeleton && (
        <Skeleton
          className={cn(
            'absolute inset-0 z-10',
            imgLoaded && 'animate-fade-out'
          )}
          style={{ width, height }}
        />
      )}
      {imgSrc && (
        <Image
          src={imgSrc}
          alt={alt}
          width={width}
          height={height}
          onError={handleError}
          onLoad={handleLoad}
          className={cn(
            'object-cover',
            (isLoading || !imgLoaded) && 'opacity-0',
            imgLoaded && 'animate-fade-in'
          )}
          {...props}
        />
      )}
    </div>
  )
}
