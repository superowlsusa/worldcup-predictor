'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

// One shared client for the whole browser session. Creating a new client on
// every render returned a new object reference each time, which made effects
// that depend on the client (e.g. Nav's auth listener) re-run on every render
// and trigger an infinite render loop that froze the tab.
let client: SupabaseClient | undefined;

export function createBrowserSupabase(): SupabaseClient {
  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey);
  }
  return client;
}
