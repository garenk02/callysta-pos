'use server'

import { createClient } from '@/lib/supabase/server'
import { startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, format } from 'date-fns'
import { headers } from 'next/headers'
import cache from '@/lib/cache'

export type DashboardActionError = {
  message: string
}

export type DashboardActionResult<T = void> = {
  data: T | null
  error: DashboardActionError | null
}

/**
 * Helper function to get or set cached data
 * @param key Cache key
 * @param fetchFn Function to fetch data if not in cache
 * @param ttl Cache TTL in seconds
 * @returns The cached or fetched data
 */
async function getCachedData<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = 300 // 5 minutes default
): Promise<T> {
  // Check if data is in cache
  const cachedData = cache.get<T>(key);
  if (cachedData) {
    return cachedData;
  }

  // If not in cache, fetch data
  const data = await fetchFn();

  // Cache the result
  cache.set(key, data, ttl);

  return data;
}

/**
 * Get today's sales data
 */
export async function getTodaySales(): Promise<DashboardActionResult<{
  total: number
  count: number
}>> {
  try {
    // Generate a cache key for today's sales
    const today = new Date()
    const dateKey = format(today, 'yyyy-MM-dd')
    const cacheKey = `dashboard:todaySales:${dateKey}`

    // Define the fetch function
    const fetchTodaySales = async () => {
      const supabase = await createClient()
      const startOfToday = startOfDay(today).toISOString()
      const endOfToday = endOfDay(today).toISOString()

      // Get orders for today
      const { data, error } = await supabase
        .from('orders')
        .select('total')
        .gte('created_at', startOfToday)
        .lte('created_at', endOfToday)

      if (error) {
        throw new Error(error.message)
      }

      // Calculate total sales and count
      const total = data.reduce((sum, order) => sum + parseFloat(order.total), 0)
      const count = data.length

      return {
        total,
        count
      }
    }

    // Get data with caching (5 minute TTL)
    const data = await getCachedData(cacheKey, fetchTodaySales, 300)

    return {
      data,
      error: null
    }
  } catch (err) {
    console.error('Unexpected error fetching today\'s sales:', err)
    return {
      data: null,
      error: { message: err instanceof Error ? err.message : 'An unexpected error occurred while fetching today\'s sales' }
    }
  }
}

/**
 * Get total sales data for the past week
 */
export async function getTotalSales(): Promise<DashboardActionResult<{
  total: number
  percentChange: number
}>> {
  try {
    // Generate a cache key for total sales
    const today = new Date()
    const dateKey = format(today, 'yyyy-MM-dd')
    const cacheKey = `dashboard:totalSales:${dateKey}`

    // Define the fetch function
    const fetchTotalSales = async () => {
      const supabase = await createClient()

      // Current week
      const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 }).toISOString()
      const endOfCurrentWeek = endOfDay(today).toISOString()

      // Previous week
      const startOfPreviousWeek = startOfWeek(subDays(today, 7), { weekStartsOn: 1 }).toISOString()
      const endOfPreviousWeek = endOfWeek(subDays(today, 7), { weekStartsOn: 1 }).toISOString()

      // Get orders for current week
      const { data: currentWeekData, error: currentWeekError } = await supabase
        .from('orders')
        .select('total')
        .gte('created_at', startOfCurrentWeek)
        .lte('created_at', endOfCurrentWeek)

      if (currentWeekError) {
        throw new Error(currentWeekError.message)
      }

      // Get orders for previous week
      const { data: previousWeekData, error: previousWeekError } = await supabase
        .from('orders')
        .select('total')
        .gte('created_at', startOfPreviousWeek)
        .lte('created_at', endOfPreviousWeek)

      if (previousWeekError) {
        throw new Error(previousWeekError.message)
      }

      // Calculate totals
      const currentWeekTotal = currentWeekData.reduce((sum, order) => sum + parseFloat(order.total), 0)
      const previousWeekTotal = previousWeekData.reduce((sum, order) => sum + parseFloat(order.total), 0)

      // Calculate percent change
      let percentChange = 0
      if (previousWeekTotal > 0) {
        percentChange = ((currentWeekTotal - previousWeekTotal) / previousWeekTotal) * 100
      }

      return {
        total: currentWeekTotal,
        percentChange
      }
    }

    // Get data with caching (5 minute TTL)
    const data = await getCachedData(cacheKey, fetchTotalSales, 300)

    return {
      data,
      error: null
    }
  } catch (err) {
    console.error('Unexpected error fetching total sales:', err)
    return {
      data: null,
      error: { message: err instanceof Error ? err.message : 'An unexpected error occurred while fetching total sales' }
    }
  }
}

