// app/api/debug/app-name/route.ts
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// This endpoint is for debugging the app name value
export async function GET() {
  try {
    // Use the admin client to bypass RLS policies
    const supabase = await createAdminClient();
    
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'app_name')
      .limit(1);
      
    if (error) {
      console.error('Error fetching app_name:', error.message);
      return NextResponse.json(
        { error: error.message, default: 'Callysta POS' },
        { status: 500 }
      );
    }
    
    const appName = data && data.length > 0 ? data[0].value : 'Callysta POS';
    
    return NextResponse.json({
      appName,
      dataLength: data ? data.length : 0,
      hasData: !!data && data.length > 0
    });
  } catch (err) {
    console.error('Unexpected error in app-name API:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
