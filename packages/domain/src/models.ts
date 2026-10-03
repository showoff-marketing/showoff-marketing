export type OrganizationId = string;
export type UserId = string;

export interface Organization {
  id: OrganizationId;
  name: string;
  createdBy: UserId;
  createdAt: string;
  updatedAt: string;
}

export type OrganizationRole = "owner" | "member";

export interface OrganizationMembership {
  organizationId: OrganizationId;
  userId: UserId;
  role: OrganizationRole;
  createdAt: string;
}

export type SubscriptionState =
  | "trialing"
  | "active"
  | "pause_scheduled"
  | "paused"
  | "cancellation_scheduled"
  | "payment_required"
  | "cancelled"
  | "terminated";

export interface Subscription {
  organizationId: OrganizationId;
  state: SubscriptionState;
  stripeStatus: string | null;
  currentPeriodEndsAt: string | null;
}

export interface UsageCounter {
  organizationId: OrganizationId;
  key: string;
  used: number;
  allowance: number | null;
  periodStartsAt: string;
  periodEndsAt: string;
}

export interface PlanEntitlement {
  organizationId: OrganizationId;
  key: EntitlementKey;
  enabled: boolean;
  limit: number | null;
  effectiveAt: string;
}

export interface PlanCatalogEntitlement {
  planKey: string;
  key: EntitlementKey;
  enabled: boolean;
  limit: number | null;
  limitPeriod: "day" | "month" | "lifetime" | null;
}

export interface EntitlementDecision {
  enabled: boolean;
  quantityLimit: number | null;
}

export interface Approval {
  id: string;
  organizationId: OrganizationId;
  actionKey: string;
  subjectType: string;
  subjectId: string | null;
  requestedPayload: Record<string, unknown>;
  status: "pending" | "approved" | "rejected" | "cancelled";
  requestedBy: UserId;
  decidedBy: UserId | null;
  decisionReason: string | null;
  correlationId: string;
  requestedAt: string;
  decidedAt: string | null;
}

export interface MediaAsset {
  id: string;
  organizationId: OrganizationId;
  mediaType: "image" | "video" | "audio";
  storagePath: string;
  mimeType: string;
  sizeBytes: number | null;
  createdBy: UserId;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface GenerationConfig {
  providerKey: string;
  modelKey: string;
  mediaType: "image" | "video" | "audio";
  aspectRatio?: string;
  durationSeconds?: number;
  outputFormat?: string;
  options?: Record<string, unknown>;
}

export interface ProviderRequestEvent {
  id: string;
  organizationId: OrganizationId | null;
  providerKey: string;
  operation: string;
  outcome: "accepted" | "succeeded" | "failed" | "rate_limited";
  providerRequestId: string | null;
  durationMs: number | null;
  retryable: boolean;
  errorCode: string | null;
  correlationId: string;
  occurredAt: string;
}

export interface OperationalAlert {
  id: string;
  organizationId: OrganizationId | null;
  severity: "info" | "warning" | "critical";
  source: string;
  key: string;
  summary: string;
  status: "open" | "acknowledged" | "resolved";
  correlationId: string | null;
  occurrenceCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface UsageReservation {
  id: string;
  organizationId: OrganizationId;
  key: string;
  quantity: number;
  idempotencyKey: string;
  status: "reserved" | "committed" | "released";
  createdAt: string;
}

export interface UsageLedgerEntry {
  id: string;
  organizationId: OrganizationId;
  reservationId: string | null;
  key: string;
  quantity: number;
  direction: "debit" | "credit";
  correlationId: string;
  createdAt: string;
}

export interface Contact {
  id: string;
  organizationId: OrganizationId;
  email: string | null;
  phone: string | null;
  consent: { email: boolean; sms: boolean };
  createdAt: string;
  updatedAt: string;
}

export interface Lead {
  id: string;
  organizationId: OrganizationId;
  contactId: string;
  leadFormId: string | null;
  createdAt: string;
}

export interface LeadForm {
  id: string;
  organizationId: OrganizationId;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditEvent {
  id: string;
  organizationId: OrganizationId | null;
  actorId: UserId | null;
  action: string;
  entityType: string;
  entityId: string | null;
  correlationId: string;
  occurredAt: string;
  metadata: Record<string, unknown>;
}

export type JobStatus = "queued" | "running" | "succeeded" | "failed" | "cancelled";

export interface BackgroundJob<TInput = unknown, TOutput = unknown> {
  id: string;
  organizationId: OrganizationId;
  kind: string;
  status: JobStatus;
  input: TInput;
  output: TOutput | null;
  correlationId: string;
  attempt: number;
  createdAt: string;
  updatedAt: string;
}

export interface EditableDraft {
  id: string;
  organizationId: OrganizationId;
  ownerId: UserId;
  kind: string;
  content: Record<string, unknown>;
  revision: number;
  updatedAt: string;
}

export type DraftSaveResult =
  | { status: "saved"; revision: number }
  | { status: "conflict"; currentRevision: number };

export type FeatureFlagKey = string;
export type EntitlementKey = string;
export type PermissionKey = string;

export interface CapabilityContext {
  flagEnabled: boolean;
  entitled: boolean;
  permitted: boolean;
  providerReady: boolean;
  complianceAllows: boolean;
}

export type CapabilityBlock =
  | "feature_disabled"
  | "not_entitled"
  | "permission_required"
  | "provider_unavailable"
  | "compliance_required";

export interface CapabilityDecision {
  available: boolean;
  blockedBy: CapabilityBlock[];
}

export type AdminPermission = "platform_admin";

export interface AdminClaims {
  app_metadata?: {
    permissions?: unknown;
  };
}

export type AccessLevel = "full" | "read_only" | "billing_only" | "none";
