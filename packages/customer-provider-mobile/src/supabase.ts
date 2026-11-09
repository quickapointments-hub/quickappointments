import { createClient } from '@supabase/supabase-js';

const getEnvVar = (name: string): string | undefined => {
  if (typeof process !== 'undefined' && process.env && process.env[name]) {
    return process.env[name];
  }
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[name]) {
      // @ts-ignore
      return import.meta.env[name];
    }
  } catch (e) {
    // import.meta not available in some environments
  }
  return undefined;
};

const supabaseUrl = 
  getEnvVar('EXPO_PUBLIC_SUPABASE_URL') ||
  getEnvVar('VITE_SUPABASE_URL') ||
  'https://ugxgtgvykauyydxoqouz.supabase.co';

const supabaseAnonKey = 
  getEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY') ||
  getEnvVar('VITE_SUPABASE_ANON_KEY') ||
  'sb_publishable_sCfjCcIrT0I5JHxWy5oEAg_yvzs9lD1';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
