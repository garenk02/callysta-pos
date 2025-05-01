// lib/supabase/client-settings.ts
import { createClient } from './client';

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
 * Get all settings from the database
 */
export async function getAllSettings(): Promise<{ settings: Setting[] | null; error: Error | null }> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .order('key');
      
    if (error) {
      console.error('Error fetching settings:', error.message);
      return { settings: null, error: new Error(error.message) };
    }
    
    return { settings: data as Setting[], error: null };
  } catch (err) {
    console.error('Unexpected error fetching settings:', err);
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    return { settings: null, error: new Error(errorMessage) };
  }
}

/**
 * Get a specific setting by key
 */
export async function getSetting(key: SettingKey): Promise<{ setting: Setting | null; error: Error | null }> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('key', key)
      .single();
      
    if (error) {
      console.error(`Error fetching setting ${key}:`, error.message);
      return { setting: null, error: new Error(error.message) };
    }
    
    return { setting: data as Setting, error: null };
  } catch (err) {
    console.error(`Unexpected error fetching setting ${key}:`, err);
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    return { setting: null, error: new Error(errorMessage) };
  }
}

/**
 * Update a setting
 */
export async function updateSetting(key: SettingKey, value: string): Promise<{ success: boolean; error: Error | null }> {
  try {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('settings')
      .update({ value })
      .eq('key', key);
      
    if (error) {
      console.error(`Error updating setting ${key}:`, error.message);
      return { success: false, error: new Error(error.message) };
    }
    
    return { success: true, error: null };
  } catch (err) {
    console.error(`Unexpected error updating setting ${key}:`, err);
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    return { success: false, error: new Error(errorMessage) };
  }
}

/**
 * Update multiple settings at once
 */
export async function updateSettings(settings: Partial<SettingsMap>): Promise<{ success: boolean; error: Error | null }> {
  try {
    const supabase = createClient();
    
    // Create an array of update promises
    const updatePromises = Object.entries(settings).map(([key, value]) => {
      return supabase
        .from('settings')
        .update({ value })
        .eq('key', key);
    });
    
    // Execute all updates in parallel
    const results = await Promise.all(updatePromises);
    
    // Check if any updates failed
    const errors = results
      .map(result => result.error)
      .filter(Boolean);
      
    if (errors.length > 0) {
      console.error('Error updating settings:', errors);
      return { success: false, error: new Error(errors[0]?.message || 'Failed to update settings') };
    }
    
    return { success: true, error: null };
  } catch (err) {
    console.error('Unexpected error updating settings:', err);
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    return { success: false, error: new Error(errorMessage) };
  }
}

/**
 * Get all settings as a map of key to value
 */
export async function getSettingsMap(): Promise<{ settings: SettingsMap | null; error: Error | null }> {
  try {
    const { settings, error } = await getAllSettings();
    
    if (error) {
      return { settings: null, error };
    }
    
    if (!settings) {
      return { settings: null, error: new Error('No settings found') };
    }
    
    // Convert array of settings to a map
    const settingsMap = settings.reduce((map, setting) => {
      map[setting.key] = setting.value;
      return map;
    }, {} as SettingsMap);
    
    return { settings: settingsMap, error: null };
  } catch (err) {
    console.error('Unexpected error getting settings map:', err);
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    return { settings: null, error: new Error(errorMessage) };
  }
}