/**
 * Get total orders data for the past week
 */
export async function getTotalOrders(): Promise<DashboardActionResult<{
  count: number
  percentChange: number
}>> {
  try {
    // Generate a cache key for total orders
    const today = new Date()
    const dateKey = format(today, 'yyyy-MM-dd')
    const cacheKey = `dashboard:totalOrders:${dateKey}`

    // Define the fetch function
    const fetchTotalOrders = async () => {
      const supabase = await createClient()

      // Current week
      const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 }).toISOString()
      const endOfCurrentWeek = endOfDay(today).toISOString()

      // Previous week
      const startOfPreviousWeek = startOfWeek(subDays(today, 7), { weekStartsOn: 1 }).toISOString()
      const endOfPreviousWeek = endOfWeek(subDays(today, 7), { weekStartsOn: 1 }).toISOString()

      // Get orders for current week
      const { data: currentWeekData, error: currentWeekError } = await supabase
        .from('orders')
        .select('id')
        .gte('created_at', startOfCurrentWeek)
        .lte('created_at', endOfCurrentWeek)

      if (currentWeekError) {
        throw new Error(currentWeekError.message)
      }

      // Get orders for previous week
      const { data: previousWeekData, error: previousWeekError } = await supabase
        .from('orders')
        .select('id')
        .gte('created_at', startOfPreviousWeek)
        .lte('created_at', endOfPreviousWeek)

      if (previousWeekError) {
        throw new Error(previousWeekError.message)
      }

      // Calculate counts
      const currentWeekCount = currentWeekData.length
      const previousWeekCount = previousWeekData.length

      // Calculate percent change
      let percentChange = 0
      if (previousWeekCount > 0) {
        percentChange = ((currentWeekCount - previousWeekCount) / previousWeekCount) * 100
      }

      return {
        count: currentWeekCount,
        percentChange
      }
    }

    // Get data with caching (5 minute TTL)
    const data = await getCachedData(cacheKey, fetchTotalOrders, 300)

    return {
      data,
      error: null
    }
  } catch (err) {
    console.error('Unexpected error fetching total orders:', err)
    return {
      data: null,
      error: { message: err instanceof Error ? err.message : 'An unexpected error occurred while fetching total orders' }
    }
  }
}

/**
 * Get low stock items
 */
export async function getLowStockItems(): Promise<DashboardActionResult<{
  count: number
  items: Array<{ id: string, name: string, stock_quantity: number, threshold: number }>
}>> {
  try {
    // Generate a cache key for low stock items
    const today = new Date()
    const dateKey = format(today, 'yyyy-MM-dd')
    const cacheKey = `dashboard:lowStockItems:${dateKey}`

    // Define the fetch function
    const fetchLowStockItems = async () => {
      const supabase = await createClient()
      const DEFAULT_LOW_STOCK_THRESHOLD = 10 // Default threshold if not specified for a product

      // Get all products with their stock levels and thresholds
      const { data, error } = await supabase
        .from('products')
        .select('id, name, stock_quantity, low_stock_threshold')
        .order('stock_quantity', { ascending: true })

      if (error) {
        throw new Error(error.message)
      }

      // Filter products where stock_quantity is less than their specific low_stock_threshold
      // or the default threshold if not specified
      const lowStockItems = data
        .map(item => ({
          id: item.id,
          name: item.name,
          stock_quantity: item.stock_quantity,
          threshold: item.low_stock_threshold !== null && item.low_stock_threshold !== undefined
            ? item.low_stock_threshold
            : DEFAULT_LOW_STOCK_THRESHOLD
        }))
        .filter(item => item.stock_quantity < item.threshold);

      return {
        count: lowStockItems.length,
        items: lowStockItems
      }
    }

    // Get data with caching (10 minute TTL)
    const data = await getCachedData(cacheKey, fetchLowStockItems, 600)

    return {
      data,
      error: null
    }
  } catch (err) {
    console.error('Unexpected error fetching low stock items:', err)
    return {
      data: null,
      error: { message: err instanceof Error ? err.message : 'An unexpected error occurred while fetching low stock items' }
    }
  }
}

