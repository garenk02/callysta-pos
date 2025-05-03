'use client'

import { useQuery, invalidateQuery } from './useQuery'
import { getProductsClient, getProductByIdClient } from '@/lib/supabase/client-queries'
import { Product } from '@/types'
import cache from '@/lib/cache'

/**
 * Hook for fetching products with caching
 */
export function useProducts(options?: {
  page?: number
  pageSize?: number
  searchQuery?: string
  category?: string
  isActive?: boolean
  enabled?: boolean
  staleTime?: number
  cacheTime?: number
}) {
  const {
    page = 1,
    pageSize = 10,
    searchQuery = '',
    category,
    isActive,
    enabled = true,
    staleTime = 60 * 1000, // 1 minute
    cacheTime = 5 * 60 * 1000, // 5 minutes
  } = options || {}

  // Generate a query key based on the parameters
  const queryKey = `products:${page}:${pageSize}:${searchQuery}:${category}:${isActive}`

  // Define the query function
  const queryFn = async () => {
    const result = await getProductsClient({
      page,
      pageSize,
      searchQuery,
      category,
      isActive,
      useCache: false, // Don't use the built-in cache since we're using our own
    })

    if (result.error) {
      throw result.error
    }

    return {
      products: result.products || [],
      totalCount: result.totalCount || 0,
      page: result.page || page,
      pageSize: result.pageSize || pageSize,
      totalPages: result.totalPages || 1,
    }
  }

  // Use the query hook
  const [data, isLoading, error, refetch] = useQuery(
    queryKey,
    queryFn,
    {
      enabled,
      staleTime,
      cacheTime,
    }
  )

  return {
    products: data?.products || [],
    totalCount: data?.totalCount || 0,
    page: data?.page || page,
    pageSize: data?.pageSize || pageSize,
    totalPages: data?.totalPages || 1,
    isLoading,
    error,
    refetch,
  }
}

/**
 * Hook for fetching a single product by ID with caching
 */
export function useProduct(productId: string, options?: {
  enabled?: boolean
  staleTime?: number
  cacheTime?: number
}) {
  const {
    enabled = true,
    staleTime = 60 * 1000, // 1 minute
    cacheTime = 5 * 60 * 1000, // 5 minutes
  } = options || {}

  // Generate a query key
  const queryKey = `product:${productId}`

  // Define the query function
  const queryFn = async () => {
    const result = await getProductByIdClient(productId, {
      useCache: false, // Don't use the built-in cache since we're using our own
    })

    if (result.error) {
      throw result.error
    }

    return result.data
  }

  // Use the query hook
  const [data, isLoading, error, refetch] = useQuery<Product | null>(
    queryKey,
    queryFn,
    {
      enabled: enabled && !!productId,
      staleTime,
      cacheTime,
    }
  )

  return {
    product: data,
    isLoading,
    error,
    refetch,
  }
}

/**
 * Invalidate all product-related queries
 */
export function invalidateProductQueries() {
  // Get all cache keys
  const keys = Array.from(cache['cache'].keys())

  // Invalidate all product-related cache entries
  keys.forEach(key => {
    if (key.startsWith('product:') || key.startsWith('products:')) {
      invalidateQuery(key)
    }
  })
}

/**
 * Invalidate a specific product query
 */
export function invalidateProductQuery(productId: string) {
  invalidateQuery(`product:${productId}`)
}
