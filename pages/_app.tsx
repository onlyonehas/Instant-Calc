import { useEffect } from "react";
import { useRouter } from "next/router";
import { analytics } from "@/lib/firebase-client";
import { logEvent } from "firebase/analytics";
import { DarkModeProvider } from "@/contexts/DarkModeContext";
import type { AppProps } from "next/app";
import "../app/globals.css";

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    if (analytics) {
      logEvent(analytics, "page_view", {
        page_path: window.location.pathname,
        page_title: document.title,
      });
    }
  }, []);

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      if (analytics) {
        logEvent(analytics, "page_view", {
          page_path: url,
          page_title: document.title,
        });
      }
    };
    router.events.on("routeChangeComplete", handleRouteChange);
    return () => router.events.off("routeChangeComplete", handleRouteChange);
  }, [router.events]);

  return (
    <DarkModeProvider>
      <Component {...pageProps} />
    </DarkModeProvider>
  );
}

export default MyApp;
