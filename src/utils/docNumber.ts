import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';

export type AutoNumberDocumentType = 'invoice' | 'quotation';

export function buildDocNumberPrefix(type: AutoNumberDocumentType, date: string): string {
  const year = String(date ?? '').slice(0, 4) || String(new Date().getFullYear());
  const prefix = type === 'invoice' ? 'INV' : 'QUO';
  return `${prefix}-${year}-`;
}

export async function allocateNextDocumentNumber(
  userId: string,
  type: AutoNumberDocumentType,
  date: string
): Promise<string> {
  const { db } = await import('../firebase/config');
  const year = String(date ?? '').slice(0, 4) || String(new Date().getFullYear());
  const counterId = `${userId}_${type}_${year}`;
  const counterRef = doc(db, 'docCounters', counterId);

  const nextSeq = await runTransaction(db, async (tx) => {
    const snap = await tx.get(counterRef);
    const current = snap.exists() && typeof snap.data()?.seq === 'number' ? (snap.data()?.seq as number) : 0;
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
      { merge: true }
    );
    return next;
  });

  const prefix = type === 'invoice' ? 'INV' : 'QUO';
  const padded = String(nextSeq).padStart(3, '0');
  return `${prefix}-${year}-${padded}`;
}


