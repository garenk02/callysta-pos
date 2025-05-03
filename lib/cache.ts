/**
 * Simple in-memory cache implementation with TTL support
 */

interface CacheItem<T> {
  value: T;
  expiry: number | null; // null means no expiry
}

class Cache {
  private cache: Map<string, CacheItem<any>> = new Map();
  
  /**
   * Set a value in the cache
   * @param key Cache key
   * @param value Value to store
   * @param ttl Time to live in seconds (optional, default is no expiry)
   */
  set<T>(key: string, value: T, ttl?: number): void {
    const expiry = ttl ? Date.now() + ttl * 1000 : null;
    this.cache.set(key, { value, expiry });
  }
  
  /**
   * Get a value from the cache
   * @param key Cache key
   * @returns The cached value or undefined if not found or expired
   */
  get<T>(key: string): T | undefined {
    const item = this.cache.get(key);
    
    // Return undefined if item doesn't exist
    if (!item) return undefined;
    
    // Check if the item has expired
    if (item.expiry && Date.now() > item.expiry) {
      this.cache.delete(key);
      return undefined;
    }
    
    return item.value as T;
  }
  
  /**
   * Check if a key exists in the cache and is not expired
   * @param key Cache key
   * @returns True if the key exists and is not expired
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    if (item.expiry && Date.now() > item.expiry) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }
  
  /**
   * Delete a key from the cache
   * @param key Cache key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  /**
   * Clear all items from the cache
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Get or set a value in the cache
   * If the key doesn't exist or is expired, the factory function is called to generate a new value
   * @param key Cache key
   * @param factory Function to generate a value if not in cache
   * @param ttl Time to live in seconds (optional)
   * @returns The cached or newly generated value
   */
  async getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
    const cachedValue = this.get<T>(key);
    if (cachedValue !== undefined) {
      return cachedValue;
    }
    
    const value = await factory();
    this.set(key, value, ttl);
    return value;
  }
  
  /**
   * Remove all expired items from the cache
   * @returns Number of items removed
   */
  cleanup(): number {
    let count = 0;
    const now = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (item.expiry && now > item.expiry) {
        this.cache.delete(key);
        count++;
      }
    }
    
    return count;
  }
}

// Create a singleton instance
const cache = new Cache();

// Run cleanup every minute
setInterval(() => {
  cache.cleanup();
}, 60 * 1000);

export default cache;
