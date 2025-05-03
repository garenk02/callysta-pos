'use server'

import { createClient } from '@/lib/supabase/server'
import { startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, format } from 'date-fns'

export type DashboardActionError = {
  message: string
}

export type DashboardActionResult<T = void> = {
  data: T | null
  error: DashboardActionError | null
}

/**
 * Get today's sales data
 */
export async function getTodaySales(): Promise<DashboardActionResult<{
  total: number
  count: number
}>> {
  try {
    const supabase = await createClient()
    const today = new Date()
    const startOfToday = startOfDay(today).toISOString()
    const endOfToday = endOfDay(today).toISOString()

    // Get orders for today
    const { data, error } = await supabase
      .from('orders')
      .select('total')
      .gte('created_at', startOfToday)
      .lte('created_at', endOfToday)

    if (error) {
      console.error('Error fetching today\'s sales:', error.message)
      return {
        data: null,
        error: { message: error.message }
      }
    }

    // Calculate total sales and count
    const total = data.reduce((sum, order) => sum + parseFloat(order.total), 0)
    const count = data.length

    return {
      data: {
        total,
        count
      },
      error: null
    }
  } catch (err) {
    console.error('Unexpected error fetching today\'s sales:', err)
    return {
      data: null,
      error: { message: 'An unexpected error occurred while fetching today\'s sales' }
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
    const supabase = await createClient()
    const today = new Date()

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
      console.error('Error fetching current week sales:', currentWeekError.message)
      return {
        data: null,
        error: { message: currentWeekError.message }
      }
    }

    // Get orders for previous week
    const { data: previousWeekData, error: previousWeekError } = await supabase
      .from('orders')
      .select('total')
      .gte('created_at', startOfPreviousWeek)
      .lte('created_at', endOfPreviousWeek)

    if (previousWeekError) {
      console.error('Error fetching previous week sales:', previousWeekError.message)
      return {
        data: null,
        error: { message: previousWeekError.message }
      }
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
      data: {
        total: currentWeekTotal,
        percentChange
      },
      error: null
    }
  } catch (err) {
    console.error('Unexpected error fetching total sales:', err)
    return {
      data: null,
      error: { message: 'An unexpected error occurred while fetching total sales' }
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
    const supabase = await createClient()
    const today = new Date()

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
      console.error('Error fetching current week orders:', currentWeekError.message)
      return {
        data: null,
        error: { message: currentWeekError.message }
      }
    }

    // Get orders for previous week
    const { data: previousWeekData, error: previousWeekError } = await supabase
      .from('orders')
      .select('id')
      .gte('created_at', startOfPreviousWeek)
      .lte('created_at', endOfPreviousWeek)

    if (previousWeekError) {
      console.error('Error fetching previous week orders:', previousWeekError.message)
      return {
        data: null,
        error: { message: previousWeekError.message }
      }
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
      data: {
        count: currentWeekCount,
        percentChange
      },
      error: null
    }
  } catch (err) {
    console.error('Unexpected error fetching total orders:', err)
    return {
      data: null,
      error: { message: 'An unexpected error occurred while fetching total orders' }
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
    const supabase = await createClient()
    const DEFAULT_LOW_STOCK_THRESHOLD = 10 // Default threshold if not specified for a product

    // Get all products with their stock levels and thresholds
    const { data, error } = await supabase
      .from('products')
      .select('id, name, stock_quantity, low_stock_threshold')
      .order('stock_quantity', { ascending: true })

    if (error) {
      console.error('Error fetching products for low stock check:', error.message)
      return {
        data: null,
        error: { message: error.message }
      }
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
      data: {
        count: lowStockItems.length,
        items: lowStockItems
      },
      error: null
    }
  } catch (err) {
    console.error('Unexpected error fetching low stock items:', err)
    return {
      data: null,
      error: { message: 'An unexpected error occurred while fetching low stock items' }
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
    const supabase = await createClient()
    const today = new Date()
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
      console.error('Error fetching daily sales:', error.message)
      return {
        data: null,
        error: { message: error.message }
      }
    }

    // Aggregate sales by date
    data.forEach(order => {
      const orderDate = format(new Date(order.created_at), 'yyyy-MM-dd')
      const resultItem = result.find(item => item.date === orderDate)
      if (resultItem) {
        resultItem.total += parseFloat(order.total)
      }
    })

    return {
      data: result,
      error: null
    }
  } catch (err) {
    console.error('Unexpected error fetching daily sales:', err)
    return {
      data: null,
      error: { message: 'An unexpected error occurred while fetching daily sales' }
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
    const supabase = await createClient()
    const today = new Date()
    const startDate = startOfDay(subDays(today, 6)).toISOString() // Last 7 days
    const endDate = endOfDay(today).toISOString()

    // First, get all order items for the past week
    const { data: orderItems, error: orderItemsError } = await supabase
      .from('order_items')
      .select('order_id, product_id, product_name, quantity, total')
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    if (orderItemsError) {
      console.error('Error fetching order items:', orderItemsError.message)
      return {
        data: null,
        error: { message: orderItemsError.message }
      }
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

    return {
      data: topProducts,
      error: null
    }
  } catch (err) {
    console.error('Unexpected error fetching top selling products:', err)
    return {
      data: null,
      error: { message: 'An unexpected error occurred while fetching top selling products' }
    }
  }
}
