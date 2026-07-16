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
import { database } from "@/pages/_document";
import { User } from "firebase/auth";
import { get, ref, set } from "firebase/database";
import { motion } from "framer-motion";
import { Calendar, Edit2, Moon, Save, Sun, Trash2 } from "lucide-react";
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
  const variablesRef = useRef<{ [name: string]: number }>({});
  const [scrollTop, setScrollTop] = useState(0);
  const iconContainerRef = useRef<HTMLDivElement>(null);

  const [deductionDates, setDeductionDates] = useState<{
    [name: string]: number;
  }>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("deductionDates");
      return stored ? JSON.parse(stored) : {};
    }
    return {};
  });
  const [showDatePickerFor, setShowDatePickerFor] = useState<string | null>(
    null,
  );
  const [datePickerValue, setDatePickerValue] = useState<number>(1);

  useEffect(() => {
    if (calculations) {
      setInput(calculations.input);
      setOutput(calculations.output);
    }
  }, [calculations]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
    if (outputRef.current) {
      outputRef.current.style.height = "auto";
      outputRef.current.style.height = `${outputRef.current.scrollHeight}px`;
    }
  }, [input, output]);

  useEffect(() => {
    handleInput();
  }, [input]);

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isEditingName]);

  useEffect(() => {
    localStorage.setItem("deductionDates", JSON.stringify(deductionDates));
  }, [deductionDates]);

  useEffect(() => {
    if (user && database) {
      const dbRef = ref(database, `users/${user.uid}/deductionDates`);
      get(dbRef).then((snapshot) => {
        const data = snapshot.val();
        if (data) {
          setDeductionDates(data);
        }
      });
    }
  }, [user]);

  useEffect(() => {
    if (user && database && Object.keys(deductionDates).length > 0) {
      const dbRef = ref(database, `users/${user.uid}/deductionDates`);
      set(dbRef, deductionDates);
    }
  }, [deductionDates, user]);

  useEffect(() => {
    handleInput();
  }, [deductionDates]);

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

  const handleInput = useCallback(async () => {
    if (!input) {
      setOutput("");
      return;
    }
    const lines = input.split("\n");

    for (const line of lines) {
      const trimmedLine = line.trim();
      let result: number = 0;

      if (trimmedLine.startsWith("#") || trimmedLine.startsWith("//")) {
        customOutput = `-`;
        newOutput += `${customOutput}\n`;
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

        if (
          deductionDates[name] &&
          new Date().getDate() >= deductionDates[name]
        ) {
          newOutput += `//${name}=${result}\n`;
        } else {
          newOutput += `${result ? result : customOutput}\n`;
        }
      } else if (trimmedLine.includes("=")) {
        const [name, expression] = trimmedLine
          .split("=")
          .map((item) => item.trim().replace(/\,/g, "").toLowerCase());
        if (name === "monthlypaydate") {
          const monthlyPayDate = Number(expression);
          customOutput = getDaysLeft(monthlyPayDate);
          newOutput += `${customOutput}\n`;
        } else {
          const { evaluatedResult, hasCustomOutput } = evaluateExpression({
            expression,
            variables,
            keywordValues,
          });
          result = evaluatedResult;
          customOutput = hasCustomOutput;
          variables[name] = result;

          if (
            deductionDates[name] &&
            new Date().getDate() >= deductionDates[name]
          ) {
            newOutput += `//${name}=${result}\n`;
          } else {
            newOutput += `${result ? result : customOutput}\n`;
          }
        }
      } else {
        if (trimmedLine) {
          const output = evaluateExpression({
            expression: trimmedLine,
            variables,
            keywordValues,
          });
          result = output.evaluatedResult;
          customOutput = output.hasCustomOutput;
          newOutput += `${result ? result : customOutput}\n`;
        } else {
          newOutput += `\n`;
        }
      }

      keywordValues.tempSum += result;
      keywordValues.tempPrev = result;
      customOutput = "-";
    }

    setOutput(newOutput);
    setSum(keywordValues.tempSum);
    setPrev(keywordValues.tempPrev);
    variablesRef.current = { ...variables };

    const newInput = input
      .split("\n")
      .map((line) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("#") || trimmed.startsWith("//")) return line;
        if (trimmed.includes("=") || trimmed.includes(":")) {
          const separator = trimmed.includes("=") ? "=" : ":";
          const [name] = trimmed
            .split(separator)
            .map((s) => s.trim().toLowerCase());
          if (
            name &&
            name !== "monthlypaydate" &&
            deductionDates[name] &&
            new Date().getDate() >= deductionDates[name]
          ) {
            return `//${line}`;
          }
        }
        return line;
      })
      .join("\n");

    if (newInput !== input) {
      setInput(newInput);
    }
  }, [input, deductionDates]);

  const handleInputScroll = (event: React.UIEvent<HTMLTextAreaElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
    if (inputRef.current && outputRef.current) {
      outputRef.current.scrollTop = event.currentTarget.scrollTop;
    }
  };

  const handleOutputScroll = (event: React.UIEvent<HTMLTextAreaElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
    if (inputRef.current && outputRef.current) {
      inputRef.current.scrollTop = event.currentTarget.scrollTop;
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

  const inputLines = (input || "").split("\n");
  const variableLines: { name: string; lineIndex: number }[] = [];
  inputLines.forEach((line, index) => {
    const trimmed = line.trim();
    const content = trimmed.startsWith("//")
      ? trimmed.slice(2).trim()
      : trimmed;
    if (
      (content.includes("=") || content.includes(":")) &&
      !content.startsWith("#")
    ) {
      const separator = content.includes("=") ? "=" : ":";
      const [name] = content
        .split(separator)
        .map((s) => s.trim().toLowerCase());
      if (name && name !== "monthlypaydate") {
        variableLines.push({ name, lineIndex: index });
      }
    }
  });

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
              onScroll={handleInputScroll}
              placeholder="Type your calculations here..."
              className="w-full p-4 bg-transparent text-gray-800 dark:text-white rounded-none focus:outline-none resize-none overflow-hidden font-mono text-xs md:text-xl leading-relaxed"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(transparent, transparent 47px, #999 47px, #999 48px, transparent 48px)",
                lineHeight: "48px",
                padding: "8px 10px",
                border: "none",
                minHeight: "calc(100vh - 400px)",
              }}
            />
            <div className="absolute top-0 bottom-0 left-0 w-0.5 bg-red-400"></div>
          </div>

          <div className="w-6 relative flex-shrink-0" ref={iconContainerRef}>
            {variableLines.map(({ name, lineIndex }) => {
              const iconTop = 8 + lineIndex * 48 - scrollTop;
              const containerHeight =
                iconContainerRef.current?.clientHeight || 0;
              const inView = iconTop + 48 > 0 && iconTop < containerHeight;
              return (
                <div
                  key={name}
                  className="absolute left-0 right-0 flex items-center justify-center group cursor-pointer"
                  style={{
                    top: `${iconTop}px`,
                    height: "48px",
                    opacity: inView ? 1 : 0,
                    pointerEvents: inView ? "auto" : "none",
                  }}
                  onClick={() => {
                    setDatePickerValue(deductionDates[name] || 1);
                    setShowDatePickerFor(name);
                  }}
                >
                  <Calendar
                    className={`w-3.5 h-3.5 transition-opacity cursor-pointer ${deductionDates[name] ? "text-green-500 opacity-100" : "text-gray-400 opacity-0 group-hover:opacity-100 hover:text-green-500"}`}
                  />
                </div>
              );
            })}
          </div>

          <div className="flex-1 flex-grow relative">
            <textarea
              ref={outputRef}
              readOnly
              value={output || ""}
              onScroll={handleOutputScroll}
              placeholder="Output will appear here..."
              className="w-full p-4 bg-transparent text-gray-800 dark:text-green-500 rounded-none resize-none overflow-hidden font-mono text-xs md:text-xl leading-relaxed"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(transparent, transparent 47px, #999 47px, #999 48px, transparent 48px)",
                lineHeight: "48px",
                padding: "8px 10px",
                border: "none",
                minHeight: "calc(100vh - 400px)",
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

      {showDatePickerFor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          onClick={() => setShowDatePickerFor(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 border border-gray-200 dark:border-gray-700 w-64"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-sm font-medium mb-3 text-gray-800 dark:text-white">
              Deduction day for{" "}
              <span className="font-bold">{showDatePickerFor}</span>
            </div>
            <input
              type="number"
              min={1}
              max={31}
              value={datePickerValue}
              onChange={(e) =>
                setDatePickerValue(
                  Math.min(31, Math.max(1, Number(e.target.value) || 1)),
                )
              }
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-transparent text-gray-800 dark:text-white text-center text-lg"
            />
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
              Day of month (1-31)
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => {
                  setDeductionDates((prev) => ({
                    ...prev,
                    [showDatePickerFor]: datePickerValue,
                  }));
                  setShowDatePickerFor(null);
                }}
                className="flex-1 px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setDeductionDates((prev) => {
                    const next = { ...prev };
                    delete next[showDatePickerFor];
                    return next;
                  });
                  setShowDatePickerFor(null);
                }}
                className="px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 text-sm transition-colors"
              >
                Remove
              </button>
              <button
                onClick={() => setShowDatePickerFor(null)}
                className="px-3 py-1.5 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded hover:bg-gray-400 dark:hover:bg-gray-500 text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
