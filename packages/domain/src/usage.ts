export interface UsageBalanceSnapshot {
  allowance: number | null;
  used: number;
  reserved: number;
}

export type UsageReservationCheck =
  | { allowed: true; remainingAfterReservation: number | null }
  | { allowed: false; reason: "invalid_quantity" | "invalid_balance" | "usage_exhausted" };

/** A hard stop check that includes outstanding reservations, before a provider call starts. */
export function canReserveUsage(
  balance: UsageBalanceSnapshot,
  quantity: number,
): UsageReservationCheck {
  if (!Number.isFinite(quantity) || quantity <= 0)
    return { allowed: false, reason: "invalid_quantity" };
  if (
    !Number.isFinite(balance.used) ||
    balance.used < 0 ||
    !Number.isFinite(balance.reserved) ||
    balance.reserved < 0 ||
    (balance.allowance !== null && (!Number.isFinite(balance.allowance) || balance.allowance < 0))
  ) {
    return { allowed: false, reason: "invalid_balance" };
  }

  if (balance.allowance === null) return { allowed: true, remainingAfterReservation: null };
  const remaining = balance.allowance - balance.used - balance.reserved;
  if (quantity > remaining) return { allowed: false, reason: "usage_exhausted" };
  return { allowed: true, remainingAfterReservation: remaining - quantity };
}
