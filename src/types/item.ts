import type { BaseEntity } from "@models/firestore";

export type Item = BaseEntity & {
  userId: string;
  name: string;
  unitPrice: number;
  description?: string;
};
