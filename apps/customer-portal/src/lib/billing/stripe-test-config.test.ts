import { describe, expect, it } from "vitest";
import { requireStripeTestSecretKey } from "./stripe-test-config";

describe("Stripe test-mode configuration", () => {
  it("requires an explicitly configured test-mode secret", () => {
    expect(() => requireStripeTestSecretKey(undefined)).toThrow(
      "Stripe test billing is unavailable",
    );
    expect(() => requireStripeTestSecretKey("sk_live_do_not_use")).toThrow(
      "test-mode secret keys only",
    );
    expect(requireStripeTestSecretKey("sk_test_example")).toBe("sk_test_example");
  });
});
