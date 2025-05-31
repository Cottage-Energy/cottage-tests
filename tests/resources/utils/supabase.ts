import { SupabaseClient } from '@supabase/supabase-js';
//import { Config } from "sst/node/config";
import { Database } from "./database.types";

export const supabase = new SupabaseClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_API_KEY!);
