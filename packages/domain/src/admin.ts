import type { AdminClaims, AdminPermission } from "./models";

export function hasAdminPermission(
  claims: AdminClaims | null,
  permission: AdminPermission,
): boolean {
  const permissions = claims?.app_metadata?.permissions;
  return Array.isArray(permissions) && permissions.includes(permission);
}
