import type { BaseEntity } from '../hooks/useFirestore';

export type Customer = BaseEntity & {
  userId: string;
  name: string;
  email?: string;
  address?: string;
  showEmail?: boolean;
};


