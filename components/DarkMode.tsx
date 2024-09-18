"use client";

import "../styles/Dark.css";
import { useDarkMode } from "@/contexts/DarkModeContext";

export const DarkMode = () => {
  const { darkMode, toggleDarkMode } = useDarkMode();

  return (
    <div className={darkMode ? "tdnn" : "tdnn day"} onClick={toggleDarkMode}>
      <div className={darkMode ? "moon" : "moon sun"}></div>
    </div>
  );
};
