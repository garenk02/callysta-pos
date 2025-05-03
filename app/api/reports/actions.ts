'use server'

import { createClient } from '@/lib/supabase/server'
import { startOfDay, endOfDay, format, parseISO, isValid, subDays } from 'date-fns'
import { PaymentMethod } from '@/types'

export type ReportActionError = {
  message: string
}

export type ReportActionResult<T = void> = {
  data: T | null
  error: ReportActionError | null
}

// Sales summary data type
export interface SalesSummary {
  totalSales: number
  totalOrders: number
  averageOrderValue: number
  paymentMethodBreakdown: {
    method: PaymentMethod
    count: number
    total: number
    percentage: number
  }[]
  dailySales: {
    date: string
    displayDate: string
    total: number
    orders: number
  }[]
}

// Product sales data type
export interface ProductSalesItem {
  product_id: string
  product_name: string
  quantity: number
  total: number
  average_price: number
  percentage_of_sales: number
}

export interface ProductSalesReport {
  totalProducts: number
  totalQuantity: number
  totalSales: number
  products: ProductSalesItem[]
  topProducts: ProductSalesItem[]
  categoryBreakdown: {
    category: string
    quantity: number
    total: number
    percentage: number
  }[]
}

// Inventory report data types
export interface InventoryItem {
  id: string
  name: string
  sku?: string
  category?: string
  stock_quantity: number
  low_stock_threshold?: number
  is_low_stock: boolean
  stock_status: 'out_of_stock' | 'low_stock' | 'in_stock'
  price: number
}

export interface InventoryMovement {
  product_id: string
  product_name: string
  date: string
  quantity_change: number
  previous_quantity: number
  new_quantity: number
  reason: string
}

export interface InventoryReport {
  totalProducts: number
  totalStockQuantity: number
  lowStockCount: number
  outOfStockCount: number
  inventoryValue: number
  inventoryByCategory: {
    category: string
    product_count: number
    stock_quantity: number
    percentage: number
  }[]
  products: InventoryItem[]
  lowStockItems: InventoryItem[]
  recentMovements: InventoryMovement[]
}

/**
 * Get sales summary report data
 * @param dateRange Optional date range to filter sales
 */
export async function getSalesSummary(
  dateRange?: { from?: Date; to?: Date }
): Promise<ReportActionResult<SalesSummary>> {
  try {
    const supabase = await createClient()

    // Set default date range if not provided (last 30 days)
    const today = new Date()
    const fromDate = dateRange?.from ? startOfDay(dateRange.from) : startOfDay(new Date(today.setDate(today.getDate() - 30)))
    const toDate = dateRange?.to ? endOfDay(dateRange.to) : endOfDay(new Date())

    // Fetch orders for the date range
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', fromDate.toISOString())
      .lte('created_at', toDate.toISOString())
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching sales summary:', error.message)
      return {
        data: null,
        error: { message: error.message }
      }
    }

    // If no orders found, return empty summary
    if (!orders || orders.length === 0) {
      return {
        data: {
          totalSales: 0,
          totalOrders: 0,
          averageOrderValue: 0,
          paymentMethodBreakdown: [],
          dailySales: []
        },
        error: null
      }
    }

    // Calculate total sales and orders
    const totalSales = orders.reduce((sum, order) => sum + parseFloat(order.total), 0)
    const totalOrders = orders.length
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0

    // Calculate payment method breakdown
    const paymentMethods = new Map<PaymentMethod, { count: number; total: number }>()

    orders.forEach(order => {
      const method = order.payment_method as PaymentMethod
      const total = parseFloat(order.total)

      if (!paymentMethods.has(method)) {
        paymentMethods.set(method, { count: 0, total: 0 })
      }

      const current = paymentMethods.get(method)!
      paymentMethods.set(method, {
        count: current.count + 1,
        total: current.total + total
      })
    })

    const paymentMethodBreakdown = Array.from(paymentMethods.entries()).map(([method, data]) => ({
      method,
      count: data.count,
      total: data.total,
      percentage: (data.total / totalSales) * 100
    }))

    // Group sales by date
    const salesByDate = new Map<string, { total: number; orders: number }>()

    // Initialize the map with all dates in the range
    const currentDate = new Date(fromDate)
    while (currentDate <= toDate) {
      const dateKey = format(currentDate, 'yyyy-MM-dd')
      salesByDate.set(dateKey, { total: 0, orders: 0 })
      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Fill in the actual sales data
    orders.forEach(order => {
      const orderDate = parseISO(order.created_at)
      if (isValid(orderDate)) {
        const dateKey = format(orderDate, 'yyyy-MM-dd')
        const current = salesByDate.get(dateKey) || { total: 0, orders: 0 }

        salesByDate.set(dateKey, {
          total: current.total + parseFloat(order.total),
          orders: current.orders + 1
        })
      }
    })

    // Convert to array for the response
    const dailySales = Array.from(salesByDate.entries()).map(([date, data]) => ({
      date,
      displayDate: format(parseISO(date), 'MMM dd'),
      total: data.total,
      orders: data.orders
    }))

    return {
      data: {
        totalSales,
        totalOrders,
        averageOrderValue,
        paymentMethodBreakdown,
        dailySales
      },
      error: null
    }
  } catch (err) {
    console.error('Unexpected error fetching sales summary:', err)
    return {
      data: null,
      error: { message: 'An unexpected error occurred while fetching sales summary' }
    }
  }
}

