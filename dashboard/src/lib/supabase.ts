import { createClient } from "@supabase/supabase-js";
import { config } from "../config";

// Single browser client. Uses the publishable/anon key — safe to ship; all data
// access is gated by Supabase RLS + Auth (authenticated users get read-only).
export const supabase = createClient(
  config.supabaseUrl,
  config.supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  },
);
