import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env?.VITE_SUPABASE_URL as string) || 'https://ugxgtgvykauyydxoqouz.supabase.co';
const supabaseKey = (import.meta.env?.VITE_SUPABASE_ANON_KEY as string) || 
  'sb_publishable_sCfjCcIrT0I5JHxWy5oEAg_yvzs9lD1';

export const supabase = createClient(supabaseUrl, supabaseKey);
