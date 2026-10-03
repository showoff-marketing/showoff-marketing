import { createBrowserClient } from "@supabase/ssr";

import { getSupabasePublicConfig } from "./config";

export function createSupabaseBrowserClient() {
  const { url, publishableKey } = getSupabasePublicConfig(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  );

  return createBrowserClient(url, publishableKey);
}
