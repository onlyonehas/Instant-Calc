import "../styles/Dark.css";

type DarkMode = {
  mode: boolean;
  toggleDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
};

export const DarkMode = ({ mode, toggleDarkMode }: DarkMode) => {
  return (
    <div
      className={mode ? "tdnn day" : "tdnn"}
      onClick={() => {
        toggleDarkMode(!mode);
      }}
    >
      <div className={mode ? "moon sun" : "moon"}></div>
    </div>
  );
};
