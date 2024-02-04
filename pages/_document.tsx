import 'dotenv/config'
import Document, { Html, Head, Main, NextScript } from 'next/document';
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASEAPIKEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASEAUTHDOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASEPROJECTID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASESTORAGEBUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_MESSAGESENDERID,
  appId: process.env.NEXT_PUBLIC_FIREBASEAPPID,
  measurementId: process.env.NEXT_PUBLIC_MEASUREMENTID,
  databaseURL: process.env.NEXT_PUBLIC_DATABASEDOMAIN
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
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