/**
 * Get product sales report data
 * @param dateRange Optional date range to filter sales
 * @param limit Optional limit for top products (default: 10)
 */
export async function getProductSalesReport(
  dateRange?: { from?: Date; to?: Date },
  limit: number = 10
): Promise<ReportActionResult<ProductSalesReport>> {
  try {
    const supabase = await createClient()

    // Set default date range if not provided (last 30 days)
    const today = new Date()
    const fromDate = dateRange?.from ? startOfDay(dateRange.from) : startOfDay(new Date(today.setDate(today.getDate() - 30)))
    const toDate = dateRange?.to ? endOfDay(dateRange.to) : endOfDay(new Date())

    // Fetch order items for the date range
    const { data: orderItems, error: orderItemsError } = await supabase
      .from('order_items')
      .select('*')
      .gte('created_at', fromDate.toISOString())
      .lte('created_at', toDate.toISOString())

    if (orderItemsError) {
      console.error('Error fetching order items:', orderItemsError.message)
      return {
        data: null,
        error: { message: orderItemsError.message }
      }
    }

    // If no order items found, return empty report
    if (!orderItems || orderItems.length === 0) {
      return {
        data: {
          totalProducts: 0,
          totalQuantity: 0,
          totalSales: 0,
          products: [],
          topProducts: [],
          categoryBreakdown: []
        },
        error: null
      }
    }

    // Fetch all products to get category information
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, category')

    if (productsError) {
      console.error('Error fetching products:', productsError.message)
      return {
        data: null,
        error: { message: productsError.message }
      }
    }

    // Create a map of product IDs to categories
    const productCategories = new Map<string, string>()
    products?.forEach(product => {
      productCategories.set(product.id, product.category || 'Uncategorized')
    })

    // Aggregate sales by product
    const productSalesMap = new Map<string, {
      product_id: string
      product_name: string
      quantity: number
      total: number
    }>()

    orderItems.forEach(item => {
      const productId = item.product_id
      const productName = item.product_name
      const quantity = item.quantity
      const total = parseFloat(item.total)

      if (!productSalesMap.has(productId)) {
        productSalesMap.set(productId, {
          product_id: productId,
          product_name: productName,
          quantity: 0,
          total: 0
        })
      }

      const current = productSalesMap.get(productId)!
      productSalesMap.set(productId, {
        ...current,
        quantity: current.quantity + quantity,
        total: current.total + total
      })
    })

    // Calculate total sales and quantity
    const totalSales = orderItems.reduce((sum, item) => sum + parseFloat(item.total), 0)
    const totalQuantity = orderItems.reduce((sum, item) => sum + item.quantity, 0)
    const totalProducts = productSalesMap.size

    // Convert to array and calculate additional metrics
    const productSales = Array.from(productSalesMap.values()).map(product => ({
      product_id: product.product_id,
      product_name: product.product_name,
      quantity: product.quantity,
      total: product.total,
      average_price: product.quantity > 0 ? product.total / product.quantity : 0,
      percentage_of_sales: (product.total / totalSales) * 100
    }))

    // Sort by total sales (descending) and get top products
    const sortedProducts = [...productSales].sort((a, b) => b.total - a.total)
    const topProducts = sortedProducts.slice(0, limit)

    // Aggregate sales by category
    const categorySalesMap = new Map<string, { quantity: number; total: number }>()

    productSales.forEach(product => {
      const category = productCategories.get(product.product_id) || 'Uncategorized'

      if (!categorySalesMap.has(category)) {
        categorySalesMap.set(category, { quantity: 0, total: 0 })
      }

      const current = categorySalesMap.get(category)!
      categorySalesMap.set(category, {
        quantity: current.quantity + product.quantity,
        total: current.total + product.total
      })
    })

    // Convert category breakdown to array and calculate percentages
    const categoryBreakdown = Array.from(categorySalesMap.entries()).map(([category, data]) => ({
      category,
      quantity: data.quantity,
      total: data.total,
      percentage: (data.total / totalSales) * 100
    })).sort((a, b) => b.total - a.total)

    return {
      data: {
        totalProducts,
        totalQuantity,
        totalSales,
        products: productSales,
        topProducts,
        categoryBreakdown
      },
      error: null
    }
  } catch (err) {
    console.error('Unexpected error fetching product sales report:', err)
    return {
      data: null,
      error: { message: 'An unexpected error occurred while fetching product sales report' }
    }
  }
}

/**
 * Get inventory report data
 * @param movementDays Number of days to look back for inventory movements (default: 30)
 */
