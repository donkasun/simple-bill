import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from "firebase/firestore";

export type AutoNumberDocumentType = "invoice" | "quotation";

/** Thrown when a manually entered document number is already in use. */
export class DuplicateDocNumberError extends Error {
  readonly docNumber: string;
  constructor(docNumber: string) {
    super(`Document number "${docNumber}" is already in use.`);
    this.name = "DuplicateDocNumberError";
    this.docNumber = docNumber;
  }
}

// Matches an auto-numbering-style document number, e.g. QUO-2026-005.
const MANUAL_DOC_NUMBER_RE = /^(INV|QUO)-(\d{4})-(\d{3,})$/;

export function buildDocNumberPrefix(
  type: AutoNumberDocumentType,
  date: string,
): string {
  const year =
    String(date ?? "").slice(0, 4) || String(new Date().getFullYear());
  const prefix = type === "invoice" ? "INV" : "QUO";
  return `${prefix}-${year}-`;
}

export async function allocateNextDocumentNumber(
  userId: string,
  type: AutoNumberDocumentType,
  date: string,
): Promise<string> {
  const { db } = await import("../firebase/config");
  const year =
    String(date ?? "").slice(0, 4) || String(new Date().getFullYear());
  const counterId = `${userId}_${type}_${year}`;
  const counterRef = doc(db, "docCounters", counterId);

  const nextSeq = await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef);
    const current =
      snap.exists() && typeof snap.data()?.seq === "number"
        ? (snap.data()?.seq as number)
        : 0;
    const next = current + 1;
    tx.set(
      counterRef,
      {
        userId,
        type,
        year,
        seq: next,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
    return next;
  });

  const prefix = type === "invoice" ? "INV" : "QUO";
  const padded = String(nextSeq).padStart(3, "0");
  return `${prefix}-${year}-${padded}`;
}

/**
 * Returns true when another of the user's documents already uses `docNumber`.
 * Pass `excludeId` to ignore the document currently being edited.
 */
export async function isDocNumberTaken(
  userId: string,
  docNumber: string,
  excludeId?: string,
): Promise<boolean> {
  const { db } = await import("../firebase/config");
  const q = query(
    collection(db, "documents"),
    where("userId", "==", userId),
    where("docNumber", "==", docNumber),
    limit(2),
  );
  const snap = await getDocs(q);
  return snap.docs.some((d) => d.id !== excludeId);
}

/**
 * When a user manually types an auto-numbering-style number (e.g. QUO-2026-005),
 * advance the matching counter so a later auto-allocation can't re-emit the same
 * number. No-op for free-form numbers or numbers at/below the current seq.
 */
export async function reconcileDocCounter(
  userId: string,
  docNumber: string,
): Promise<void> {
  const match = MANUAL_DOC_NUMBER_RE.exec(docNumber.trim());
  if (!match) return;
  const [, prefix, year, seqStr] = match;
  const seq = Number(seqStr);
  if (!Number.isFinite(seq)) return;
  const type: AutoNumberDocumentType =
    prefix === "INV" ? "invoice" : "quotation";

  const { db } = await import("../firebase/config");
  const counterRef = doc(db, "docCounters", `${userId}_${type}_${year}`);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef);
    const current =
      snap.exists() && typeof snap.data()?.seq === "number"
        ? (snap.data()?.seq as number)
        : 0;
    if (seq <= current) return;
    tx.set(
      counterRef,
      { userId, type, year, seq, updatedAt: serverTimestamp() },
      { merge: true },
    );
  });
}
