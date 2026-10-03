import type { Provider } from "@supabase/supabase-js";

import { createSupabaseBrowserClient } from "./supabase/client";

type SupportedOAuthProvider = Extract<Provider, "apple" | "google">;

export async function signInWithProvider(provider: SupportedOAuthProvider) {
  const supabase = createSupabaseBrowserClient();
  const redirectTo = new URL("/auth/callback", window.location.origin).toString();
  const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
  if (error) throw new Error(error.message);
}

export async function signInWithPassword(email: string, password: string) {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return data.user;
}

export async function signUpWithPassword(email: string, password: string) {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw new Error(error.message);
  return { user: data.user, session: data.session };
}
