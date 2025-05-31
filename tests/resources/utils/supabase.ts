import { SupabaseClient } from '@supabase/supabase-js';
//import { Config } from "sst/node/config";
import { Database } from "./database.types";
import environmentBaseUrl from './environmentBaseUrl';

const env = process.env.ENV || 'dev';
const supabaseUrl = environmentBaseUrl[env].supabse_url;
const supabaseApiKey = process.env.SUPABASE_API_KEY;
export const supabase = new SupabaseClient<Database>("https://wzlacfmshqvjhjczytan.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6bGFjZm1zaHF2amhqY3p5dGFuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY2MDk2MDIwOCwiZXhwIjoxOTc2NTM2MjA4fQ.2B-fu8vqPgkWuyiDxSRAP8T5pobgtc_Q1MUZa_rYYrI");