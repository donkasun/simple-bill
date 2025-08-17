import type { BaseEntity } from "@models/firestore";
import type { Timestamp } from "firebase/firestore";

export type DocumentType = "invoice" | "quotation";
export type DocumentStatus = "draft" | "finalized";

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
  currency?: string;
  // Relationship tracking
  sourceDocumentId?: string; // ID of the quotation this invoice was generated from
  sourceDocumentType?: DocumentType; // Type of the source document
  relatedInvoices?: string[]; // Array of invoice IDs generated from this quotation
  // Invoice splitting support
  originalQuantity?: number; // Original quantity from source document (for partial invoicing)
  invoicedQuantity?: number; // Quantity that has been invoiced so far
  remainingQuantity?: number; // Remaining quantity to be invoiced
};

export type FormLineItem = DocumentLineItem & { id: string };

export type DocumentFormState = {
  documentType: DocumentType;
  documentNumber: string;
  date: string; // yyyy-mm-dd
  customerId?: string;
  notes?: string;
  lineItems: FormLineItem[];
};
