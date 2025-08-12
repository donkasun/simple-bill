import type { BaseEntity } from "@models/firestore";

export type Customer = BaseEntity & {
  userId: string;
  name: string;
  email?: string;
  address?: string;
  showEmail?: boolean;
};
