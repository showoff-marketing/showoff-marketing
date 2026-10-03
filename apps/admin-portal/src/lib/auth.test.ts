import { beforeEach, describe, expect, it, vi } from "vitest";
import { hasAdminPermission } from "@showoff/domain";
import { getAdminAccess } from "./auth";

const supabaseMocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("./supabase/client", () => ({
  createSupabaseBrowserClient: () => ({
    auth: { getUser: supabaseMocks.getUser },
    rpc: supabaseMocks.rpc,
  }),
}));

describe("platform admin permission", () => {
  it("accepts the server-managed platform_admin permission", () => {
    expect(
      hasAdminPermission({ app_metadata: { permissions: ["platform_admin"] } }, "platform_admin"),
    ).toBe(true);
  });

  it("denies users without platform_admin permission", () => {
    expect(
      hasAdminPermission({ app_metadata: { permissions: ["customer"] } }, "platform_admin"),
    ).toBe(false);
    expect(hasAdminPermission(null, "platform_admin")).toBe(false);
  });

  it("does not treat user-editable profile metadata as permission", () => {
    const claims = { app_metadata: {}, user_metadata: { permissions: ["platform_admin"] } };
    expect(hasAdminPermission(claims, "platform_admin")).toBe(false);
  });
});

describe("admin route access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("treats a missing session as unauthenticated", async () => {
    supabaseMocks.getUser.mockResolvedValue({
      data: { user: null },
      error: { name: "AuthSessionMissingError", status: 0 },
    });

    await expect(getAdminAccess()).resolves.toEqual({
      authenticated: false,
      authorized: false,
    });
    expect(supabaseMocks.rpc).not.toHaveBeenCalled();
  });

  it("asks Postgres to authorize signed-in users", async () => {
    supabaseMocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    supabaseMocks.rpc.mockResolvedValue({ data: true, error: null });

    await expect(getAdminAccess()).resolves.toEqual({
      authenticated: true,
      authorized: true,
    });
    expect(supabaseMocks.rpc).toHaveBeenCalledWith("has_platform_admin_access");
  });

  it("fails closed and reports unavailable checks truthfully", async () => {
    supabaseMocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    supabaseMocks.rpc.mockResolvedValue({ data: null, error: new Error("Network unavailable") });

    await expect(getAdminAccess()).rejects.toThrow("We could not verify admin access.");
  });
});
