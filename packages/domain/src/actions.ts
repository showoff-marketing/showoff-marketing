import type { CapabilityDecision, PermissionKey } from "./models";

export type ActionRisk = "low" | "medium" | "high";
export type ApprovalRequirement = "never" | "policy" | "always";

export interface ActionDefinition {
  key: string;
  risk: ActionRisk;
  requiredPermission: PermissionKey;
  requiredFeature?: string;
  requiredEntitlement?: string;
  approval: ApprovalRequirement;
}

/** This server-owned list is the only set of actions an assistant may request. */
export const actionRegistry = [
  {
    key: "content.generate_draft",
    risk: "low",
    requiredPermission: "content.create",
    approval: "never",
  },
  {
    key: "campaign.create_draft",
    risk: "low",
    requiredPermission: "campaign.create",
    approval: "never",
  },
  {
    key: "social.schedule",
    risk: "medium",
    requiredPermission: "social.publish",
    requiredFeature: "feature.social.enabled",
    approval: "policy",
  },
  {
    key: "automation.activate",
    risk: "medium",
    requiredPermission: "automation.manage",
    approval: "policy",
  },
  {
    key: "advertising.launch",
    risk: "high",
    requiredPermission: "ads.launch",
    requiredFeature: "feature.ads.enabled",
    requiredEntitlement: "ads.enabled",
    approval: "always",
  },
  {
    key: "advertising.change_budget",
    risk: "high",
    requiredPermission: "ads.budget_approve",
    requiredFeature: "feature.ads.enabled",
    requiredEntitlement: "ads.enabled",
    approval: "always",
  },
  {
    key: "messaging.bulk_send",
    risk: "high",
    requiredPermission: "messaging.send",
    approval: "always",
  },
  { key: "billing.refund", risk: "high", requiredPermission: "billing.refund", approval: "always" },
  {
    key: "credits.reissue",
    risk: "high",
    requiredPermission: "credits.reissue",
    approval: "always",
  },
  {
    key: "security.role_change",
    risk: "high",
    requiredPermission: "security.manage",
    approval: "always",
  },
  { key: "data.delete", risk: "high", requiredPermission: "data.delete", approval: "always" },
] as const satisfies readonly ActionDefinition[];

export type RegisteredActionKey = (typeof actionRegistry)[number]["key"];
export type ApprovalStatus = "not_required" | "pending" | "approved" | "rejected";

export interface ActionPolicyContext {
  capability: CapabilityDecision;
  permissionGranted: boolean;
  policyRequiresApproval: boolean;
  approvalStatus: ApprovalStatus;
  policyBlocks?: readonly string[];
}

export type ActionPolicyDecision =
  | { status: "allowed"; action: ActionDefinition }
  | { status: "approval_required"; action: ActionDefinition }
  | { status: "blocked"; action: ActionDefinition | null; reasons: readonly string[] };

export function getRegisteredAction(key: string): ActionDefinition | null {
  return actionRegistry.find((action) => action.key === key) ?? null;
}

/** Evaluate authorization and policy before dispatching to a domain service. */
export function evaluateActionPolicy(
  key: string,
  context: ActionPolicyContext,
): ActionPolicyDecision {
  const action = getRegisteredAction(key);
  if (!action) return { status: "blocked", action: null, reasons: ["action_not_registered"] };

  const reasons = [...(context.policyBlocks ?? [])];
  if (!context.permissionGranted) reasons.push("permission_required");
  if (!context.capability.available) reasons.push(...context.capability.blockedBy);
  if (reasons.length) return { status: "blocked", action, reasons: [...new Set(reasons)] };

  const approvalIsRequired =
    action.approval === "always" ||
    (action.approval === "policy" && context.policyRequiresApproval);
  if (approvalIsRequired && context.approvalStatus !== "approved") {
    if (context.approvalStatus === "rejected") {
      return { status: "blocked", action, reasons: ["approval_rejected"] };
    }
    return { status: "approval_required", action };
  }

  return { status: "allowed", action };
}
