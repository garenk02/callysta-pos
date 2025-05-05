/**
 * Cache configuration for different data types
 * All values are in seconds
 */
export const CACHE_CONFIG = {
  products: {
    list: 60, // 1 minute for product lists
    detail: 300, // 5 minutes for product details
    categories: 600, // 10 minutes for categories (rarely change)
    search: 30, // 30 seconds for search results
  },
  orders: {
    list: 30, // 30 seconds for order lists (may change frequently)
    detail: 120, // 2 minutes for order details
    user: 60, // 1 minute for user-specific orders
  },
  users: {
    list: 300, // 5 minutes for user lists
    detail: 300, // 5 minutes for user details
  },
  images: {
    optimized: 3600, // 1 hour for optimized images
  },
  ui: {
    settings: 1800, // 30 minutes for UI settings
  }
}

/**
 * Get cache TTL for a specific data type
 * @param type Data type category (products, orders, etc.)
 * @param subType Sub-type within the category (list, detail, etc.)
 * @returns TTL in seconds
 */
export function getCacheTTL(type: keyof typeof CACHE_CONFIG, subType: string): number {
  if (CACHE_CONFIG[type] && CACHE_CONFIG[type][subType as keyof typeof CACHE_CONFIG[typeof type]]) {
    return CACHE_CONFIG[type][subType as keyof typeof CACHE_CONFIG[typeof type]]
  }
  
  // Default cache time: 1 minute
  return 60
}
