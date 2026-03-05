import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const url = import.meta.env.VITE_SUPABASE_URL;
if (!url) {
  throw new Error("Missing VITE_SUPABASE_URL");
}

const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
if (!publishableKey) {
  throw new Error("Missing VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY");
}

export const db = createClient<Database>(url, publishableKey);
