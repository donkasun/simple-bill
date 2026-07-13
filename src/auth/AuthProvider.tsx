import { createContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { auth } from "../firebase/config";
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  type User,
} from "firebase/auth";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Dev mock user ───────────────────────────────────────────────────────────
// Set VITE_MOCK_USER=true in .env.development.local to skip Firebase auth
// and get an instant mock session for Playwright / local dev.
const MOCK_USER =
  import.meta.env.VITE_MOCK_USER === "true"
    ? ({
        uid: "mock-uid-123",
        email: "demo@simplebill.dev",
        displayName: "Demo User",
        photoURL: null,
      } as unknown as User)
    : null;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(MOCK_USER);
  const [loading, setLoading] = useState(MOCK_USER ? false : true);

  const signInWithGoogle = async () => {
    if (MOCK_USER) {
      setUser(MOCK_USER); // restore mock session
      return;
    }
    const provider = new GoogleAuthProvider();

    // Suppress the harmless Cross-Origin-Opener-Policy console noise that
    // Firefox and Chrome emit during Firebase popup auth about window.closed.
    // This is a browser-level warning, not a thrown exception. We shadow
    // console.error for the duration of the popup call to keep the console clean.
    const origConsoleError = console.error;
    try {
      console.error = (...args: Parameters<typeof console.error>) => {
        if (
          typeof args[0] === "string" &&
          (args[0] as string).includes("Cross-Origin-Opener-Policy")
        )
          return;
        origConsoleError(...args);
      };

      await signInWithPopup(auth, provider);
    } catch (error) {
      const err = error as { code?: string } | unknown;
      if (
        typeof err === "object" &&
        err &&
        "code" in err &&
        (err as { code?: string }).code === "auth/popup-closed-by-user"
      ) {
        return;
      }
      origConsoleError("Error signing in with Google:", error);
    } finally {
      console.error = origConsoleError;
    }
  };

  const signOutUser = async () => {
    if (MOCK_USER) {
      setUser(null); // clear mock session → ProtectedRoute redirects to /login
      return;
    }
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  useEffect(() => {
    if (MOCK_USER) return; // skip Firebase listener in mock mode
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const value = { user, loading, signInWithGoogle, signOut: signOutUser };
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
