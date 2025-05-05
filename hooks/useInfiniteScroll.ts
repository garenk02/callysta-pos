'use client'

import { useState, useEffect, useCallback } from 'react'

interface UseInfiniteScrollOptions<T> {
  initialData?: T[]
  fetchData: (cursor?: string) => Promise<{
    data: T[]
    nextCursor?: string
  }>
  enabled?: boolean
}

/**
 * A hook for implementing infinite scrolling
 */
export function useInfiniteScroll<T>({
  initialData = [],
  fetchData,
  enabled = true
}: UseInfiniteScrollOptions<T>) {
  const [data, setData] = useState<T[]>(initialData)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [cursor, setCursor] = useState<string | undefined>(undefined)

  const loadMore = useCallback(async () => {
    if (!enabled || loading || !hasMore) return
    
    setLoading(true)
    setError(null)
    
    try {
      const result = await fetchData(cursor)
      
      setData(prev => [...prev, ...result.data])
      setCursor(result.nextCursor)
      setHasMore(!!result.nextCursor)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load data'))
    } finally {
      setLoading(false)
    }
  }, [cursor, enabled, fetchData, hasMore, loading])

  // Initial load
  useEffect(() => {
    if (enabled && data.length === 0) {
      loadMore()
    }
  }, [enabled, data.length, loadMore])

  return {
    data,
    loading,
    error,
    hasMore,
    loadMore
  }
}
