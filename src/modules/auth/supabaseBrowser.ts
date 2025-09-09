// Client-side Supabase helper (browser only)
// Uses anon key; RLS protects data. Do not import this in Server Components.
import { createClient } from "@supabase/supabase-js";


export const supabaseBrowser = () => {
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
return createClient(url, key, { auth: { persistSession: true } });
};