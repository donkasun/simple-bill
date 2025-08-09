import { useCallback, useEffect, useMemo, useState } from 'react';
import { db } from '../firebase/config';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  Timestamp,
} from 'firebase/firestore';

export type FirestoreId = string;

export type BaseEntity = {
  id?: FirestoreId;
  userId?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type UseFirestoreOptions<T extends BaseEntity> = {
  collectionName: string;
  userId?: string;
  orderByField?: keyof T & string;
  orderDirection?: 'asc' | 'desc';
  subscribe?: boolean;
  whereEqual?: Array<{ field: keyof T & string; value: unknown }>;
};

export function useFirestore<T extends BaseEntity = BaseEntity>(options: UseFirestoreOptions<T>) {
  const { collectionName, userId, orderByField, orderDirection = 'desc', subscribe = true, whereEqual } = options;

  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const collectionRef = useMemo(() => collection(db, collectionName), [collectionName]);

  const buildQuery = useCallback(() => {
    const constraints: any[] = [];
    if (userId) constraints.push(where('userId', '==', userId));
    if (whereEqual) {
      for (const w of whereEqual) constraints.push(where(w.field, '==', w.value));
    }
    if (orderByField) constraints.push(orderBy(orderByField, orderDirection));
    return constraints.length ? query(collectionRef, ...constraints) : query(collectionRef);
  }, [collectionRef, userId, whereEqual, orderByField, orderDirection]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const q = buildQuery();
    if (!subscribe) {
      getDocs(q)
        .then((snap) => {
          const data = snap.docs.map((d) => ({ id: d.id, ...(d.data() as T) }));
          setItems(data);
        })
        .catch((e) => setError(e?.message ?? 'Failed to fetch'))
        .finally(() => setLoading(false));
      return;
    }
    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...(d.data() as T) }));
        setItems(data);
        setLoading(false);
      },
      (e) => {
        setError(e?.message ?? 'Failed to subscribe');
        setLoading(false);
      }
    );
    return () => unsub();
  }, [buildQuery, subscribe]);

  const add = useCallback(
    async (data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = serverTimestamp();
      const payload: any = { ...data, userId: userId ?? (data as any).userId, createdAt: now, updatedAt: now };
      const ref = await addDoc(collectionRef, payload);
      return ref.id as FirestoreId;
    },
    [collectionRef, userId]
  );

  const set = useCallback(
    async (id: FirestoreId, data: Partial<T>) => {
      const ref = doc(collectionRef, id);
      await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
    },
    [collectionRef]
  );

  const update = useCallback(
    async (id: FirestoreId, data: Partial<T>) => {
      const ref = doc(collectionRef, id);
      await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
    },
    [collectionRef]
  );

  const remove = useCallback(
    async (id: FirestoreId) => {
      const ref = doc(collectionRef, id);
      await deleteDoc(ref);
    },
    [collectionRef]
  );

  return { items, loading, error, add, set, update, remove } as const;
}


