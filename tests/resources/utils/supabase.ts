import { SupabaseClient } from '@supabase/supabase-js';
//import { Config } from "sst/node/config";
import { Database } from "./database.types";

export const supabase = new SupabaseClient<Database>('https://wzlacfmshqvjhjczytan.supabase.co', process.env.SUPABASE_API_KEY!);
