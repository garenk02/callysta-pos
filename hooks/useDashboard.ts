'use client'

import { useQuery } from './useQuery'
import {
  getTodaySales,
  getTotalSales,
  getTotalOrders,
  getLowStockItems,
  getDailySales,
  getTopSellingProducts
} from "@/app/api/dashboard/actions";

/**
 * Hook for fetching today's sales data with caching
 */
export function useTodaySales(options?: {
  enabled?: boolean
  staleTime?: number
  cacheTime?: number
}) {
  const {
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime = 10 * 60 * 1000, // 10 minutes
  } = options || {}

  const queryKey = 'dashboard:todaySales'

  const queryFn = async () => {
    const result = await getTodaySales()
    if (result.error) {
      throw new Error(result.error.message)
    }
    return result.data
  }

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
    todaySales: data,
    isLoading,
    error,
    refetch,
  }
}

/**
 * Hook for fetching total sales data with caching
 */
export function useTotalSales(options?: {
  enabled?: boolean
  staleTime?: number
  cacheTime?: number
}) {
  const {
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime = 10 * 60 * 1000, // 10 minutes
  } = options || {}

  const queryKey = 'dashboard:totalSales'

  const queryFn = async () => {
    const result = await getTotalSales()
    if (result.error) {
      throw new Error(result.error.message)
    }
    return result.data
  }

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
    totalSales: data,
    isLoading,
    error,
    refetch,
  }
}

/**
 * Hook for fetching total orders data with caching
 */
export function useTotalOrders(options?: {
  enabled?: boolean
  staleTime?: number
  cacheTime?: number
}) {
  const {
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime = 10 * 60 * 1000, // 10 minutes
  } = options || {}

  const queryKey = 'dashboard:totalOrders'

  const queryFn = async () => {
    const result = await getTotalOrders()
    if (result.error) {
      throw new Error(result.error.message)
    }
    return result.data
  }

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
    totalOrders: data,
    isLoading,
    error,
    refetch,
  }
}

/**
 * Hook for fetching low stock items with caching
 */
export function useLowStockItems(options?: {
  enabled?: boolean
  staleTime?: number
  cacheTime?: number
}) {
  const {
    enabled = true,
    staleTime = 10 * 60 * 1000, // 10 minutes
    cacheTime = 15 * 60 * 1000, // 15 minutes
  } = options || {}

  const queryKey = 'dashboard:lowStockItems'

  const queryFn = async () => {
    const result = await getLowStockItems()
    if (result.error) {
      throw new Error(result.error.message)
    }
    return result.data
  }

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
    lowStockItems: data,
    isLoading,
    error,
    refetch,
  }
}

/**
 * Hook for fetching daily sales data with caching
 */
export function useDailySales(options?: {
  enabled?: boolean
  staleTime?: number
  cacheTime?: number
}) {
  const {
    enabled = true,
    staleTime = 10 * 60 * 1000, // 10 minutes
    cacheTime = 15 * 60 * 1000, // 15 minutes
  } = options || {}

  const queryKey = 'dashboard:dailySales'

  const queryFn = async () => {
    const result = await getDailySales()
    if (result.error) {
      throw new Error(result.error.message)
    }
    return result.data
  }

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
    dailySales: data,
    isLoading,
    error,
    refetch,
  }
}

/**
 * Hook for fetching top selling products with caching
 */
export function useTopSellingProducts(options?: {
  enabled?: boolean
  staleTime?: number
  cacheTime?: number
}) {
  const {
    enabled = true,
    staleTime = 10 * 60 * 1000, // 10 minutes
    cacheTime = 15 * 60 * 1000, // 15 minutes
  } = options || {}

  const queryKey = 'dashboard:topSellingProducts'

  const queryFn = async () => {
    const result = await getTopSellingProducts()
    if (result.error) {
      throw new Error(result.error.message)
    }
    return result.data
  }

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
    topProducts: data,
    isLoading,
    error,
    refetch,
  }
}

/**
 * Hook for fetching all dashboard data with caching
 */
export function useDashboardData(options?: {
  enabled?: boolean
  staleTime?: number
  cacheTime?: number
}) {
  const todaySales = useTodaySales(options)
  const totalSales = useTotalSales(options)
  const totalOrders = useTotalOrders(options)
  const lowStockItems = useLowStockItems(options)
  const dailySales = useDailySales(options)
  const topSellingProducts = useTopSellingProducts(options)

  const isLoading = 
    todaySales.isLoading || 
    totalSales.isLoading || 
    totalOrders.isLoading || 
    lowStockItems.isLoading || 
    dailySales.isLoading || 
    topSellingProducts.isLoading

  const error = 
    todaySales.error || 
    totalSales.error || 
    totalOrders.error || 
    lowStockItems.error || 
    dailySales.error || 
    topSellingProducts.error

  const refetchAll = async () => {
    await Promise.all([
      todaySales.refetch(),
      totalSales.refetch(),
      totalOrders.refetch(),
      lowStockItems.refetch(),
      dailySales.refetch(),
      topSellingProducts.refetch()
    ])
  }

  return {
    todaySales: todaySales.todaySales,
    totalSales: totalSales.totalSales,
    totalOrders: totalOrders.totalOrders,
    lowStockItems: lowStockItems.lowStockItems,
    dailySales: dailySales.dailySales,
    topProducts: topSellingProducts.topProducts,
    isLoading,
    error,
    refetch: refetchAll
  }
}

/**
 * Invalidate all dashboard-related cache entries
 */
export function invalidateDashboardCache() {
  // Import dynamically to avoid circular dependencies
  import('./useQuery').then(({ invalidateQuery }) => {
    invalidateQuery('dashboard:todaySales')
    invalidateQuery('dashboard:totalSales')
    invalidateQuery('dashboard:totalOrders')
    invalidateQuery('dashboard:lowStockItems')
    invalidateQuery('dashboard:dailySales')
    invalidateQuery('dashboard:topSellingProducts')
  })
}
