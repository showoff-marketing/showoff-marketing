import type { AccessLevel, CapabilityContext, CapabilityDecision, Subscription } from "./models";

export function resolveCapability(context: CapabilityContext): CapabilityDecision {
  const blockedBy: CapabilityDecision["blockedBy"] = [];

  if (!context.flagEnabled) blockedBy.push("feature_disabled");
  if (!context.entitled) blockedBy.push("not_entitled");
  if (!context.permitted) blockedBy.push("permission_required");
  if (!context.providerReady) blockedBy.push("provider_unavailable");
  if (!context.complianceAllows) blockedBy.push("compliance_required");

  return { available: blockedBy.length === 0, blockedBy };
}

export function resolveSubscriptionAccess(
  subscription: Subscription,
  now = new Date(),
): AccessLevel {
  switch (subscription.state) {
    case "trialing":
    case "active":
      return "full";
    case "pause_scheduled":
    case "cancellation_scheduled":
      return hasCurrentPaidPeriod(subscription, now) ? "full" : "read_only";
    case "paused":
      return "read_only";
    case "payment_required":
      return "billing_only";
    case "cancelled":
    case "terminated":
      return "none";
  }
}

function hasCurrentPaidPeriod(subscription: Subscription, now: Date): boolean {
  return (
    subscription.currentPeriodEndsAt !== null &&
    Date.parse(subscription.currentPeriodEndsAt) > now.getTime()
  );
}
