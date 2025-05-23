'use server'

import { createClient } from '@/lib/supabase/server'
import { Product, InventoryLog } from '@/types'
import { revalidatePath } from 'next/cache'
import { invalidateProductCache, invalidateProductById } from '@/lib/cache-utils'

export type ProductActionError = {
  message: string
}

export type ProductActionResult<T = void> = {
  data: T | null
  error: ProductActionError | null
}

/**
 * Get all products with pagination, filtering and sorting support
 * Supports both standard pagination and cursor-based pagination for better performance with large datasets
 */
export async function getProducts(options?: {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  category?: string;
  isActive?: boolean;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  cursor?: string; // Add cursor-based pagination support
}): Promise<ProductActionResult<{
  products: Product[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  nextCursor?: string; // Return next cursor for infinite scrolling
}>> {
  try {
    const supabase = await createClient()
    const page = options?.page || 1
    const pageSize = options?.pageSize || 10
    const searchQuery = options?.searchQuery || ''
    const category = options?.category
    const isActive = options?.isActive
    const cursor = options?.cursor

    // Start building the query
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })

    // Apply filters if provided
    if (searchQuery) {
      // Improved search to look in name, sku, and description
      query = query.or(`name.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
    }

    if (category) {
      query = query.eq('category', category)
    }

    if (isActive !== undefined) {
      query = query.eq('is_active', isActive)
    }

    // Get total count first using a separate query (only for standard pagination)
    let count = 0;
    if (!cursor) { // Skip count query for cursor-based pagination
      try {
        // Create a separate query for counting
        const countQuery = supabase
          .from('products')
          .select('id', { count: 'exact', head: true });

        // Apply the same filters as the main query
        if (searchQuery) {
          countQuery.or(`name.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        }

        if (category) {
          countQuery.eq('category', category);
        }

        if (isActive !== undefined) {
          countQuery.eq('is_active', isActive);
        }

        // Execute the count query
        const { count: totalCount, error: countError } = await countQuery;

        if (countError) {
          console.error("Supabase count error:", countError.message);
          return {
            data: null,
            error: { message: countError.message }
          };
        }

        // Set the count from the result
        count = totalCount || 0;
      } catch (countErr) {
        console.error("Error getting count:", countErr);
        // Continue with count = 0, we'll still try to get the data
      }
    }

    // Apply sorting
    const sortBy = options?.sortBy || 'name';
    const sortDirection = options?.sortDirection || 'asc';

    // Validate sortBy to prevent SQL injection
    const validColumns = ['name', 'price', 'stock_quantity', 'sku', 'category', 'is_active', 'created_at', 'updated_at'];
    const column = validColumns.includes(sortBy) ? sortBy : 'name';

    query = query.order(column, { ascending: sortDirection === 'asc' })

    // Apply pagination - either cursor-based or offset-based
    let data, error;
    if (cursor) {
      // Cursor-based pagination (more efficient for large datasets)
      const result = await query.gt('id', cursor).limit(pageSize)
      data = result.data
      error = result.error
    } else {
      // Standard offset pagination
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      const result = await query.range(from, to)
      data = result.data
      error = result.error
    }

    if (error) {
      console.error('Error fetching products:', error.message)
      return {
        data: null,
        error: { message: error.message }
      }
    }

    // Calculate total pages (only for standard pagination)
    const totalPages = Math.ceil((count || 0) / pageSize)

    // Calculate next cursor for infinite scrolling
    const nextCursor = data && data.length === pageSize ? data[data.length - 1].id : undefined

    return {
      data: {
        products: data as Product[],
        totalCount: count || 0,
        page,
        pageSize,
        totalPages,
        nextCursor
      },
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
 * Get a single product by ID or SKU
 */
export async function getProductById(idOrSku: string): Promise<ProductActionResult<Product>> {
  try {
    const supabase = await createClient()
    let data, error

    // First try to fetch by ID (assuming it's a UUID)
    if (idOrSku.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      const result = await supabase
        .from('products')
        .select('*')
        .eq('id', idOrSku)
        .single()

      data = result.data
      error = result.error
    }

    // If not found by ID or not a UUID, try by SKU
    if (!data) {
      const result = await supabase
        .from('products')
        .select('*')
        .eq('sku', idOrSku)
        .single()

      data = result.data
      error = result.error
    }

    if (error) {
      console.error('Error fetching product:', error.message)
      return {
        data: null,
        error: { message: `Product not found with ID or SKU: ${idOrSku}` }
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

    // Invalidate product cache
    invalidateProductCache()

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

    // Invalidate product cache
    try {
      invalidateProductById(productId)
      invalidateProductCache()
    } catch (cacheError) {
      console.error('Error invalidating cache:', cacheError)
      // Continue execution even if cache invalidation fails
    }

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
export async function deleteProduct(productId: string): Promise<ProductActionResult<{ success: boolean }>> {
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

    // Invalidate product cache
    try {
      invalidateProductById(productId)
      invalidateProductCache()
    } catch (cacheError) {
      console.error('Error invalidating cache:', cacheError)
      // Continue execution even if cache invalidation fails
    }

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

    // Invalidate product cache
    try {
      invalidateProductById(productId)
      invalidateProductCache()
    } catch (cacheError) {
      console.error('Error invalidating cache:', cacheError)
      // Continue execution even if cache invalidation fails
    }

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
 * Bulk update products
 */
export async function bulkUpdateProducts(
  productIds: string[],
  updateData: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>
): Promise<ProductActionResult<{ count: number }>> {
  try {
    if (!productIds.length) {
      return {
        data: { count: 0 },
        error: null
      }
    }

    const supabase = await createClient()

    // Prepare update data with timestamp
    const dataToUpdate = {
      ...updateData,
      updated_at: new Date().toISOString()
    }

    // Update all products with the given IDs
    const result = await supabase
      .from('products')
      .update(dataToUpdate)
      .in('id', productIds)

    // console.log('Bulk update result:', JSON.stringify(result))

    if (result.error) {
      console.error('Error bulk updating products:', result.error.message)
      return {
        data: null,
        error: { message: result.error.message }
      }
    }

    // Revalidate the products pages to update the UI
    revalidatePath('/admin/products')
    revalidatePath('/products')

    // Invalidate product cache for all updated products
    try {
      productIds.forEach(id => invalidateProductById(id))
      invalidateProductCache()
    } catch (cacheError) {
      console.error('Error invalidating cache:', cacheError)
      // Continue execution even if cache invalidation fails
    }

    // Get the actual count from the result
    const updatedCount = productIds.length

    return {
      data: { count: updatedCount },
      error: null
    }
  } catch (err) {
    console.error('Unexpected error bulk updating products:', err)
    return {
      data: null,
      error: { message: 'An unexpected error occurred while bulk updating products' }
    }
  }
}

/**
 * Get low stock products
 */
export async function getLowStockProducts(): Promise<ProductActionResult<Product[]>> {
  try {
    const supabase = await createClient()

    // First, fetch all products with their stock_quantity and low_stock_threshold
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('stock_quantity', { ascending: true })

    if (error) {
      console.error('Error fetching products for low stock check:', error.message)
      return {
        data: null,
        error: { message: error.message }
      }
    }

    // Filter products where stock_quantity is less than low_stock_threshold
    // If low_stock_threshold is not set, use a default value of 10
    const DEFAULT_LOW_STOCK_THRESHOLD = 10;
    const lowStockProducts = data.filter(product => {
      const threshold = product.low_stock_threshold !== null && product.low_stock_threshold !== undefined
        ? product.low_stock_threshold
        : DEFAULT_LOW_STOCK_THRESHOLD;

      return product.stock_quantity < threshold;
    });

    return {
      data: lowStockProducts as Product[],
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
