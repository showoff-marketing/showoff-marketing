import type { JobStatus } from "./models";

const allowedTransitions: Readonly<Record<JobStatus, readonly JobStatus[]>> = {
  queued: ["running", "cancelled"],
  running: ["succeeded", "failed", "cancelled"],
  succeeded: [],
  failed: ["queued"],
  cancelled: [],
};

export function canTransitionJob(
  from: JobStatus,
  to: JobStatus,
  attempt: number,
  maxAttempts: number,
): boolean {
  if (!allowedTransitions[from].includes(to)) return false;
  return !(from === "failed" && to === "queued") || attempt < maxAttempts;
}

export function getRetryDelayMs(attempt: number, baseDelayMs = 1_000, maxDelayMs = 60_000): number {
  if (!Number.isInteger(attempt) || attempt < 1)
    throw new Error("Job attempt must be a positive integer.");
  if (
    !Number.isFinite(baseDelayMs) ||
    baseDelayMs < 0 ||
    !Number.isFinite(maxDelayMs) ||
    maxDelayMs < 0
  ) {
    throw new Error("Retry delays must be non-negative finite values.");
  }
  return Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs);
}
