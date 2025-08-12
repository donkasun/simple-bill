import { useContext } from "react";
import { useAuthContext } from "./AuthProvider";

export const useAuth = () => {
  const Ctx = useAuthContext();
  const context = useContext(Ctx);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};


