"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, LucideChevronsDown, LucideChevronsRight } from "lucide-react";
import Head from "next/head";
import router from "next/router";
import { useEffect, useRef, useState } from "react";

const prefix = "Instant ";
const words = ["Calculation", "Feedback"];

const useTypewriter = (
  text: string,
  speed: number = 100,
  isDeleting: boolean = false,
  index: number,
  setIndex: React.Dispatch<React.SetStateAction<number>>,
) => {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    if (isDeleting) {
      if (displayedText.length > 0) {
        const timer = setTimeout(() => {
          setDisplayedText((prev) => prev.slice(0, -1));
        }, speed);
        return () => clearTimeout(timer);
      }
    } else if (index < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText((prev) => prev + text[index]);
        setIndex((prev) => prev + 1);
      }, speed);
      return () => clearTimeout(timer);
    }
  }, [text, index, speed, isDeleting, displayedText]);

  return displayedText;
};

export default function About() {
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const aboutRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const usageRef = useRef<HTMLDivElement>(null);
  const futureWorkRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const displayedText = useTypewriter(words[wordIndex], 100, isDeleting, index, setIndex);

  useEffect(() => {
    if (displayedText === words[wordIndex] && !isDeleting) {
      const timer = setTimeout(() => {
        setIsDeleting(true);
      }, 2000);
      return () => clearTimeout(timer);
    } else if (displayedText === "" && isDeleting) {
      const timer = setTimeout(() => {
        setWordIndex((prev) => (prev + 1) % words.length);
        setIsDeleting(false);
        setIndex(0);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [displayedText, wordIndex, isDeleting]);

  const scrollToRef = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  };
  const buttonVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24,
      },
    },
    hover: {
      scale: 1.05,
      transition: { duration: 0.2 },
    },
  };

  return (
    <>
      <Head>
        <title>About - Instant Calc</title>
        <meta
          name="description"
          content="About Instant Calc - Your go-to tool for lightning-fast calculations and immediate feedback"
        />
      </Head>
      <div className="flex flex-col items-center justify-center min-h-screen bg-black p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold relative">
            <span className="absolute inset-0 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 blur-xl opacity-50"></span>
            <span className="relative">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)] filter contrast-150 brightness-110 animate-gradient">
                {prefix}
              </span>
              <AnimatePresence mode="wait">
                <motion.span
                  key={displayedText}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.1 }}
                  className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 
                             drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)] 
                             filter contrast-150 brightness-110
                             animate-gradient"
                >
                  {displayedText}
                </motion.span>
              </AnimatePresence>
            </span>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                repeat: Infinity,
                duration: 0.5,
                repeatType: "reverse",
              }}
              className="inline-block w-1 h-8 sm:h-12 md:h-14 bg-white ml-1 align-middle"
            />
          </h1>
        </motion.div>
        <motion.button
          onClick={() => scrollToRef(aboutRef)}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full p-2 transition-all duration-500 ease-in-out"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <ChevronDown className="w-6 h-6" />
        </motion.button>
      </div>
      <div ref={aboutRef} id="about" className="min-h-screen bg-gray-900 p-8 flex items-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-4 text-center">About Instant Calc 🧮</h2>
          <p className="text-gray-300 mb-4">
            Instant Calc is a real-time calculation notebook. Type expenses, set variables,
            write expressions — and see results instantly on the right. Every line is evaluated
            as you type, with support for comments, headings, and deduction tracking.
          </p>
          <motion.div
            initial="hidden"
            animate="visible"
            whileHover="hover"
            variants={buttonVariants}
          >
            <button
              onClick={() => scrollToRef(featuresRef)}
              className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out flex items-center mx-auto"
            >
              Explore Features <LucideChevronsDown className="ml-2 w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </div>
      <div
        ref={featuresRef}
        id="features"
        className="min-h-screen bg-gray-800 p-8 flex items-center"
      >
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-4">Key Features ✨</h2>
          <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
            <li>
              🎨 Syntax Highlighting: Headings, comments, expenses, and variables are colour-coded as you type.
            </li>
            <li>
              ⚡ Real-Time Evaluation: Results appear instantly in the output panel — no buttons needed.
            </li>
            <li>
              🔤 Variable Assignment: Use <code className="text-purple-400">name = expression</code> or <code className="text-purple-400">name: expression</code> to store values.
            </li>
            <li>
              💬 Comments &amp; Headings: Organise with <code className="text-purple-400">//</code> comments and <code className="text-purple-400">#</code> headings.
            </li>
            <li>
              📅 Deduction Tracking: Set a deduction day per expense; past-due lines auto-comment.
            </li>
            <li>
              🔄 Cloud Sync: Log in to save your notebook to Firebase and pick up where you left off.
            </li>
            <li>
              🌙 Dark Mode: Toggle between light and dark themes.
            </li>
          </ul>
          <motion.div
            initial="hidden"
            animate="visible"
            whileHover="hover"
            variants={buttonVariants}
          >
            <button
              onClick={() => scrollToRef(usageRef)}
              className="mt-8 bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out flex items-center mx-auto"
            >
              How to Use <LucideChevronsDown className="ml-2 w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </div>
      <div ref={usageRef} id="usage" className="min-h-screen bg-gray-900 p-8 flex items-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl text-center font-bold text-white mb-4">Usage Guide 📘</h2>
          <ol className="list-decimal list-inside text-gray-300 space-y-2 mb-4">
            <li>Type your calculations in the rich-text editor (left panel).</li>
            <li>Each line is evaluated automatically — output appears on the right.</li>
            <li>Use <code className="text-purple-400">name = value</code> or <code className="text-purple-400">name: value</code> to store a variable.</li>
            <li>Use <code className="text-purple-400">//</code> to comment out a line, <code className="text-purple-400">#</code> for headings.</li>
            <li>Reserved keywords: <code className="text-purple-400">prev</code> (last result), <code className="text-purple-400">sum</code> (running total), <code className="text-purple-400">monthlyPayDate</code> (pay-day countdown).</li>
            <li>Click the calendar icon next to an expense to set its deduction day — it auto-comments when past due.</li>
            <li>Toggle <strong>Due Next</strong> to uncomment all deduction lines for next-month planning.</li>
            <li>Sign in to save your notebook automatically to the cloud.</li>
          </ol>
          <p className="text-gray-300 mb-4">
            Instant Calc is designed to be intuitive and user-friendly. Start exploring its
            capabilities and streamline your calculation process today!
          </p>
          <motion.div
            initial="hidden"
            animate="visible"
            whileHover="hover"
            variants={buttonVariants}
          >
            <button
              onClick={() => scrollToRef(futureWorkRef)}
              className="mt-8 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out flex items-center mx-auto"
            >
              Future Developments <LucideChevronsDown className="ml-2 w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </div>
      <div
        id="future-work"
        ref={futureWorkRef}
        className="min-h-screen bg-gray-800 p-8 flex items-center"
      >
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-4">Future Work 🚀</h2>
          <p className="text-gray-300 mb-4">
            We&apos;re constantly working to improve Instant Calc. Here are some exciting features
            we&apos;re planning to implement:
          </p>
          <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
            <li>📊 Charts &amp; Visualisations for expense breakdowns.</li>
            <li>📑 Multiple Tabs for different notebooks.</li>
            <li>📤 Export to CSV / PDF.</li>
            <li>📱 Progressive Web App — install on your phone.</li>
            <li>🌐 Real-time multi-user collaboration.</li>
            <li>🧮 Currency conversion (<code className="text-purple-400">100 usd in gbp</code>).</li>
          </ul>
          <p className="text-gray-300 mb-4">
            Stay tuned for these exciting updates that will make Instant Calc even more powerful and
            user-friendly!
          </p>
          <motion.div
            initial="hidden"
            animate="visible"
            whileHover="hover"
            variants={buttonVariants}
          >
            <button
              onClick={() => router.push("/")}
              className="mt-8 bg-red-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out flex items-center mx-auto"
            >
              Lets Get Started <LucideChevronsRight className="ml-2 w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </div>
    </>
  );
}
