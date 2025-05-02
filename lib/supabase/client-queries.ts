// lib/supabase/client-queries.ts
import { Product, User } from '@/types';
import { createClient } from './client';

export async function getProductsClient(): Promise<{ products: Product[] | null; error: Error | null }> {
  try {
    // Create a browser client
    const supabase = createClient();

    // Perform the database query - only fetch active products
    // If is_active is null (for backward compatibility), treat it as true
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .or('is_active.is.null,is_active.eq.true')
      .order('name', { ascending: true });

    // Handle potential Supabase query errors
    if (error) {
      console.error("Supabase query error:", error.message);
      return { products: null, error: new Error(error.message) };
    }

    // Return successful data
    return { products: data, error: null };

  } catch (err) {
    // Catch any other unexpected errors during the process
    console.error("Error in getProductsClient function:", err);
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred fetching products';
    return { products: null, error: new Error(errorMessage) };
  }
}

export async function getProductByIdClient(idOrSku: string): Promise<{ data: Product | null; error: Error | null }> {
  try {
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
