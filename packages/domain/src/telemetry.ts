export const assistantIdentity = {
  internalKey: "showoff_assistant",
  defaultDisplayName: "Ziggy",
} as const;

export const analyticsEventDictionary = {
  "account.created": { area: "identity", description: "A user account was created." },
  "organization.created": {
    area: "identity",
    description: "An organization and owner membership were created.",
  },
  "approval.requested": {
    area: "approvals",
    description: "A consequential action was submitted for approval.",
  },
  "approval.decided": {
    area: "approvals",
    description: "An approval request was approved or rejected.",
  },
  "usage.reserved": { area: "usage", description: "Usage was reserved before work began." },
  "usage.committed": {
    area: "usage",
    description: "Reserved usage was committed after provider acceptance.",
  },
  "usage.released": {
    area: "usage",
    description: "A reservation was released after work failed before chargeable acceptance.",
  },
  "provider.request.failed": { area: "providers", description: "A provider request failed." },
} as const;

export type AnalyticsEventName = keyof typeof analyticsEventDictionary;

export interface CorrelatedEvent<
  TPayload extends Record<string, unknown> = Record<string, unknown>,
> {
  name: AnalyticsEventName;
  correlationId: string;
  occurredAt: string;
  payload: TPayload;
}

export function createCorrelationId(): string {
  if (!globalThis.crypto?.randomUUID) throw new Error("A secure random UUID source is required.");
  return globalThis.crypto.randomUUID();
}
