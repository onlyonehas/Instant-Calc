import "../styles/Dark.css";

type DarkMode = {
  darkMode: boolean;
  toggleDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
};

export const DarkMode = ({ darkMode, toggleDarkMode }: DarkMode) => {
  return (
    <div
      className={darkMode ? "tdnn" : "tdnn day"}
      onClick={() => {
        toggleDarkMode(!darkMode);
      }}
    >
      <div className={darkMode ? "moon" : "moon sun"}></div>
    </div>
  );
};
