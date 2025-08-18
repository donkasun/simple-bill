import { useCallback, useEffect, useState, useMemo } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../auth/useAuth";
import type { UserProfile } from "@models/user";

const useUserProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userProfileRef = useMemo(() => {
    return user ? doc(db, "user_profiles", user.uid) : null;
  }, [user]);

  useEffect(() => {
    // Wait for authentication to complete
    if (authLoading) {
      return;
    }

    if (!userProfileRef || !user?.uid) {
      setLoading(false);
      return;
    }

    getDoc(userProfileRef)
      .then((docSnap) => {
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        } else {
          // Create a default profile if it doesn't exist
          const defaultProfile: UserProfile = {
            userId: user!.uid,
            currency: "USD",
          };
          setDoc(userProfileRef, defaultProfile, { merge: true });
          setProfile(defaultProfile);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch user profile:", err);
        setError("Failed to fetch user profile.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user, userProfileRef, authLoading]);

  const updateUserProfile = useCallback(
    async (data: Partial<UserProfile>) => {
      if (!userProfileRef) return;
      try {
        await setDoc(
          userProfileRef,
          { ...data, updatedAt: serverTimestamp() },
          { merge: true },
        );
        setProfile(
          (prevProfile) => ({ ...prevProfile, ...data }) as UserProfile,
        );
      } catch (err) {
        console.error(err);
        setError("Failed to update user profile.");
      }
    },
    [userProfileRef],
  );

  return { profile, loading, error, updateUserProfile };
};

export default useUserProfile;
