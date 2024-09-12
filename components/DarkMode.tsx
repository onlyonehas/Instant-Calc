import "../styles/Dark.css";

type DarkMode = {
  lightMode: boolean;
  toggleDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
};

export const DarkMode = ({ lightMode, toggleDarkMode }: DarkMode) => {
  return (
    <div
      className={lightMode ? "tdnn day" : "tdnn"}
      onClick={() => {
        toggleDarkMode(!lightMode);
      }}
    >
      <div className={lightMode ? "moon sun" : "moon"}></div>
    </div>
  );
};
