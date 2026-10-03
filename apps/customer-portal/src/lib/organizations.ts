import { createSupabaseBrowserClient } from "./supabase/client";

export function normalizeOrganizationName(input: unknown): string {
  if (typeof input !== "string") throw new Error("Enter an organization name to continue.");

  const name = input.trim();
  if (name.length < 1 || name.length > 160) {
    throw new Error("Organization names must contain 1 to 160 characters.");
  }

  return name;
}

export async function createOrganization(input: unknown) {
  if (typeof input !== "object" || input === null || !("name" in input)) {
    throw new Error("Enter an organization name to continue.");
  }

  const name = normalizeOrganizationName(input.name);
  const supabase = createSupabaseBrowserClient();
  const { data: userResult, error: userError } = await supabase.auth.getUser();

  if (userError || !userResult.user) {
    throw new Error("Sign in before creating an organization.");
  }

  const { data: organizationId, error } = await supabase.rpc("create_organization", {
    organization_name: name,
  });

  if (error || typeof organizationId !== "string") {
    throw new Error(
      "We could not create your organization. Your account is still signed in; try again.",
    );
  }

  return { organizationId };
}
