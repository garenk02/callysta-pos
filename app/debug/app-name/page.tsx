// app/debug/app-name/page.tsx
import { getAppName } from '@/lib/supabase/server-settings';
import { createAdminClient } from '@/lib/supabase/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DebugAppNamePage() {
  // Get app name using the function used for metadata
  const appName = await getAppName();
  
  // Get app name directly from Supabase
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('key', 'app_name')
    .limit(1);
  
  const directAppName = data && data.length > 0 ? data[0].value : 'Not found';
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Debug App Name</h1>
      
      <div className="space-y-4">
        <div className="p-4 border rounded">
          <h2 className="text-xl font-semibold mb-2">App Name from getAppName()</h2>
          <pre className="bg-gray-100 p-2 rounded">{appName}</pre>
        </div>
        
        <div className="p-4 border rounded">
          <h2 className="text-xl font-semibold mb-2">App Name directly from Supabase</h2>
          <pre className="bg-gray-100 p-2 rounded">{directAppName}</pre>
        </div>
        
        {error && (
          <div className="p-4 border rounded bg-red-50">
            <h2 className="text-xl font-semibold mb-2 text-red-800">Error</h2>
            <pre className="bg-red-100 p-2 rounded">{error.message}</pre>
          </div>
        )}
        
        <div className="p-4 border rounded">
          <h2 className="text-xl font-semibold mb-2">Raw Data</h2>
          <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-60">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