export async function getInventoryReport(
  movementDays: number = 30
): Promise<ReportActionResult<InventoryReport>> {
  try {
    const supabase = await createClient()

    // Fetch all products with their current inventory levels
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true })

    if (productsError) {
      console.error('Error fetching products:', productsError.message)
      return {
        data: null,
        error: { message: productsError.message }
      }
    }

    // If no products found, return empty report
    if (!products || products.length === 0) {
      return {
        data: {
          totalProducts: 0,
          totalStockQuantity: 0,
          lowStockCount: 0,
          outOfStockCount: 0,
          inventoryValue: 0,
          inventoryByCategory: [],
          products: [],
          lowStockItems: [],
          recentMovements: []
        },
        error: null
      }
    }

    // Calculate inventory metrics
    let totalStockQuantity = 0
    let lowStockCount = 0
    let outOfStockCount = 0
    let inventoryValue = 0

    // Process products and determine stock status
    const processedProducts: InventoryItem[] = products.map(product => {
      const stockQuantity = product.stock_quantity || 0
      const lowStockThreshold = product.low_stock_threshold || 5 // Default threshold
      const isLowStock = stockQuantity > 0 && stockQuantity <= lowStockThreshold
      const isOutOfStock = stockQuantity <= 0

      // Update counters
      totalStockQuantity += stockQuantity
      if (isLowStock) lowStockCount++
      if (isOutOfStock) outOfStockCount++

      // Calculate inventory value (price * quantity)
      const itemValue = (product.price || 0) * stockQuantity
      inventoryValue += itemValue

      // Determine stock status
      let stockStatus: 'out_of_stock' | 'low_stock' | 'in_stock' = 'in_stock'
      if (isOutOfStock) stockStatus = 'out_of_stock'
      else if (isLowStock) stockStatus = 'low_stock'

      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        category: product.category || 'Uncategorized',
        stock_quantity: stockQuantity,
        low_stock_threshold: lowStockThreshold,
        is_low_stock: isLowStock,
        stock_status: stockStatus,
        price: product.price || 0
      }
    })

    // Get low stock items
    const lowStockItems = processedProducts.filter(product =>
      product.stock_status === 'low_stock' || product.stock_status === 'out_of_stock'
    ).sort((a, b) => a.stock_quantity - b.stock_quantity)

    // Aggregate inventory by category
    const categoryMap = new Map<string, { product_count: number; stock_quantity: number }>()

    processedProducts.forEach(product => {
      const category = product.category || 'Uncategorized'

      if (!categoryMap.has(category)) {
        categoryMap.set(category, { product_count: 0, stock_quantity: 0 })
      }

      const current = categoryMap.get(category)!
      categoryMap.set(category, {
        product_count: current.product_count + 1,
        stock_quantity: current.stock_quantity + product.stock_quantity
      })
    })

    // Convert category data to array and calculate percentages
    const inventoryByCategory = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      product_count: data.product_count,
      stock_quantity: data.stock_quantity,
      percentage: totalStockQuantity > 0 ? (data.stock_quantity / totalStockQuantity) * 100 : 0
    })).sort((a, b) => b.stock_quantity - a.stock_quantity)

    // Fetch recent inventory movements
    const today = new Date()
    const fromDate = startOfDay(subDays(today, movementDays)).toISOString()

    const { data: inventoryLogs, error: logsError } = await supabase
      .from('inventory_logs')
      .select('*')
      .gte('created_at', fromDate)
      .order('created_at', { ascending: false })
      .limit(100) // Limit to most recent 100 movements

    if (logsError) {
      console.error('Error fetching inventory logs:', logsError.message)
      // Continue with the report even if we can't get the logs
    }

    // Process inventory movements
    const recentMovements: InventoryMovement[] = []

    if (inventoryLogs && inventoryLogs.length > 0) {
      // Create a map of product IDs to names for quick lookup
      const productNameMap = new Map<string, string>()
      products.forEach(product => {
        productNameMap.set(product.id, product.name)
      })

      // Process each log entry
      inventoryLogs.forEach(log => {
        const productName = productNameMap.get(log.product_id) || 'Unknown Product'
        const date = format(parseISO(log.created_at), 'MMM dd, yyyy HH:mm')

        recentMovements.push({
          product_id: log.product_id,
          product_name: productName,
          date,
          quantity_change: log.quantity_change,
          previous_quantity: log.previous_quantity,
          new_quantity: log.new_quantity,
          reason: log.reason || 'No reason provided'
        })
      })
    }

    return {
      data: {
        totalProducts: products.length,
        totalStockQuantity,
        lowStockCount,
        outOfStockCount,
        inventoryValue,
        inventoryByCategory,
        products: processedProducts,
        lowStockItems,
        recentMovements
      },
      error: null
    }
  } catch (err) {
    console.error('Unexpected error fetching inventory report:', err)
    return {
      data: null,
      error: { message: 'An unexpected error occurred while fetching inventory report' }
    }
  }
}
