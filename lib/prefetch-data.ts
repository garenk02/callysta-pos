'use client'

import { createClient } from '@/lib/supabase/client'
import cache from '@/lib/cache'
import { CACHE_CONFIG } from './cache-config'

/**
 * Prefetch common data that is frequently used across the application
 * This helps improve performance by having data ready before it's needed
 */
export async function prefetchCommonData() {
  try {
    await Promise.all([
      prefetchProductCategories(),
      // Add more prefetch functions as needed
    ])
    
    console.log('Common data prefetched successfully')
    return true
  } catch (error) {
    console.error('Error prefetching common data:', error)
    return false
  }
}

/**
 * Prefetch product categories
 */
async function prefetchProductCategories() {
  const categoriesKey = 'products:categories'
  
  // Skip if already cached
  if (cache.has(categoriesKey)) {
    return
  }
  
  try {
    const supabase = createClient()
    const { data } = await supabase
      .from('products')
      .select('category')
      .not('category', 'is', null)
      .order('category')
    
    if (data) {
      // Extract unique categories
      const categories = [...new Set(data.map(item => item.category).filter(Boolean))]
      cache.set(categoriesKey, categories, CACHE_CONFIG.products.categories)
    }
  } catch (error) {
    console.error('Error prefetching product categories:', error)
  }
}
