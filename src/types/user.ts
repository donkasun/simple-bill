import type { BaseEntity } from "@models/firestore";

export type UserProfile = BaseEntity & {
  userId: string;
  currency?: string;
  theme?: "light" | "dark" | "system";
  business?: {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
  };
};
