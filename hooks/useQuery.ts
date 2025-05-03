'use client'

import { useState, useEffect } from 'react'
import cache from '@/lib/cache'

/**
 * A simple React Query-like hook for data fetching with caching
 * @param queryKey Unique key for the query
 * @param queryFn Function to fetch data
 * @param options Options for the query
 * @returns [data, isLoading, error, refetch]
 */
export function useQuery<T>(
  queryKey: string,
  queryFn: () => Promise<T>,
  options?: {
    enabled?: boolean
    staleTime?: number
    cacheTime?: number
    onSuccess?: (data: T) => void
    onError?: (error: Error) => void
    initialData?: T
  }
): [T | undefined, boolean, Error | null, () => Promise<void>] {
  const {
    enabled = true,
    staleTime = 0,
    cacheTime = 5 * 60 * 1000, // 5 minutes
    onSuccess,
    onError,
    initialData
  } = options || {}

  const [data, setData] = useState<T | undefined>(() => {
    // Try to get data from cache first
    const cachedData = cache.get<{ data: T; timestamp: number }>(queryKey)
    if (cachedData) {
      // Check if data is stale
      const isStale = staleTime > 0 && Date.now() - cachedData.timestamp > staleTime
      if (!isStale) {
        return cachedData.data
      }
    }
    return initialData
  })
  
  const [isLoading, setIsLoading] = useState(!data && enabled)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await queryFn()
      setData(result)
      
      // Cache the result
      cache.set(
        queryKey,
        { data: result, timestamp: Date.now() },
        cacheTime / 1000 // Convert to seconds
      )
      
      if (onSuccess) {
        onSuccess(result)
      }
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('An unknown error occurred')
      setError(errorObj)
      
      if (onError) {
        onError(errorObj)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch data when enabled changes or on mount if enabled
  useEffect(() => {
    if (enabled) {
      fetchData()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, queryKey])

  // Function to manually refetch data
  const refetch = async () => {
    await fetchData()
  }

  return [data, isLoading, error, refetch]
}

/**
 * Invalidate a query cache entry
 * @param queryKey Query key to invalidate
 */
export function invalidateQuery(queryKey: string): void {
  cache.delete(queryKey)
}

/**
 * Prefetch and cache data for a query
 * @param queryKey Query key
 * @param queryFn Function to fetch data
 * @param cacheTime Cache time in milliseconds
 */
export async function prefetchQuery<T>(
  queryKey: string,
  queryFn: () => Promise<T>,
  cacheTime: number = 5 * 60 * 1000 // 5 minutes
): Promise<void> {
  try {
    const result = await queryFn()
    cache.set(
      queryKey,
      { data: result, timestamp: Date.now() },
      cacheTime / 1000 // Convert to seconds
    )
  } catch (error) {
    console.error(`Error prefetching query ${queryKey}:`, error)
  }
}
