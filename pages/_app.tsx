import { DarkModeProvider } from "@/contexts/DarkModeContext";
import type { AppProps } from "next/app";
import "../app/globals.css";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <DarkModeProvider>
      <Component {...pageProps} />
    </DarkModeProvider>
  );
}

export default MyApp;
