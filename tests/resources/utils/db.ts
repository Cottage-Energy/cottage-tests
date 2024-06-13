import { SupabaseClient } from '@supabase/supabase-js';

export const supabase = new SupabaseClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_KEY ?? '',
);