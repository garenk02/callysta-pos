/**
 * Server-side cache utilities
 * These functions are safe to use in server components and server actions
 */

import cache from './cache';

/**
 * Invalidate a cache entry (server-safe version)
 * @param key Cache key to invalidate
 */
export function invalidateCacheServer(key: string): void {
  try {
    cache.delete(key);
  } catch (error) {
    console.error(`Error invalidating cache key ${key}:`, error);
  }
}

/**
 * Clear the entire cache (server-safe version)
 */
export function clearCacheServer(): void {
  try {
    cache.clear();
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

/**
 * Invalidate all product-related cache entries (server-safe version)
 */
export function invalidateProductCacheServer(): void {
  try {
    // Get all cache keys
    const keys = Array.from((cache as any)['cache']?.keys() || []);

    // Invalidate all product-related cache entries
    keys.forEach(key => {
      if (key.startsWith('product:') || key.startsWith('products:')) {
        invalidateCacheServer(key);
      }
    });
  } catch (error) {
    console.error('Error in invalidateProductCacheServer:', error);
  }
}

/**
 * Invalidate a specific product cache entry (server-safe version)
 * @param productId Product ID
 */
export function invalidateProductByIdServer(productId: string): void {
  try {
    invalidateCacheServer(`product:${productId}`);

    // Also invalidate all product list caches since they might contain this product
    const keys = Array.from((cache as any)['cache']?.keys() || []);
    keys.forEach(key => {
      if (key.startsWith('products:')) {
        invalidateCacheServer(key);
      }
    });
  } catch (error) {
    console.error('Error in invalidateProductByIdServer:', error);
  }
}

/**
 * Invalidate all order-related cache entries (server-safe version)
 */
export function invalidateOrderCacheServer(): void {
  try {
    // Get all cache keys
    const keys = Array.from((cache as any)['cache']?.keys() || []);

    // Invalidate all order-related cache entries
    keys.forEach(key => {
      if (key.startsWith('order:') || key.startsWith('orders:')) {
        invalidateCacheServer(key);
      }
    });
  } catch (error) {
    console.error('Error in invalidateOrderCacheServer:', error);
  }
}

/**
 * Invalidate all user-related cache entries (server-safe version)
 */
export function invalidateUserCacheServer(): void {
  try {
    // Get all cache keys
    const keys = Array.from((cache as any)['cache']?.keys() || []);

    // Invalidate all user-related cache entries
    keys.forEach(key => {
      if (key.startsWith('user:') || key.startsWith('users:')) {
        invalidateCacheServer(key);
      }
    });
  } catch (error) {
    console.error('Error in invalidateUserCacheServer:', error);
  }
}
