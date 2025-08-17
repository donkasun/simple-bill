import { useCallback, useEffect, useState } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../auth/useAuth";
import type { UserProfile } from "@models/user";

const useUserProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userProfileRef = user ? doc(db, "user_profiles", user.uid) : null;

  useEffect(() => {
    // Wait for authentication to complete
    if (authLoading) {
      return;
    }

    if (!userProfileRef || !user?.uid) {
      setLoading(false);
      return;
    }

    console.log("Attempting to fetch user profile for:", user?.uid);
    console.log("User authenticated:", !!user);
    console.log("User email:", user?.email);
    console.log("User UID:", user?.uid);

    getDoc(userProfileRef)
      .then((docSnap) => {
        console.log("Document fetch successful");
        if (docSnap.exists()) {
          console.log("Document exists, data:", docSnap.data());
          setProfile(docSnap.data() as UserProfile);
        } else {
          console.log("Document doesn't exist, creating default profile");
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
        console.error("Firestore error details:", err);
        console.error("Error code:", err.code);
        console.error("Error message:", err.message);
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
