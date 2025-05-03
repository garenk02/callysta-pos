// app/api/settings/route.ts
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { SettingsMap } from '@/lib/supabase/client-settings';

// Force dynamic rendering to prevent caching issues
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// This endpoint allows public access to settings without authentication
export async function GET() {
  try {
    // Use the admin client to bypass RLS policies
    const supabase = await createAdminClient();

    const { data, error } = await supabase
      .from('settings')
      .select('key, value');

    if (error) {
      console.error('Error fetching settings:', error.message);
      return NextResponse.json(
        { error: 'Failed to fetch settings' },
        { status: 500 }
      );
    }

    // Convert array of settings to a map
    const settingsMap = data.reduce((map: SettingsMap, setting) => {
      map[setting.key as keyof SettingsMap] = setting.value;
      return map;
    }, {} as SettingsMap);

    return NextResponse.json(settingsMap);
  } catch (err) {
    console.error('Unexpected error in settings API:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
