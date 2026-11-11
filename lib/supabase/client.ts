"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return { supabaseUrl, supabaseAnonKey };
}

/** Cliente browser singleton. Retorna null se as envs públicas não estiverem configuradas. */
export function getSupabaseBrowserClient() {
  const env = getSupabaseBrowserEnv();
  if (!env) return null;

  if (!browserClient) {
    browserClient = createBrowserClient(env.supabaseUrl, env.supabaseAnonKey);
  }

  return browserClient;
}

/** @deprecated Preferir `getSupabaseBrowserClient`. */
export function createSupabaseBrowserClient() {
  const client = getSupabaseBrowserClient();
  if (!client) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY precisam estar configuradas.",
    );
  }
  return client;
}
