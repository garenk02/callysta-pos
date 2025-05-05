// lib/supabase/client-queries.ts
import { Product, User } from '@/types';
import { createClient } from './client';

import cache from '@/lib/cache';

export async function getProductsClient(options?: {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  category?: string;
  isActive?: boolean;
  useCache?: boolean;
  cacheTTL?: number;
}): Promise<{
  products: Product[] | null;
  totalCount?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  error: Error | null;
}> {
  try {
    const page = options?.page || 1;
    const pageSize = options?.pageSize || 10;
    const searchQuery = options?.searchQuery || '';
    const category = options?.category;
    const isActive = options?.isActive !== undefined ? options.isActive : true; // Default to active products
    const useCache = options?.useCache !== false; // Default to using cache
    const cacheTTL = options?.cacheTTL || 60; // Default cache TTL is 60 seconds

    console.log(`getProductsClient called with:`, {
      page,
      pageSize,
      searchQuery,
      category,
      isActive,
      useCache,
      cacheTTL
    });

    // Generate a cache key based on the query parameters
    const cacheKey = `products:${page}:${pageSize}:${searchQuery}:${category}:${isActive}`;

    // If using cache and the data is cached, return it
    if (useCache && !searchQuery) { // Don't cache search queries
      const cachedData = cache.get<{
        products: Product[] | null;
        totalCount: number;
        page: number;
        pageSize: number;
        totalPages: number;
      }>(cacheKey);

      if (cachedData) {
        return {
          ...cachedData,
          error: null
        };
      }
    }

    // Create a browser client
    const supabase = createClient();

    // Calculate range for pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    console.log(`Pagination calculation: from=${from}, to=${to}, page=${page}, pageSize=${pageSize}`);

    // Force a small delay to ensure we don't hit rate limits
    if (page > 1) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Start building the query
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' });

    // Apply filters
    if (searchQuery) {
      // Search in name, sku, and description
      query = query.or(`name.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
    }

    if (category) {
      query = query.eq('category', category);
    }

    // Handle active status - if isActive is true, include null values for backward compatibility
    if (isActive) {
      query = query.or('is_active.is.null,is_active.eq.true');
    } else if (isActive === false) {
      query = query.eq('is_active', false);
    }

    // Get total count first using a separate query
    let count = 0;
    try {
      // Create a separate query for counting
      const countQuery = supabase
        .from('products')
        .select('id', { count: 'exact', head: true });

      // Apply the same filters as the main query
      if (searchQuery) {
        // Search in name, sku, and description
        countQuery.or(`name.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      if (category) {
        countQuery.eq('category', category);
      }

      // Handle active status - if isActive is true, include null values for backward compatibility
      if (isActive) {
        countQuery.or('is_active.is.null,is_active.eq.true');
      } else if (isActive === false) {
        countQuery.eq('is_active', false);
      }

      // Execute the count query
      const { count: totalCount, error: countError } = await countQuery;

      if (countError) {
        console.error("Supabase count error:", countError.message);
        return { products: null, error: new Error(countError.message) };
      }

      // Set the count from the result
      count = totalCount || 0;
    } catch (countErr) {
      console.error("Error getting count:", countErr);
      // Continue with count = 0, we'll still try to get the data
    }

    // Then get paginated data
    console.log(`Fetching products with range: ${from} to ${to}`);
    const { data, error } = await query
      .order('name', { ascending: true })
      .range(from, to);

    // Handle potential Supabase query errors
    if (error) {
      console.error("Supabase query error:", error.message);
      return { products: null, error: new Error(error.message) };
    }

    console.log(`Fetched ${data?.length || 0} products`);
    if (data && data.length > 0) {
      console.log('First product:', data[0]);
    }

    // Calculate total pages
    const totalPages = Math.ceil((count || 0) / pageSize);

    // Prepare the result
    const result = {
      products: data,
      totalCount: count || 0,
      page,
      pageSize,
      totalPages,
    };

    // Cache the result if using cache and not a search query
    if (useCache && !searchQuery) {
      cache.set(cacheKey, result, cacheTTL);
    }

    // Return successful data with pagination info
    return {
      ...result,
      error: null
    };

  } catch (err) {
    // Catch any other unexpected errors during the process
    console.error("Error in getProductsClient function:", err);
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred fetching products';
    return { products: null, error: new Error(errorMessage) };
  }
}

export async function getProductByIdClient(
  idOrSku: string,
  options?: { useCache?: boolean; cacheTTL?: number }
): Promise<{ data: Product | null; error: Error | null }> {
  try {
    const useCache = options?.useCache !== false; // Default to using cache
    const cacheTTL = options?.cacheTTL || 300; // Default cache TTL is 5 minutes for individual products

    // Generate a cache key
    const cacheKey = `product:${idOrSku}`;

    // If using cache and the data is cached, return it
    if (useCache) {
      const cachedData = cache.get<Product>(cacheKey);
      if (cachedData) {
        return {
          data: cachedData,
          error: null
        };
      }
    }

    const supabase = createClient();
    let data, error;

    // First try to fetch by ID (assuming it's a UUID)
    if (idOrSku.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      const result = await supabase
        .from('products')
        .select('*')
        .eq('id', idOrSku)
        .or('is_active.is.null,is_active.eq.true') // Only fetch active products
        .single();

      data = result.data;
      error = result.error;
    }

    // If not found by ID or not a UUID, try by SKU
    if (!data) {
      const result = await supabase
        .from('products')
        .select('*')
        .eq('sku', idOrSku)
        .or('is_active.is.null,is_active.eq.true') // Only fetch active products
        .single();

      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error('Error fetching product:', error.message);
      return {
        data: null,
        error: new Error(`Product not found with ID or SKU: ${idOrSku}`)
      };
    }

    // Cache the result if using cache
    if (useCache && data) {
      cache.set(cacheKey, data, cacheTTL);
    }

    return {
      data: data as Product,
      error: null
    };
  } catch (err) {
    console.error('Unexpected error fetching product:', err);
    return {
      data: null,
      error: new Error('An unexpected error occurred while fetching the product')
    };
  }
}
