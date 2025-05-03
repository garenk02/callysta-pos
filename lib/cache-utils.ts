import cache from './cache';
import {
  invalidateProductCacheServer,
  invalidateProductByIdServer,
  invalidateOrderCacheServer,
  invalidateUserCacheServer,
  clearCacheServer
} from './server-cache';

// Determine if we're running on the server or client
const isServer = typeof window === 'undefined';

/**
 * Invalidate all product-related cache entries
 */
export function invalidateProductCache(): void {
  if (isServer) {
    // Use server-safe version
    invalidateProductCacheServer();
  } else {
    // Client-side implementation
    try {
      // Dynamic import to avoid server-side import of client code
      import('@/hooks/useCache').then(({ invalidateCache }) => {
        // Get all cache keys
        const keys = Array.from(cache['cache'].keys());

        // Invalidate all product-related cache entries
        keys.forEach(key => {
          if (key.startsWith('product:') || key.startsWith('products:')) {
            invalidateCache(key);
          }
        });
      });
    } catch (error) {
      console.error('Error invalidating product cache:', error);
    }
  }
}

/**
 * Invalidate a specific product cache entry
 * @param productId Product ID
 */
export function invalidateProductById(productId: string): void {
  if (isServer) {
    // Use server-safe version
    invalidateProductByIdServer(productId);
  } else {
    // Client-side implementation
    try {
      // Dynamic import to avoid server-side import of client code
      import('@/hooks/useCache').then(({ invalidateCache }) => {
        invalidateCache(`product:${productId}`);

        // Also invalidate all product list caches since they might contain this product
        const keys = Array.from(cache['cache'].keys());
        keys.forEach(key => {
          if (key.startsWith('products:')) {
            invalidateCache(key);
          }
        });
      });
    } catch (error) {
      console.error('Error invalidating product cache by ID:', error);
    }
  }
}

/**
 * Invalidate all order-related cache entries
 */
export function invalidateOrderCache(): void {
  if (isServer) {
    // Use server-safe version
    invalidateOrderCacheServer();
  } else {
    // Client-side implementation
    try {
      // Dynamic import to avoid server-side import of client code
      import('@/hooks/useCache').then(({ invalidateCache }) => {
        // Get all cache keys
        const keys = Array.from(cache['cache'].keys());

        // Invalidate all order-related cache entries
        keys.forEach(key => {
          if (key.startsWith('order:') || key.startsWith('orders:')) {
            invalidateCache(key);
          }
        });
      });
    } catch (error) {
      console.error('Error invalidating order cache:', error);
    }
  }
}

/**
 * Invalidate all user-related cache entries
 */
export function invalidateUserCache(): void {
  if (isServer) {
    // Use server-safe version
    invalidateUserCacheServer();
  } else {
    // Client-side implementation
    try {
      // Dynamic import to avoid server-side import of client code
      import('@/hooks/useCache').then(({ invalidateCache }) => {
        // Get all cache keys
        const keys = Array.from(cache['cache'].keys());

        // Invalidate all user-related cache entries
        keys.forEach(key => {
          if (key.startsWith('user:') || key.startsWith('users:')) {
            invalidateCache(key);
          }
        });
      });
    } catch (error) {
      console.error('Error invalidating user cache:', error);
    }
  }
}

/**
 * Invalidate all cache entries
 */
export function invalidateAllCache(): void {
  if (isServer) {
    // Use server-safe version
    clearCacheServer();
  } else {
    // Client-side implementation
    cache.clear();
  }
}
