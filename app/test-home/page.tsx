// app/test-home/page.tsx
import { getProducts } from '@/lib/supabase/queries';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function TestHomePage() {
  try {
    console.log("Rendering Test Home page...");
    
    // Call the dedicated async function to fetch products
    const { products, error } = await getProducts();
    
    console.log("Products data:", products);
    console.log("Error if any:", error);
    
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Test Home Page</h1>
        
        {error && (
          <div className="mb-8 p-4 border rounded bg-red-50">
            <h2 className="text-xl font-semibold mb-2 text-red-800">Error</h2>
            <pre className="whitespace-pre-wrap text-sm">{error.message}</pre>
          </div>
        )}
        
        {!error && (
          <div className="mb-8 p-4 border rounded">
            <h2 className="text-xl font-semibold mb-2">Products</h2>
            <p className="mb-2">
              Products found: <span className="font-mono">{products?.length || 0}</span>
            </p>
            
            {products && products.length > 0 ? (
              <div>
                <h3 className="font-semibold mt-4 mb-2">Product List:</h3>
                <ul className="list-disc pl-6">
                  {products.map(product => (
                    <li key={product.id} className="mb-2">
                      {product.name} - ${product.price.toFixed(2)}
                    </li>
                  ))}
                </ul>
                
                <div className="mt-6">
                  <h3 className="font-semibold mb-2">Sample Product Data:</h3>
                  <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto">
                    {JSON.stringify(products[0], null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <p>No products found.</p>
            )}
          </div>
        )}
      </div>
    );
  } catch (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6 text-red-600">Error</h1>
        <pre className="bg-red-50 p-4 rounded text-red-800">
          {error instanceof Error ? error.message : 'Unknown error occurred'}
        </pre>
      </div>
    );
  }
}