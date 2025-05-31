import { SupabaseClient } from '@supabase/supabase-js';
//import { Config } from "sst/node/config";
import { Database } from "./database.types";
import environmentBaseUrl from './environmentBaseUrl';

const env = process.env.ENV || 'dev';
const supabaseUrl = environmentBaseUrl[env].supabse_url;
export const supabase = new SupabaseClient<Database>(supabaseUrl, process.env.SUPABASE_API_KEY!);