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
  const { data, error } = await createSupabaseBrowserClient().auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw new Error(error.message);
  return data.user;
}

export async function getAdminAccess() {
  const supabase = createSupabaseBrowserClient();
  const { data: userResult, error: userError } = await supabase.auth.getUser();

  if (
    userError?.name === "AuthSessionMissingError" ||
    userError?.status === 401 ||
    (!userError && !userResult.user)
  ) {
    return { authenticated: false, authorized: false };
  }

  if (userError || !userResult.user) {
    throw new Error("We could not verify your sign-in. Please try again.");
  }

  const { data: authorized, error } = await supabase.rpc("has_platform_admin_access");

  if (error) {
    throw new Error("We could not verify admin access. Please try again.");
  }

  return {
    authenticated: true,
    authorized: authorized === true,
  };
}
