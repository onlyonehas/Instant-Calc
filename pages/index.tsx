"use client";

import { Header } from "@/components/Header";
import { Loader } from "@/components/Loader";
import { PopUpModal } from "@/components/PopUpModal";
import { useDarkMode } from "@/contexts/DarkModeContext";
import { getDaysLeft } from "@/helpers/paydate";
import { VariableMap } from "@/helpers/sharedTypes";
import { useCalculations } from "@/hooks/useCalculations";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import "@/styles/Dark.css";
import { User } from "firebase/auth";
import { motion } from "framer-motion";
import { Edit2, Moon, Save, Sun, Trash2 } from "lucide-react";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import "react-quill/dist/quill.snow.css";
import "tailwindcss/tailwind.css";
import { evaluateExpression } from "../helpers/calculate";

const initialInput = `# Example Heading
//comment: 300
monthlyPayDate=15
gas: 300
food: 250 
100/4
Variable = prev*2
Total=sum-variable`;

export default function Index() {
  const user: User | null = useCustomAuth();
  const { calculations, saveCalculations, isLoading } = useCalculations();
  const [input, setInput] = useState<string>(initialInput);
  const [output, setOutput] = useState<string | null>();
  const [, setSum] = useState(0);
  const [, setPrev] = useState(0);

  const { darkMode, toggleDarkMode } = useDarkMode();
  const [singOutModal, toggleSingOutModal] = useState(false);
  const [clearButtonModal, toggleClearButtonModal] = useState(false);

  const [notebookName, setNotebookName] = useState("General Expense");
  const [isEditingName, setIsEditingName] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const outputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (calculations) {
      setInput(calculations.input);
      setOutput(calculations.output);
    }
  }, [calculations]);

  useEffect(() => {
    handleInput();
  }, [input]);

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isEditingName]);

  const variables: VariableMap = {};
  let newOutput = "";
  let customOutput = "";

  const keywordValues = {
    tempSum: 0,
    tempPrev: 0,
  };

  const saveToDatabase = () => {
    if (user && input && output) {
      if (input !== initialInput && output !== null) {
        saveCalculations(input, output);
      }
    }
  };

  const clearButtonCallback = () => {
    setInput("");
    setOutput("");
  };

  const clearButton = () => {
    toggleClearButtonModal(true);
  };

  // TODO: seperate functionality
  const handleInput = useCallback(async () => {
    const lines = input?.split("\n");

    for (const line of lines) {
      const trimmedLine = line.trim();
      let result: number = 0;

      if (trimmedLine.startsWith("#") || trimmedLine.startsWith("//")) {
        customOutput = `-`;
      } else if (trimmedLine.includes(":")) {
        const [name, expression] = trimmedLine
          .split(":")
          .map((item) => item.trim().toLowerCase());
        const { evaluatedResult, hasCustomOutput } = evaluateExpression({
          expression,
          variables,
          keywordValues,
        });
        result = evaluatedResult;
        customOutput = hasCustomOutput;
        variables[name] = result;
      } else if (trimmedLine.includes("=")) {
        const [name, expression] = trimmedLine
          .split("=")
          .map((item) => item.trim().replace(/\,/g, "").toLowerCase());
        if (name === "monthlypaydate") {
          const monthlyPayDate = Number(expression);
          customOutput = getDaysLeft(monthlyPayDate);
        } else {
          const { evaluatedResult, hasCustomOutput } = evaluateExpression({
            expression,
            variables,
            keywordValues,
          });
          result = evaluatedResult;
          customOutput = hasCustomOutput;
        }
        variables[name] = result;
      } else {
        if (trimmedLine) {
          const output = evaluateExpression({
            expression: trimmedLine,
            variables,
            keywordValues,
          });
          result = output.evaluatedResult;
          customOutput = output.hasCustomOutput;
        }
      }

      newOutput += `${result ? result : customOutput}\n`;
      keywordValues.tempSum += result;
      keywordValues.tempPrev = result;
      customOutput = "-";
    }

    setOutput(newOutput);
    setSum(keywordValues.tempSum);
    setPrev(keywordValues.tempPrev);
  }, [input]);

  const handleScroll = (event: React.UIEvent<HTMLTextAreaElement>) => {
    if (inputRef.current && outputRef.current) {
      outputRef.current.scrollTop = event.currentTarget.scrollTop;
    }
  };

  const handleNotebookNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setNotebookName(event.target.value);
  };

  const handleNotebookNameDoubleClick = () => {
    setIsEditingName(true);
  };

  const handleNotebookNameBlur = () => {
    setIsEditingName(false);
  };

  const handleNotebookNameKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Enter") {
      setIsEditingName(false);
    }
  };

  return (
    <div
      className={`flex flex-col min-h-screen ${darkMode ? "dark" : "light"}`}
    >
      <Header toggleModal={toggleSingOutModal} />
      <main className="flex-grow container mx-auto px-4 py-8">
        <motion.h1
          className="text-5xl md:text-7xl font-bold text-center my-7 text-gray-800 dark:text-white"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">
            Instant<i>Calc</i>
          </span>
        </motion.h1>

        {isLoading && <Loader />}

        <motion.div
          className="bg-yellow-100 dark:bg-gray-800 rounded-t-lg shadow-lg p-4 flex justify-between items-center"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {isEditingName ? (
            <input
              ref={nameInputRef}
              type="text"
              value={notebookName}
              onChange={handleNotebookNameChange}
              onBlur={handleNotebookNameBlur}
              onKeyDown={handleNotebookNameKeyDown}
              className="text-xl font-semibold bg-transparent text-gray-800 dark:text-white focus:outline-none border-b-2 border-gray-300 dark:border-gray-600"
            />
          ) : (
            <h2
              className="text-xl font-semibold text-gray-800 dark:text-white cursor-pointer flex items-center"
              onDoubleClick={handleNotebookNameDoubleClick}
            >
              {notebookName}
              <Edit2 className="w-4 h-4 ml-2 text-gray-500 dark:text-gray-400" />
            </h2>
          )}
          <div className="flex space-x-2">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
            >
              {darkMode ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
            {user && (
              <button
                onClick={saveToDatabase}
                className="px-4 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 flex items-center"
              >
                <Save className="w-5 h-5 mr-2" />
                Save
              </button>
            )}
            {user && (
              <button
                onClick={clearButton}
                className="px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 flex items-center"
              >
                <Trash2 className="w-5 h-5 mr-2" />
                Clear
              </button>
            )}
          </div>
        </motion.div>

        <motion.div
          className="flex-grow flex gap-1 bg-yellow-100 dark:bg-gray-800 rounded-b-lg shadow-lg p-4"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex-1 flex-grow relative">
            <textarea
              ref={inputRef}
              value={input || ""}
              onChange={(e) => setInput(e.target.value)}
              onScroll={handleScroll}
              placeholder="Type your calculations here..."
              className="w-full min-h-[calc(100vh-400px)] p-4 bg-transparent text-gray-800 dark:text-white rounded-none focus:outline-none resize-none font-mono text-xs md:text-xl leading-relaxed"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(transparent, transparent 47px, #999 47px, #999 48px, transparent 48px)",
                lineHeight: "48px",
                padding: "8px 10px",
                border: "none",
              }}
            />
            <div className="absolute top-0 bottom-0 left-0 w-0.5 bg-red-400"></div>
          </div>

          <div className="flex-1 flex-grow relative">
            <textarea
              ref={outputRef}
              readOnly
              value={output || ""}
              placeholder="Output will appear here..."
              className="w-full min-h-[calc(100vh-400px)] p-4 bg-transparent text-gray-800 dark:text-green-500 rounded-none resize-none font-mono text-xs md:text-xl leading-relaxed"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(transparent, transparent 47px, #999 47px, #999 48px, transparent 48px)",
                lineHeight: "48px",
                padding: "8px 10px",
                border: "none",
              }}
            />
            <div className="absolute top-0 bottom-0 left-0 w-0.5"></div>
          </div>
        </motion.div>
      </main>

      {singOutModal && (
        <PopUpModal toggleModal={toggleSingOutModal} type="signout" />
      )}
      {clearButtonModal && (
        <PopUpModal
          toggleModal={toggleClearButtonModal}
          type="clearButton"
          callbackfn={clearButtonCallback}
        />
      )}
    </div>
  );
}
