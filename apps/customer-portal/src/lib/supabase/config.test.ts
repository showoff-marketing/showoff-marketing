import { describe, expect, it } from "vitest";
import { getSupabasePublicConfig } from "./config";

describe("Supabase public configuration", () => {
  it("returns configured public values", () => {
    expect(getSupabasePublicConfig("https://project.supabase.co", "sb_publishable_key")).toEqual({
      url: "https://project.supabase.co",
      publishableKey: "sb_publishable_key",
    });
  });

  it("reports unavailable Auth when required public configuration is missing", () => {
    expect(() => getSupabasePublicConfig(undefined, undefined)).toThrow(
      "Supabase Auth is unavailable. Configure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY for this environment.",
    );
  });
});
