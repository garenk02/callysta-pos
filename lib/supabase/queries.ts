
// lib/supabase/queries.ts
import { Product } from '@/types';
import { createClient } from './server';
import { checkSupabaseEnv } from './env-check';

export async function getProducts(): Promise<{ products: Product[] | null; error: Error | null }> {
  try {
    // Check environment variables
    const envCheck = checkSupabaseEnv();
    console.log("Environment check result:", envCheck);
    
    if (!envCheck) {
      return { 
        products: null, 
        error: new Error('Missing Supabase environment variables. Please check your .env file.') 
      };
    }
    
    console.log("Creating Supabase client...");
    // Now properly awaiting the createClient function
    const supabase = await createClient();
    
    console.log("Fetching products from Supabase...");
    
    // Perform the database query
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true });

    console.log("Supabase response:", { 
      dataReceived: !!data, 
      dataLength: data?.length || 0,
      errorReceived: !!error
    });

    // Handle potential Supabase query errors
    if (error) {
      console.error("Supabase query error:", error.message);
      
      // Check if the error is because the table doesn't exist
      if (error.code === '42P01') {
        return { 
          products: null, 
          error: new Error("The 'products' table doesn't exist in your Supabase database. Please create it first.") 
        };
      }
      
      return { products: null, error: new Error(error.message) };
    }

    // Return successful data
    return { products: data, error: null };

  } catch (err) {
    // Catch any other unexpected errors during the process
    console.error("Error in getProducts function:", err);
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred fetching products';
    return { products: null, error: new Error(errorMessage) };
  }
}
