export function getSupabasePublicConfig(
  url: string | undefined,
  publishableKey: string | undefined,
) {
  if (!url || !publishableKey) {
    throw new Error(
      "Supabase Auth is unavailable. Configure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY for this environment.",
    );
  }

  return { url, publishableKey };
}
