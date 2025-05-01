// lib/supabase/server-settings.ts
import { createClient, createAdminClient } from './server';

export interface Setting {
  id: string;
  key: string;
  value: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export type SettingKey = 'app_name' | 'app_address' | 'app_phone' | 'app_email';

export interface SettingsMap {
  app_name: string;
  app_address: string;
  app_phone: string;
  app_email: string;
  [key: string]: string;
}

/**
 * Get a specific setting by key (server-side)
 */
export async function getServerSetting(key: SettingKey): Promise<string> {
  try {
    // Use admin client to bypass RLS policies
    const supabase = await createAdminClient();
    console.log(`Fetching setting ${key} with admin client...`);

    // Use limit(1) to get at most one row
    const { data, error } = await supabase
      .from('settings')
      .select('*') // Select all columns for debugging
      .eq('key', key)
      .limit(1);

    if (error) {
      console.error(`Error fetching setting ${key}:`, error.message);
      return key === 'app_name' ? 'Callysta POS' : '';
    }

    // Log the full data for debugging
    console.log(`Server setting ${key} data:`, JSON.stringify(data));

    // Check if we have data and return the first item's value
    if (data && data.length > 0) {
      console.log(`Server setting ${key} value:`, data[0].value);
      return data[0].value;
    }

    // Return default value if no data found
    console.log(`No value found for setting ${key}, using default`);
    return key === 'app_name' ? 'Callysta POS' : '';
  } catch (err) {
    console.error(`Unexpected error fetching setting ${key}:`, err);
    return key === 'app_name' ? 'Callysta POS' : '';
  }
}

/**
 * Get app name for use in metadata (server-side)
 */
export async function getAppName(): Promise<string> {
  console.log('Getting app name for metadata...');
  const appName = await getServerSetting('app_name');
  console.log('App name for metadata:', appName);
  return appName;
}
