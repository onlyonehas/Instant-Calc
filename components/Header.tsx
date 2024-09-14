import { useCustomAuth } from "@/hooks/useCustomAuth";
import {
  GoogleAuthProvider,
  User,
  getAuth,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import Link from "next/link";
import { app } from "../pages/_document";
import { DarkMode } from "./DarkMode";
import { Profile } from "./Profile";

type Header = {
  darkMode: boolean;
  toggleDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  toggleModal: React.Dispatch<React.SetStateAction<boolean>>;
};

export const signOutGoogle = () => {
  const auth = getAuth(app);
  signOut(auth)
    .then(() => {})
    .catch((error) => {
      console.error(error);
    });
};

const SignInButton = () => {
  const signInWithGoogle = async () => {
    try {
      const auth = getAuth(app);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <button
      onClick={signInWithGoogle}
      type="button"
      className="py-2 px-2.5 md:me-4 md:px-5 md:py-2.5 text-white bg-[#4285F4] hover:bg-[#4285F4]/90 focus:ring-4 focus:outline-none focus:ring-[#4285F4]/50 font-medium rounded-lg text-sm text-center inline-flex items-center dark:focus:ring-[#4285F4]/55"
    >
      <svg
        className="w-4 h-4 me-2"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        viewBox="0 0 18 19"
      >
        <path
          fillRule="evenodd"
          d="M8.842 18.083a8.8 8.8 0 0 1-8.65-8.948 8.841 8.841 0 0 1 8.8-8.652h.153a8.464 8.464 0 0 1 5.7 2.257l-2.193 2.038A5.27 5.27 0 0 0 9.09 3.4a5.882 5.882 0 0 0-.2 11.76h.124a5.091 5.091 0 0 0 5.248-4.057L14.3 11H9V8h8.34c.066.543.095 1.09.088 1.636-.086 5.053-3.463 8.449-8.4 8.449l-.186-.002Z"
          clipRule="evenodd"
        />
      </svg>
      Sign in with Google
    </button>
  );
};

interface SignOutButtonProps {
  user: User | null;
  toggleModal: React.Dispatch<React.SetStateAction<boolean>>;
}
const SignOutButton: React.FC<SignOutButtonProps> = ({ user, toggleModal }) => {
  return (
    <>
      <Profile user={user} />
      <button
        onClick={() => toggleModal(true)}
        className="text-white bg-[#dd3838] hover:bg-[#4285F4]/90 focus:ring-4 focus:outline-none focus:ring-[#4285F4]/50 font-medium rounded-lg text-sm px-3 py-2 mx-2.5 text-center inline-flex items-center dark:focus:ring-[#4285F4]/55 me-2"
      >
        Sign Out
      </button>
    </>
  );
};

export const Header = ({ darkMode, toggleDarkMode, toggleModal }: Header) => {
  const user: User | null = useCustomAuth();

  return (
    <header>
      <nav className="bg-white border-gray-200 px-2.5 pt-0 lg:px-6 py-2.5 md:h-16 dark:bg-gray-800">
        <div className="flex flex-wrap justify-between items-center mx-auto max-w-screen-xl">
          <div>
            <Link href="/">
              <img
                src="/ic-transparent.png"
                className="h-16 lg:mr-10"
                alt="Instant Calc Logo"
              />
            </Link>
          </div>
          <div className="flex items-center lg:order-2">
            {!user ? (
              <SignInButton />
            ) : (
              <SignOutButton user={user} toggleModal={toggleModal} />
            )}
            <DarkMode darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
            <button
              data-collapse-toggle="mobile-menu-2"
              type="button"
              className="inline-flex items-center p-2 mx-1 text-sm text-gray-500 rounded-lg lg:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
              aria-controls="mobile-menu-2"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className="w-6 h-6"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clipRule="evenodd"
                ></path>
              </svg>
              <svg
                className="hidden w-6 h-6"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                ></path>
              </svg>
            </button>
          </div>
          <div
            className="hidden justify-between items-center w-full lg:flex lg:w-auto lg:order-1"
            id="mobile-menu-2"
          >
            <ul className="flex flex-col mt-4 font-medium lg:flex-row lg:space-x-8 lg:mt-0">
              <li>
                <Link
                  href="/"
                  className="block py-2 pr-4 pl-3 text-white rounded bg-blue-700 lg:bg-transparent lg:text-blue-700 lg:p-0 dark:text-white"
                  aria-current="page"
                >
                  Home
                </Link>
              </li>
              <li>
                <a
                  href="/about"
                  className="block py-2 pr-4 pl-3 text-gray-700 border-b border-gray-100 hover:bg-gray-50 lg:hover:bg-transparent lg:border-0 lg:hover:text-blue-700 lg:p-0 dark:text-gray-400 lg:dark:hover:text-white dark:hover:bg-gray-700 dark:hover:text-white lg:dark:hover:bg-transparent dark:border-gray-700"
                >
                  About
                </a>
              </li>
              <li>
                <Link
                  href="/about#usage"
                  className="block py-2 pr-4 pl-3 text-gray-700 border-b border-gray-100 hover:bg-gray-50 lg:hover:bg-transparent lg:border-0 lg:hover:text-blue-700 lg:p-0 dark:text-gray-400 lg:dark:hover:text-white dark:hover:bg-gray-700 dark:hover:text-white lg:dark:hover:bg-transparent dark:border-gray-700"
                >
                  How it works
                </Link>
              </li>
              <li>
                <Link
                  href="/new-features"
                  className="block py-2 pr-4 pl-3 text-gray-700 border-b border-gray-100 hover:bg-gray-50 lg:hover:bg-transparent lg:border-0 lg:hover:text-blue-700 lg:p-0 dark:text-gray-400 lg:dark:hover:text-white dark:hover:bg-gray-700 dark:hover:text-white lg:dark:hover:bg-transparent dark:border-gray-700"
                >
                  Feature Request
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
};
