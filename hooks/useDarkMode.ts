import { database } from "@/pages/_document";
import { User } from "firebase/auth";
import { get, off, ref, set } from "firebase/database";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useCustomAuth } from "./useCustomAuth";

// interface UseCalculationsResult {
//   getTheme: () => void;
//   saveTheme: (mode: boolean) => void;
// }

export const useDarkMode = (
  mode: boolean,
  callback: Dispatch<SetStateAction<boolean>>,
): void => {
  const user: User | null = useCustomAuth();
  const [databaseRef, setDatabaseRef] = useState<any>(null);
  const [hasFetchedTheme, setHasFetchedTheme] = useState(false);

  useEffect(() => {
    if (user && database) {
      setDatabaseRef(ref(database, `users/${user?.uid}/darkmode`));
    }
    return () => {
      if (databaseRef) {
        off(databaseRef);
      }
    };
  }, [user, database]);

  useEffect(() => {
    if (!hasFetchedTheme && databaseRef) {
      getTheme();
      setHasFetchedTheme(true);
    }
  }, [hasFetchedTheme, databaseRef]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", mode);
    saveTheme(mode);
  }, [mode]);

  const getTheme = async () => {
    try {
      const snapshot = await get(databaseRef);
      const data = snapshot.val();
      console.log({ data });
      callback(data);
    } catch (error) {
      console.error(error);
    }
  };

  const saveTheme = async (mode: boolean) => {
    try {
      if (databaseRef) {
        console.log({ mode });

        await set(databaseRef, mode);
      }
    } catch (error) {
      console.error(error);
    }
  };
};