/**
 * Get daily sales for the past week
 */
export async function getDailySales(): Promise<DashboardActionResult<Array<{
  date: string
  displayDate: string
  total: number
}>>> {
  try {
    // Generate a cache key for daily sales
    const today = new Date()
    const dateKey = format(today, 'yyyy-MM-dd')
    const cacheKey = `dashboard:dailySales:${dateKey}`

    // Define the fetch function
    const fetchDailySales = async () => {
      const supabase = await createClient()
      const days = 7 // Number of days to fetch

      // Initialize result array with dates and zero totals
      const result = Array.from({ length: days }, (_, i) => {
        const date = subDays(today, days - 1 - i)
        return {
          date: format(date, 'yyyy-MM-dd'),
          displayDate: format(date, 'EEE'),
          total: 0
        }
      })

      // Get start and end dates for the query
      const startDate = startOfDay(subDays(today, days - 1)).toISOString()
      const endDate = endOfDay(today).toISOString()

      // Fetch orders for the date range
      const { data, error } = await supabase
        .from('orders')
        .select('created_at, total')
        .gte('created_at', startDate)
        .lte('created_at', endDate)

      if (error) {
        throw new Error(error.message)
      }

      // Aggregate sales by date
      data.forEach(order => {
        const orderDate = format(new Date(order.created_at), 'yyyy-MM-dd')
        const resultItem = result.find(item => item.date === orderDate)
        if (resultItem) {
          resultItem.total += parseFloat(order.total)
        }
      })

      return result
    }

    // Get data with caching (10 minute TTL)
    const data = await getCachedData(cacheKey, fetchDailySales, 600)

    return {
      data,
      error: null
    }
  } catch (err) {
    console.error('Unexpected error fetching daily sales:', err)
    return {
      data: null,
      error: { message: err instanceof Error ? err.message : 'An unexpected error occurred while fetching daily sales' }
    }
  }
}

/**
 * Get top selling products for the past week
 */
export async function getTopSellingProducts(): Promise<DashboardActionResult<Array<{
  id: string
  name: string
  quantity: number
  total: number
}>>> {
  try {
    // Generate a cache key for top selling products
    const today = new Date()
    const dateKey = format(today, 'yyyy-MM-dd')
    const cacheKey = `dashboard:topSellingProducts:${dateKey}`

    // Define the fetch function
    const fetchTopSellingProducts = async () => {
      const supabase = await createClient()
      const startDate = startOfDay(subDays(today, 6)).toISOString() // Last 7 days
      const endDate = endOfDay(today).toISOString()

      // First, get all order items for the past week
      const { data: orderItems, error: orderItemsError } = await supabase
        .from('order_items')
        .select('order_id, product_id, product_name, quantity, total')
        .gte('created_at', startDate)
        .lte('created_at', endDate)

      if (orderItemsError) {
        throw new Error(orderItemsError.message)
      }

      // Aggregate by product
      const productMap = new Map<string, { id: string, name: string, quantity: number, total: number }>()

      orderItems.forEach(item => {
        if (!productMap.has(item.product_id)) {
          productMap.set(item.product_id, {
            id: item.product_id,
            name: item.product_name,
            quantity: 0,
            total: 0
          })
        }

        const product = productMap.get(item.product_id)!
        product.quantity += item.quantity
        product.total += parseFloat(item.total)
      })

      // Convert to array and sort by quantity
      const topProducts = Array.from(productMap.values())
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5) // Get top 5

      return topProducts
    }

    // Get data with caching (10 minute TTL)
    const data = await getCachedData(cacheKey, fetchTopSellingProducts, 600)

    return {
      data,
      error: null
    }
  } catch (err) {
    console.error('Unexpected error fetching top selling products:', err)
    return {
      data: null,
      error: { message: err instanceof Error ? err.message : 'An unexpected error occurred while fetching top selling products' }
    }
  }
}
