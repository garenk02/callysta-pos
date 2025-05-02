'use server'

import { createClient } from '@/lib/supabase/server'
import { Order, OrderItem } from '@/types'

export type OrderActionError = {
  message: string
}

export type OrderActionResult<T = void> = {
  data: T | null
  error: OrderActionError | null
}

// Extended Order type with user information
export interface OrderWithUser extends Order {
  user?: {
    email: string;
    name?: string;
  }
}

/**
 * Get all orders with user information
 * @param dateRange Optional date range to filter orders
 */
export async function getOrders(
  dateRange?: { from?: Date; to?: Date }
): Promise<OrderActionResult<OrderWithUser[]>> {
  try {
    const supabase = await createClient()

    // Build the query
    let query = supabase
      .from('orders')
      .select('*')

    // Apply date range filter if provided
    if (dateRange) {
      if (dateRange.from) {
        // Convert to ISO string and get the date part only
        const fromDate = new Date(dateRange.from)
        fromDate.setHours(0, 0, 0, 0)
        query = query.gte('created_at', fromDate.toISOString())
      }

      if (dateRange.to) {
        // Convert to ISO string and set to end of day
        const toDate = new Date(dateRange.to)
        toDate.setHours(23, 59, 59, 999)
        query = query.lte('created_at', toDate.toISOString())
      }
    }

    // Execute the query with ordering
    const { data: orders, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching orders:', error.message)
      return {
        data: null,
        error: { message: error.message }
      }
    }

    // Fetch user profiles for all orders
    // Note: profiles.id is linked to auth.users.id, which is the same as orders.user_id
    const userIds = [...new Set(orders.map(order => order.user_id))]
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, name')
      .in('id', userIds)

    if (profilesError) {
      console.error('Error fetching user profiles:', profilesError.message)
      // Continue without user information
    }

    // Create a map of user profiles by ID for quick lookup
    const profilesMap = (profiles || []).reduce((map, profile) => {
      map[profile.id] = profile
      return map
    }, {} as Record<string, any>)

    // Combine orders with user information
    const ordersWithUsers = orders.map(order => ({
      ...order,
      user: profilesMap[order.user_id] ? {
        email: profilesMap[order.user_id].email,
        name: profilesMap[order.user_id].name
      } : undefined
    })) as OrderWithUser[]

    return {
      data: ordersWithUsers,
      error: null
    }
  } catch (err) {
    console.error('Unexpected error fetching orders:', err)
    return {
      data: null,
      error: { message: 'An unexpected error occurred while fetching orders' }
    }
  }
}

/**
 * Get a single order by ID with user information
 */
export async function getOrderById(orderId: string): Promise<OrderActionResult<{order: OrderWithUser, items: OrderItem[]}>> {
  try {
    const supabase = await createClient()

    // Fetch the order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError) {
      console.error('Error fetching order:', orderError.message)
      return {
        data: null,
        error: { message: orderError.message }
      }
    }

    // Fetch the order items
    const { data: itemsData, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)

    if (itemsError) {
      console.error('Error fetching order items:', itemsError.message)
      return {
        data: null,
        error: { message: itemsError.message }
      }
    }

    // Fetch user profile for this order
    // Note: profiles.id is linked to auth.users.id, which is the same as orders.user_id
    const { data: userProfile, error: userProfileError } = await supabase
      .from('profiles')
      .select('id, email, name')
      .eq('id', orderData.user_id)
      .single()

    if (userProfileError && userProfileError.code !== 'PGRST116') {
      console.error('Error fetching user profile:', userProfileError.message)
      // Continue without user information
    }

    // Create order with user information
    const orderWithUser: OrderWithUser = {
      ...orderData,
      user: userProfile ? {
        email: userProfile.email,
        name: userProfile.name
      } : undefined
    }

    return {
      data: {
        order: orderWithUser,
        items: itemsData as OrderItem[]
      },
      error: null
    }
  } catch (err) {
    console.error('Unexpected error fetching order details:', err)
    return {
      data: null,
      error: { message: 'An unexpected error occurred while fetching order details' }
    }
  }
}

/**
 * Get orders for a specific user with user information
 */
export async function getOrdersByUserId(userId: string): Promise<OrderActionResult<OrderWithUser[]>> {
  try {
    const supabase = await createClient()

    // Fetch orders for the user
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user orders:', error.message)
      return {
        data: null,
        error: { message: error.message }
      }
    }

    // Fetch user profile
    // Note: profiles.id is linked to auth.users.id, which is the same as orders.user_id
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, name')
      .eq('id', userId)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching user profile:', profileError.message)
      // Continue without user information
    }

    // Create orders with user information
    const ordersWithUsers = orders.map(order => ({
      ...order,
      user: userProfile ? {
        email: userProfile.email,
        name: userProfile.name
      } : undefined
    })) as OrderWithUser[]

    return {
      data: ordersWithUsers,
      error: null
    }
  } catch (err) {
    console.error('Unexpected error fetching user orders:', err)
    return {
      data: null,
      error: { message: 'An unexpected error occurred while fetching user orders' }
    }
  }
}
