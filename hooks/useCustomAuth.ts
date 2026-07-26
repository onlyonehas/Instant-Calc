import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { FirebaseApp, getApps } from "firebase/app";

export const useCustomAuth = (): User | null => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!getApps().length) return;

    try {
      const auth = getAuth();

      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user);
      });

      return () => unsubscribe();
    } catch {
      // Firebase auth unavailable
    }
  }, []);

  return user;
};
