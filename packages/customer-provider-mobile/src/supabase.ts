import { createClient } from '@supabase/supabase-js';

const procEnv = (globalThis as any)?.process?.env;

const supabaseUrl = 
  (import.meta.env?.VITE_SUPABASE_URL as string) ||
  (procEnv?.EXPO_PUBLIC_SUPABASE_URL as string) ||
  'https://ugxgtgvykauyydxoqouz.supabase.co';

const supabaseAnonKey = 
  (import.meta.env?.VITE_SUPABASE_ANON_KEY as string) ||
  (procEnv?.EXPO_PUBLIC_SUPABASE_ANON_KEY as string) ||
  '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

