"use client";

import { useCustomAuth } from "@/hooks/useCustomAuth";
import { database } from "@/pages/_document";
import { User } from "firebase/auth";
import { get, ref, set } from "firebase/database";
import React, { createContext, useContext, useEffect, useState } from "react";

interface DarkModeContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const DarkModeContext = createContext<DarkModeContextType | undefined>(
  undefined,
);

export const DarkModeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [darkMode, setDarkMode] = useState(true);
  const user: User | null = useCustomAuth();

  useEffect(() => {
    if (user && database) {
      const databaseRef = ref(database, `users/${user.uid}/darkmode`);
      get(databaseRef).then((snapshot) => {
        const data = snapshot.val();
        if (data !== null) {
          setDarkMode(data);
        }
      });
    }
  }, [user]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode((prevMode) => {
      const newMode = !prevMode;
      if (user && database) {
        const databaseRef = ref(database, `users/${user.uid}/darkmode`);
        set(databaseRef, newMode);
      }
      return newMode;
    });
  };

  return (
    <DarkModeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
};

export const useDarkMode = () => {
  const context = useContext(DarkModeContext);
  if (context === undefined) {
    throw new Error("useDarkMode must be used within a DarkModeProvider");
  }
  return context;
};
