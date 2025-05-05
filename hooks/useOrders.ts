'use client'

import { useQuery, invalidateQuery } from './useQuery'
import { getOrderById } from '@/app/api/orders/actions'
import { OrderWithUser } from '@/app/api/orders/actions'
import { OrderItem } from '@/types'
import cache from '@/lib/cache'

/**
 * Hook for fetching order details with caching
 */
export function useOrderDetails(orderId: string, options?: {
  enabled?: boolean
  staleTime?: number
  cacheTime?: number
}) {
  const {
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime = 15 * 60 * 1000, // 15 minutes
  } = options || {}

  // Generate a query key
  const queryKey = `order:${orderId}`

  // Define the query function
  const queryFn = async () => {
    const result = await getOrderById(orderId)

    if (result.error) {
      throw new Error(result.error.message)
    }

    return result.data
  }

  // Use the query hook
  const [data, isLoading, error, refetch] = useQuery<{
    order: OrderWithUser
    items: OrderItem[]
  } | undefined>(
    queryKey,
    queryFn,
    {
      enabled: enabled && !!orderId,
      staleTime,
      cacheTime,
    }
  )

  return {
    orderDetails: data,
    isLoading,
    error,
    refetch,
  }
}

/**
 * Invalidate all order-related queries
 */
export function invalidateOrderQueries() {
  // Get all cache keys
  const keys = Array.from(cache['cache'].keys())

  // Invalidate all order-related cache entries
  keys.forEach(key => {
    if (key.startsWith('order:') || key.startsWith('orders:')) {
      invalidateQuery(key)
    }
  })
}

/**
 * Invalidate a specific order query
 */
export function invalidateOrderQuery(orderId: string) {
  invalidateQuery(`order:${orderId}`)
}
