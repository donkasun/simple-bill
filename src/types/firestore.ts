import type { Timestamp } from "firebase/firestore";

export type FirestoreId = string;

export type BaseEntity = {
  id?: FirestoreId;
  userId?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};
