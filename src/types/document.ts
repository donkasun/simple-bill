import type { BaseEntity } from '../hooks/useFirestore';
import type { Timestamp } from 'firebase/firestore';

export type DocumentType = 'invoice' | 'quotation';
export type DocumentStatus = 'draft' | 'finalized';

export type DocumentLineItem = {
  itemId?: string;
  name: string;
  description?: string;
  unitPrice: number;
  quantity: number;
  amount: number;
};

export type DocumentEntity = BaseEntity & {
  userId: string;
  type: DocumentType;
  docNumber: string;
  date: string; // ISO yyyy-mm-dd
  customerId?: string;
  customerDetails?: { name?: string; email?: string; address?: string };
  items: DocumentLineItem[];
  subtotal: number;
  total: number;
  notes?: string;
  status: DocumentStatus;
  finalizedAt?: Timestamp;
};


