import { useCallback, useEffect, useMemo, useState } from 'react';
import { db } from '../firebase/config';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  Timestamp,
  type QueryConstraint,
} from 'firebase/firestore';

export type FirestoreId = string;

export type BaseEntity = {
  id?: FirestoreId;
  userId?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type UseFirestoreOptions<T extends BaseEntity, U> = {
  collectionName: string;
  userId?: string;
  orderByField?: keyof T & string;
  orderDirection?: 'asc' | 'desc';
  subscribe?: boolean;
  whereEqual?: Array<{ field: keyof T & string; value: unknown }>;
  select?: (doc: T) => U;
};

type WithoutMeta<T extends BaseEntity> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;

export function useFirestore<T extends BaseEntity = BaseEntity, U = T>(options: UseFirestoreOptions<T, U>) {
  const { collectionName, userId, orderByField, orderDirection = 'desc', subscribe = true, whereEqual, select } = options;

  const [items, setItems] = useState<U[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const collectionRef = useMemo(() => collection(db, collectionName), [collectionName]);

  const buildQuery = useCallback(() => {
    const constraints: QueryConstraint[] = [];
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
    // Avoid running queries that would violate security rules before we know the userId.
    // Many collections are user-scoped; running an unscoped query can trigger permission errors.
    if (!userId && (!whereEqual || whereEqual.length === 0)) {
      setItems([]);
      setLoading(false);
      return;
    }
    const q = buildQuery();
    if (!subscribe) {
      getDocs(q)
        .then((snap) => {
          const data = snap.docs.map((d) => ({ id: d.id, ...(d.data() as T) } as T));
          const mapped = (select ? data.map((t) => select(t)) : (data as unknown as U[]));
          setItems(mapped);
        })
        .catch((e) => setError(e?.message ?? 'Failed to fetch'))
        .finally(() => setLoading(false));
      return;
    }
    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...(d.data() as T) } as T));
        const mapped = (select ? data.map((t) => select(t)) : (data as unknown as U[]));
        setItems(mapped);
        setLoading(false);
      },
      (e) => {
        setError(e?.message ?? 'Failed to subscribe');
        setLoading(false);
      }
    );
    return () => unsub();
  }, [buildQuery, subscribe, userId, whereEqual, select]);

  const add = useCallback(
    async (data: WithoutMeta<T> & { userId?: string }) => {
      const now = serverTimestamp();
      const payload: Omit<T, 'id'> = {
        ...(data as T),
        userId: (userId || data.userId) as string | undefined,
        createdAt: now as unknown as Timestamp,
        updatedAt: now as unknown as Timestamp,
      };
      const ref = await addDoc(collectionRef, payload as unknown as Record<string, unknown>);
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

  const getById = useCallback(
    async (id: FirestoreId): Promise<U | null> => {
      const ref = doc(collectionRef, id);
      const snap = await getDoc(ref);
      if (!snap.exists()) return null;
      const raw = { id: snap.id, ...(snap.data() as T) } as T;
      return select ? select(raw) : ((raw as unknown) as U);
    },
    [collectionRef, select]
  );

  const getOnce = useCallback(async (): Promise<U[]> => {
    const q = buildQuery();
    const snap = await getDocs(q);
    const data = snap.docs.map((d) => ({ id: d.id, ...(d.data() as T) } as T));
    return select ? data.map((t) => select(t)) : ((data as unknown) as U[]);
  }, [buildQuery, select]);

  return { items, loading, error, add, set, update, remove, getById, getOnce } as const;
}


