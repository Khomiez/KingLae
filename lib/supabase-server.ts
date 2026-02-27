import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
// Use service role key in server routes to bypass RLS. Falls back to anon key.
const supabaseServerKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export function createServerClient() {
  return createClient(supabaseUrl, supabaseServerKey)
}
