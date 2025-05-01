'use server'

import { createClient } from '@/lib/supabase/server'
import { Product, InventoryLog } from '@/types'
import { revalidatePath } from 'next/cache'

export type ProductActionError = {
  message: string
}

export type ProductActionResult<T = void> = {
  data: T | null
  error: ProductActionError | null
}

/**
 * Get all products
 */
export async function getProducts(): Promise<ProductActionResult<Product[]>> {
  try {
    const supabase = await createClient()

    // Fetch products from the products table
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching products:', error.message)
      return {
        data: null,
        error: { message: error.message }
      }
    }

    return {
      data: data as Product[],
      error: null
    }
  } catch (err) {
    console.error('Unexpected error fetching products:', err)
    return {
      data: null,
      error: { message: 'An unexpected error occurred while fetching products' }
    }
  }
}

/**
 * Get a single product by ID
 */
export async function getProductById(productId: string): Promise<ProductActionResult<Product>> {
  try {
    const supabase = await createClient()

    // Fetch the product
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single()

    if (error) {
      console.error('Error fetching product:', error.message)
      return {
        data: null,
        error: { message: error.message }
      }
    }

    return {
      data: data as Product,
      error: null
    }
  } catch (err) {
    console.error('Unexpected error fetching product:', err)
    return {
      data: null,
      error: { message: 'An unexpected error occurred while fetching the product' }
    }
  }
}

/**
 * Create a new product
 */
export async function createProduct(
  productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>
): Promise<ProductActionResult<Product>> {
  try {
    const supabase = await createClient()

    // Ensure stock_quantity is a number
    const stock_quantity = productData.stock_quantity || 0

    // Ensure low_stock_threshold is a number if provided
    const low_stock_threshold = productData.low_stock_threshold || null

    // Create the product
    const { data, error } = await supabase
      .from('products')
      .insert({
        ...productData,
        stock_quantity,
        low_stock_threshold,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating product:', error.message)
      return {
        data: null,
        error: { message: error.message }
      }
    }

    // Revalidate the products pages to update the UI
    revalidatePath('/admin/products')
    revalidatePath('/products')

    return {
      data: data as Product,
      error: null
    }
  } catch (err) {
    console.error('Unexpected error creating product:', err)
    return {
      data: null,
      error: { message: 'An unexpected error occurred while creating the product' }
    }
  }
}

/**
 * Update a product
 */
export async function updateProduct(
  productId: string,
  productData: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>
): Promise<ProductActionResult<Product>> {
  try {
    const supabase = await createClient()

    // Prepare update data
    const updateData = {
      ...productData,
      updated_at: new Date().toISOString()
    }

    // If stock_quantity is provided, ensure it's a number
    if (productData.stock_quantity !== undefined) {
      updateData.stock_quantity = productData.stock_quantity
    }

    // If low_stock_threshold is provided, ensure it's a number or null
    if (productData.low_stock_threshold !== undefined) {
      updateData.low_stock_threshold = productData.low_stock_threshold
    }

    // Update the product
    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', productId)
      .select()
      .single()

    if (error) {
      console.error('Error updating product:', error.message)
      return {
        data: null,
        error: { message: error.message }
      }
    }

    // Revalidate the products pages to update the UI
    revalidatePath('/admin/products')
    revalidatePath('/products')

    return {
      data: data as Product,
      error: null
    }
  } catch (err) {
    console.error('Unexpected error updating product:', err)
    return {
      data: null,
      error: { message: 'An unexpected error occurred while updating the product' }
    }
  }
}

/**
 * Delete a product
 */
export async function deleteProduct(productId: string): Promise<ProductActionResult> {
  try {
    const supabase = await createClient()

    // Delete the product
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)

    if (error) {
      console.error('Error deleting product:', error.message)
      return {
        data: null,
        error: { message: error.message }
      }
    }

    // Revalidate the products pages to update the UI
    revalidatePath('/admin/products')
    revalidatePath('/products')

    return {
      data: { success: true },
      error: null
    }
  } catch (err) {
    console.error('Unexpected error deleting product:', err)
    return {
      data: null,
      error: { message: 'An unexpected error occurred while deleting the product' }
    }
  }
}

/**
 * Adjust product stock quantity
 */
export async function adjustStock(
  productId: string,
  quantityChange: number,
  reason: string
): Promise<ProductActionResult<Product>> {
  try {
    const supabase = await createClient()

    // First, get the current product to get the current stock quantity
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single()

    if (fetchError) {
      console.error('Error fetching product for stock adjustment:', fetchError.message)
      return {
        data: null,
        error: { message: fetchError.message }
      }
    }

    const currentQuantity = product.stock_quantity || 0
    const newQuantity = currentQuantity + quantityChange

    // Don't allow negative stock (unless specifically overridden)
    if (newQuantity < 0) {
      return {
        data: null,
        error: { message: 'Cannot reduce stock below zero' }
      }
    }

    // Update the product stock quantity
    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update({
        stock_quantity: newQuantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating product stock:', updateError.message)
      return {
        data: null,
        error: { message: updateError.message }
      }
    }

    // Get the current user's ID
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return {
        data: null,
        error: { message: 'User not authenticated' }
      }
    }

    // Create an inventory log entry
    const { error: logError } = await supabase
      .from('inventory_logs')
      .insert({
        product_id: productId,
        quantity_change: quantityChange,
        previous_quantity: currentQuantity,
        new_quantity: newQuantity,
        reason,
        created_by: user.id,
        created_at: new Date().toISOString()
      })

    if (logError) {
      console.error('Error creating inventory log:', logError.message)
      // We don't return an error here because the stock was already updated
      // Just log the error
    }

    // Revalidate the products pages to update the UI
    revalidatePath('/admin/products')
    revalidatePath('/products')

    return {
      data: updatedProduct as Product,
      error: null
    }
  } catch (err) {
    console.error('Unexpected error adjusting stock:', err)
    return {
      data: null,
      error: { message: 'An unexpected error occurred while adjusting stock' }
    }
  }
}

/**
 * Get inventory logs for a product
 */
export async function getInventoryLogs(
  productId: string
): Promise<ProductActionResult<InventoryLog[]>> {
  try {
    const supabase = await createClient()

    // Fetch inventory logs for the product
    const { data, error } = await supabase
      .from('inventory_logs')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching inventory logs:', error.message)
      return {
        data: null,
        error: { message: error.message }
      }
    }

    return {
      data: data as InventoryLog[],
      error: null
    }
  } catch (err) {
    console.error('Unexpected error fetching inventory logs:', err)
    return {
      data: null,
      error: { message: 'An unexpected error occurred while fetching inventory logs' }
    }
  }
}

/**
 * Get low stock products
 */
export async function getLowStockProducts(): Promise<ProductActionResult<Product[]>> {
  try {
    const supabase = await createClient()

    // Fetch products where stock_quantity is less than or equal to low_stock_threshold
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .not('low_stock_threshold', 'is', null)
      .lte('stock_quantity', supabase.raw('low_stock_threshold'))
      .order('stock_quantity', { ascending: true })

    if (error) {
      console.error('Error fetching low stock products:', error.message)
      return {
        data: null,
        error: { message: error.message }
      }
    }

    return {
      data: data as Product[],
      error: null
    }
  } catch (err) {
    console.error('Unexpected error fetching low stock products:', err)
    return {
      data: null,
      error: { message: 'An unexpected error occurred while fetching low stock products' }
    }
  }
}
