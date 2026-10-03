import type { CapabilityContext, CapabilityDecision } from "./models";
import { resolveCapability } from "./capabilities";

export const messagingFeatureFlagKeys = {
  email: {
    global: "feature.email.enabled",
    marketing: "feature.email.marketing_enabled",
    transactional: "feature.email.transactional_enabled",
  },
  sms: {
    global: "feature.sms.enabled",
    marketing: "feature.sms.marketing_enabled",
    transactional: "feature.sms.transactional_enabled",
  },
  support: {
    chat: "feature.support_chat.enabled",
    ai: "feature.support_ai.enabled",
  },
} as const;

export type MessagingChannel = "email" | "sms";
export type MessagingPurpose = "marketing" | "transactional";

export type FeatureFlagSnapshot = Readonly<Record<string, boolean>>;

export function resolveMessagingCapability(
  channel: MessagingChannel,
  purpose: MessagingPurpose,
  flags: FeatureFlagSnapshot,
  otherChecks: Omit<CapabilityContext, "flagEnabled">,
): CapabilityDecision {
  const keys = messagingFeatureFlagKeys[channel];
  return resolveCapability({
    ...otherChecks,
    flagEnabled: flags[keys.global] === true && flags[keys[purpose]] === true,
  });
}

export function isSupportCapabilityEnabled(
  capability: "chat" | "ai",
  flags: FeatureFlagSnapshot,
): boolean {
  const key = messagingFeatureFlagKeys.support[capability];
  return flags[key] === true;
}
