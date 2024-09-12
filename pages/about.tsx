"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Head from "next/head";
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
  const displayedText = useTypewriter(
    words[wordIndex],
    100,
    isDeleting,
    index,
    setIndex,
  );

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
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full p-2 transition-all duration-300 ease-in-out"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          <ChevronDown className="w-6 h-6" />
        </motion.button>
      </div>
      <div
        ref={aboutRef}
        className="min-h-screen bg-gray-900 p-8 flex items-center"
      >
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-4">
            About Instant Calc 🧮
          </h2>
          <p className="text-gray-300 mb-4">
            Instant Calc is a cutting-edge calculation tool designed to
            revolutionize the way you work with numbers. Our platform combines
            lightning-fast processing with intuitive design, making complex
            computations a breeze for users of all levels.
          </p>
          <p className="text-gray-300 mb-4">
            Whether you&apos;re a student tackling advanced mathematics, a
            professional dealing with intricate financial models, or simply
            someone who loves efficient problem-solving, Instant Calc is your
            ultimate companion for all calculation needs.
          </p>
          <button
            onClick={() => scrollToRef(featuresRef)}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out flex items-center"
          >
            Explore Features <ChevronDown className="ml-2 w-4 h-4" />
          </button>
        </div>
      </div>
      <div
        ref={featuresRef}
        className="min-h-screen bg-gray-800 p-8 flex items-center"
      >
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-4">
            Key Features ✨
          </h2>
          <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
            <li>
              🗣️ Natural Language Syntax: Perform calculations using familiar
              phrases and expressions.
            </li>
            <li>
              ⚡ Real-Time Evaluation: Instantly see the results of your
              calculations as you type.
            </li>
            <li>
              🔤 Variable Assignment: Define and use variables to store values
              for repeated use.
            </li>
            <li>
              🧠 Expression Parsing: Evaluate complex expressions with
              operators, functions, and parentheses.
            </li>
            <li>
              💬 Commenting: Add comments to your calculations for better
              organization and understanding.
            </li>
            <li>
              📱 Responsive Design: Enjoy a seamless experience across different
              devices and screen sizes.
            </li>
          </ul>
          <button
            onClick={() => scrollToRef(usageRef)}
            className="mt-4 bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out flex items-center"
          >
            How to Use <ChevronDown className="ml-2 w-4 h-4" />
          </button>
        </div>
      </div>
      <div
        ref={usageRef}
        className="min-h-screen bg-gray-900 p-8 flex items-center"
      >
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-4">Usage Guide 📘</h2>
          <ol className="list-decimal list-inside text-gray-300 space-y-2 mb-4">
            <li>Type your calculations in the input textarea.</li>
            <li>
              Press Enter or click outside the textarea to evaluate the
              expression.
            </li>
            <li>The output will be displayed in the output textarea.</li>
            <li>Store operations in a variable by starting with name=</li>
            <li>
              Add comments using the // prefix to document your calculations.
            </li>
            <li>Add headings using the # prefix for ease of labelling.</li>
            <li>
              Make use of reserved keywords [&quot;prev&quot;, &quot;sum&quot;,
              &quot;to&quot;, &quot;monthlyPayDate&quot;, &quot;in&quot;]
            </li>
          </ol>
          <p className="text-gray-300 mb-4">
            Instant Calc is designed to be intuitive and user-friendly. Start
            exploring its capabilities and streamline your calculation process
            today!
          </p>
          <button
            onClick={() => scrollToRef(futureWorkRef)}
            className="mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out flex items-center"
          >
            Future Developments <ChevronDown className="ml-2 w-4 h-4" />
          </button>
        </div>
      </div>
      <div
        ref={futureWorkRef}
        className="min-h-screen bg-gray-800 p-8 flex items-center"
      >
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-4">Future Work 🚀</h2>
          <p className="text-gray-300 mb-4">
            We&apos;re constantly working to improve Instant Calc. Here are some
            exciting features we&apos;re planning to implement:
          </p>
          <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
            <li>
              📊 Data Visualization: Show charts and graphs for your
              calculations.
            </li>
            <li>
              📑 Multiple Tabs: Add and save more tabs for different calculation
              sessions.
            </li>
            <li>
              📤 Export Functionality: Export your calculations and results in
              various formats.
            </li>
            <li>
              📅 Pay Date Setting: Set a date for pay dates and track expenses
              that are due.
            </li>
            <li>
              💾 Auto-Save: Automatically save your work to prevent data loss.
            </li>
            <li>
              🔄 Sync Across Devices: Access your calculations from any device.
            </li>
          </ul>
          <p className="text-gray-300 mb-4">
            Stay tuned for these exciting updates that will make Instant Calc
            even more powerful and user-friendly!
          </p>
        </div>
      </div>
    </>
  );
}
