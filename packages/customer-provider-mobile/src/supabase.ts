import { createClient } from '@supabase/supabase-js';

const getEnvVar = (name: string): string | undefined => {
  try {
    const proc = (globalThis as any)?.process?.env;
    if (proc && proc[name]) {
      return proc[name];
    }
  } catch (e) { }

  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[name]) {
      // @ts-ignore
      return import.meta.env[name];
    }
  } catch (e) { }

  return undefined;
};

const supabaseUrl =
  getEnvVar('EXPO_PUBLIC_SUPABASE_URL') ||
  getEnvVar('VITE_SUPABASE_URL') ||
  'https://ugxgtgvykauyydxoqouz.supabase.co';

const supabaseKey =
  getEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY') ||
  getEnvVar('VITE_SUPABASE_ANON_KEY') ||
  'sb_publishable_sCfjCcIrT0I5JHxWy5oEAg_yvzs9lD1';

export const supabase = createClient(supabaseUrl, supabaseKey);
