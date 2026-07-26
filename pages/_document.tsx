import { app, auth, database } from "@/lib/firebase-client";
import Document, { Head, Html, Main, NextScript } from "next/document";

export { app, auth, database };

export default class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
            html, body {
              height: 100%;
              margin: 0;
              padding: 0;
            }
          `}</style>
        <body className="h-full min-h-screen flex flex-col">
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
