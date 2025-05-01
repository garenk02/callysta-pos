// lib/supabase/env-check.ts
export function checkSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // Only log partial key for security
  const maskedKey = key ? `${key.substring(0, 5)}...${key.substring(key.length - 5)}` : 'undefined';
  
  console.log('Supabase URL:', url || 'undefined');
  console.log('Supabase Anon Key (masked):', maskedKey);
  
  if (!url || !key) {
    console.error('Missing Supabase environment variables!');
    return false;
  }
  
  return true;
}
