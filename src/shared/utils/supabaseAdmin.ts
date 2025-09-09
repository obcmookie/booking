// server-only helper
import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!; // keep server-side only
  return createClient(url, key, { auth: { persistSession: false } });
};
