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
    // For static rendering compatibility, return default values
    if (typeof window === 'undefined' && process.env.VERCEL) {
      return getDefaultSettingValue(key);
    }

    // Use admin client to bypass RLS policies
    const supabase = await createAdminClient();

    // Use limit(1) to get at most one row
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', key)
      .limit(1);

    if (error) {
      console.error(`Error fetching setting ${key}:`, error.message);
      return getDefaultSettingValue(key);
    }

    // Check if we have data and return the first item's value
    if (data && data.length > 0) {
      return data[0].value;
    }

    // Return default value if no data found
    return getDefaultSettingValue(key);
  } catch (err) {
    console.error(`Unexpected error fetching setting ${key}:`, err);
    return getDefaultSettingValue(key);
  }
}

/**
 * Get default value for a setting
 */
function getDefaultSettingValue(key: SettingKey): string {
  switch (key) {
    case 'app_name':
      return 'Callysta POS';
    case 'app_address':
      return '';
    case 'app_phone':
      return '';
    case 'app_email':
      return '';
    default:
      return '';
  }
}

/**
 * Get app name for use in metadata (server-side)
 */
export async function getAppName(): Promise<string> {
  const appName = await getServerSetting('app_name');
  return appName;
}
