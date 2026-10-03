import { describe, expect, it } from "vitest";
import {
  canReserveUsage,
  createMauticProviderAdapters,
  createStripeBillingAdapter,
  evaluateActionPolicy,
  getRetryDelayMs,
  persistDraft,
  resolveCapability,
  resolveMessagingCapability,
  resolveSubscriptionAccess,
  canTransitionJob,
  type Subscription,
  type SubscriptionState,
} from "@showoff/domain";

describe("feature capability resolution", () => {
  it("requires every independent availability check to pass", () => {
    expect(
      resolveCapability({
        flagEnabled: true,
        entitled: true,
        permitted: true,
        providerReady: true,
        complianceAllows: true,
      }),
    ).toEqual({ available: true, blockedBy: [] });
  });

  it("returns every reason a capability is unavailable", () => {
    expect(
      resolveCapability({
        flagEnabled: false,
        entitled: false,
        permitted: false,
        providerReady: false,
        complianceAllows: false,
      }).blockedBy,
    ).toEqual([
      "feature_disabled",
      "not_entitled",
      "permission_required",
      "provider_unavailable",
      "compliance_required",
    ]);
  });

  it("keeps messaging off unless both the global and channel-purpose flags are enabled", () => {
    const providerAndAccountChecks = {
      entitled: true,
      permitted: true,
      providerReady: true,
      complianceAllows: true,
    };

    expect(
      resolveMessagingCapability("email", "marketing", {}, providerAndAccountChecks),
    ).toMatchObject({
      available: false,
      blockedBy: ["feature_disabled"],
    });
    expect(
      resolveMessagingCapability(
        "email",
        "marketing",
        { "feature.email.enabled": true, "feature.email.marketing_enabled": true },
        providerAndAccountChecks,
      ).available,
    ).toBe(true);
  });
});

describe("subscription access states", () => {
  const now = new Date("2026-10-01T12:00:00.000Z");
  const subscription = (
    state: SubscriptionState,
    currentPeriodEndsAt: string | null = null,
  ): Subscription => ({
    organizationId: "org-1",
    state,
    stripeStatus: null,
    currentPeriodEndsAt,
  });

  it.each(["trialing", "active"] as const)("%s grants full access", (state) => {
    expect(resolveSubscriptionAccess(subscription(state), now)).toBe("full");
  });

  it.each(["pause_scheduled", "cancellation_scheduled"] as const)(
    "%s retains full access during the paid period and limits access after it",
    (state) => {
      expect(resolveSubscriptionAccess(subscription(state, "2026-10-02T00:00:00.000Z"), now)).toBe(
        "full",
      );
      expect(resolveSubscriptionAccess(subscription(state, "2026-10-01T11:59:00.000Z"), now)).toBe(
        "read_only",
      );
    },
  );

  it("keeps paused subscriptions read-only and payment-required accounts in billing-only access", () => {
    expect(resolveSubscriptionAccess(subscription("paused"), now)).toBe("read_only");
    expect(resolveSubscriptionAccess(subscription("payment_required"), now)).toBe("billing_only");
  });

  it.each(["cancelled", "terminated"] as const)("%s does not grant product access", (state) => {
    expect(resolveSubscriptionAccess(subscription(state), now)).toBe("none");
  });
});

describe("action policy and usage reservations", () => {
  const capability = { available: true, blockedBy: [] as [] };

  it("holds high risk actions until an explicit approval is recorded", () => {
    expect(
      evaluateActionPolicy("advertising.launch", {
        capability,
        permissionGranted: true,
        policyRequiresApproval: false,
        approvalStatus: "pending",
      }).status,
    ).toBe("approval_required");

    expect(
      evaluateActionPolicy("advertising.launch", {
        capability,
        permissionGranted: true,
        policyRequiresApproval: false,
        approvalStatus: "approved",
      }).status,
    ).toBe("allowed");
  });

  it("reserves against both consumed and in-flight work", () => {
    expect(canReserveUsage({ allowance: 10, used: 4, reserved: 3 }, 3)).toEqual({
      allowed: true,
      remainingAfterReservation: 0,
    });
    expect(canReserveUsage({ allowance: 10, used: 4, reserved: 3 }, 4)).toEqual({
      allowed: false,
      reason: "usage_exhausted",
    });
    expect(canReserveUsage({ allowance: null, used: 0, reserved: 999 }, 1)).toEqual({
      allowed: true,
      remainingAfterReservation: null,
    });
  });
});

describe("provider adapter and job foundations", () => {
  it("maps Mautic transport results into Showoff provider contracts", async () => {
    const adapters = createMauticProviderAdapters({
      upsertContact: async () => ({ contactId: "contact-1", requestId: "req-1" }),
      pauseContact: async () => ({ accepted: true, requestId: "req-2" }),
    });
    const context = { organizationId: "org-1", correlationId: "corr-1" };

    await expect(
      adapters.crm.upsertContact({ email: "person@example.test" }, context),
    ).resolves.toEqual({
      providerRequestId: "req-1",
      data: { contactId: "contact-1" },
    });
    await expect(
      adapters.automation.pauseContact({ contactId: "contact-1", reason: "requested" }, context),
    ).resolves.toEqual({
      providerRequestId: "req-2",
      data: { accepted: true },
    });
  });

  it("keeps billing session creation behind an injected server-side transport", async () => {
    const billing = createStripeBillingAdapter({
      createCheckoutSession: async () => ({
        redirectUrl: "https://billing.example.test/session",
        requestId: "stripe-1",
      }),
      createCustomerPortalSession: async () => ({
        redirectUrl: "https://billing.example.test/portal",
        requestId: "stripe-2",
      }),
    });
    const context = { organizationId: "org-1", correlationId: "corr-1" };

    await expect(
      billing.createCheckoutSession(
        {
          organizationId: "org-1",
          planKey: "starter",
          successUrl: "https://app.example.test/billing/success",
          cancelUrl: "https://app.example.test/billing",
        },
        context,
      ),
    ).resolves.toEqual({
      providerRequestId: "stripe-1",
      data: { redirectUrl: "https://billing.example.test/session" },
    });
  });

  it("allows retry only from a failed background job and applies bounded backoff", () => {
    expect(canTransitionJob("failed", "queued", 2, 3)).toBe(true);
    expect(canTransitionJob("failed", "queued", 3, 3)).toBe(false);
    expect(getRetryDelayMs(3, 1_000, 5_000)).toBe(4_000);
    expect(getRetryDelayMs(5, 1_000, 5_000)).toBe(5_000);
  });

  it("keeps the local draft when remote persistence is unavailable", async () => {
    const savedLocal: string[] = [];
    const result = await persistDraft(
      {
        id: "draft-1",
        organizationId: "org-1",
        ownerId: "user-1",
        kind: "campaign",
        content: { title: "Draft" },
        revision: 4,
        updatedAt: "2026-10-01T00:00:00.000Z",
      },
      {
        saveLocal: async (draft) => {
          savedLocal.push(draft.id);
        },
        saveRemote: async () => {
          throw new Error("offline");
        },
      },
    );

    expect(savedLocal).toEqual(["draft-1"]);
    expect(result).toEqual({ status: "offline", revision: 4 });
  });
});
