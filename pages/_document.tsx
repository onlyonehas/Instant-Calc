import "dotenv/config";
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import Document, { Head, Html, Main, NextScript } from "next/document";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASEAPIKEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASEAUTHDOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASEPROJECTID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASESTORAGEBUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_MESSAGESENDERID,
  appId: process.env.NEXT_PUBLIC_FIREBASEAPPID,
  measurementId: process.env.NEXT_PUBLIC_MEASUREMENTID,
  databaseURL: process.env.NEXT_PUBLIC_DATABASEDOMAIN,
};

export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

/* eslint-disable  */
export const auth = getAuth(app);
export const database = getDatabase(app);
// export const provider = new GoogleAuthProvider();
/* eslint-enable */

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
