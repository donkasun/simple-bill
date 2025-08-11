import type { BaseEntity } from '../hooks/useFirestore';

export type Item = BaseEntity & {
  userId: string;
  name: string;
  unitPrice: number;
  description?: string;
};


