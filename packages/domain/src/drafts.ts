import type { DraftSaveResult, EditableDraft } from "./models";

export interface DraftPersistence<TDraft extends EditableDraft> {
  saveLocal(draft: TDraft): Promise<void>;
  saveRemote(draft: TDraft): Promise<DraftSaveResult>;
}

export type DraftPersistenceResult =
  | { status: "saved"; revision: number }
  | { status: "offline"; revision: number }
  | { status: "conflict"; currentRevision: number };

/** Save the local copy first. A remote failure or stale revision never discards the user's draft. */
export async function persistDraft<TDraft extends EditableDraft>(
  draft: TDraft,
  persistence: DraftPersistence<TDraft>,
): Promise<DraftPersistenceResult> {
  await persistence.saveLocal(draft);
  try {
    const result = await persistence.saveRemote(draft);
    return result.status === "saved"
      ? { status: "saved", revision: result.revision }
      : { status: "conflict", currentRevision: result.currentRevision };
  } catch {
    return { status: "offline", revision: draft.revision };
  }
}
