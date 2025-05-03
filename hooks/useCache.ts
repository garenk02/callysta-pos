'use client'

import { useState, useEffect } from 'react'
import cache from '@/lib/cache'

/**
 * React hook for using the cache in components
 * @param key Cache key
 * @param factory Function to generate a value if not in cache
 * @param ttl Time to live in seconds (optional)
 * @param deps Dependencies array to trigger refetching (optional)
 * @returns [data, loading, error]
 */
export function useCache<T>(
  key: string,
  factory: () => Promise<T>,
  ttl?: number,
  deps: any[] = []
): [T | undefined, boolean, Error | null] {
  const [data, setData] = useState<T | undefined>(cache.get<T>(key))
  const [loading, setLoading] = useState(!data)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let isMounted = true
    
    const fetchData = async () => {
      if (cache.has(key)) {
        const cachedData = cache.get<T>(key)
        if (isMounted) {
          setData(cachedData)
          setLoading(false)
        }
        return
      }

      setLoading(true)
      setError(null)

      try {
        const result = await cache.getOrSet<T>(key, factory, ttl)
        if (isMounted) {
          setData(result)
        }
      } catch (err) {
        console.error(`Error fetching data for cache key ${key}:`, err)
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('An unknown error occurred'))
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      isMounted = false
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ttl, ...deps])

  return [data, loading, error]
}

/**
 * Invalidate a cache entry
 * @param key Cache key to invalidate
 */
export function invalidateCache(key: string): void {
  cache.delete(key)
}

/**
 * Clear the entire cache
 */
export function clearCache(): void {
  cache.clear()
}
