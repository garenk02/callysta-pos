// app/test-supabase/page.tsx
import { createClient } from '@/lib/supabase/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TestSupabasePage() {
  try {
    const supabase = await createClient();
    
    // Try to get products specifically
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(5);
    
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Supabase Connection Test</h1>
        
        <div className="mb-8 p-4 border rounded">
          <h2 className="text-xl font-semibold mb-2">Connection Status</h2>
          <p className="mb-2">
            Connection: <span className="font-mono">{productsError ? '❌ Failed' : '✅ Success'}</span>
          </p>
          {productsError && (
            <div className="bg-red-50 p-3 rounded text-red-800 mt-2">
              <p className="font-semibold">Error:</p>
              <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(productsError, null, 2)}</pre>
            </div>
          )}
        </div>
        
        <div className="mb-8 p-4 border rounded">
          <h2 className="text-xl font-semibold mb-2">Products Table</h2>
          <p className="mb-2">
            Query: <span className="font-mono">{productsError ? '❌ Failed' : '✅ Success'}</span>
          </p>
          <p className="mb-2">
            Products found: <span className="font-mono">{products?.length || 0}</span>
          </p>
          
          {productsError && (
            <div className="bg-red-50 p-3 rounded text-red-800 mt-2">
              <p className="font-semibold">Error:</p>
              <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(productsError, null, 2)}</pre>
            </div>
          )}
          
          {products && products.length > 0 && (
            <div className="mt-4">
              <p className="font-semibold">Sample Product:</p>
              <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto">{JSON.stringify(products[0], null, 2)}</pre>
            </div>
          )}
        </div>
        
        <div className="p-4 border rounded">
          <h2 className="text-xl font-semibold mb-2">Environment Variables</h2>
          <p className="mb-1">
            NEXT_PUBLIC_SUPABASE_URL: <span className="font-mono">{process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</span>
          </p>
          <p>
            NEXT_PUBLIC_SUPABASE_ANON_KEY: <span className="font-mono">{process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</span>
          </p>
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6 text-red-600">Supabase Connection Error</h1>
        <pre className="bg-red-50 p-4 rounded text-red-800">
          {error instanceof Error ? error.message : 'Unknown error occurred'}
        </pre>
      </div>
    );
  }
}
