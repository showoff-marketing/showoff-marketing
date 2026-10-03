import { createFileRoute, redirect } from "@tanstack/react-router";

import { createSupabaseBrowserClient } from "../lib/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  loader: async ({ location }) => {
    const code = new URLSearchParams(location.searchStr).get("code");
    if (code) {
      const { error } = await createSupabaseBrowserClient().auth.exchangeCodeForSession(code);
      if (error) throw new Error("We could not complete sign-in. Please try again.");
    }
    throw redirect({ to: "/" });
  },
  component: () => (
    <main className="admin-callback" aria-live="polite">
      Finishing secure sign-in…
    </main>
  ),
});
