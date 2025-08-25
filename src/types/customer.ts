import type { BaseEntity } from "@models/firestore";

export type Customer = BaseEntity & {
  userId: string;
  name: string;
  email?: string | null;
  address?: string | null;
  showEmail?: boolean;
};
