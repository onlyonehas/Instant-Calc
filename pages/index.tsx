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
import dynamic from "next/dynamic";
import "tailwindcss/tailwind.css";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
import "react-quill/dist/quill.snow.css";
import { evaluateExpression } from "../helpers/calculate";
import { getAutoCommentedLines, computeSummary, parseVariableLine } from "../helpers/calculations";

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
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const quillEditorRef = useRef<any>(null);
  const quillScrollRef = useRef<HTMLElement | null>(null);
  const variablesRef = useRef<{ [name: string]: number }>({});
  const originalValuesRef = useRef<{ [name: string]: number }>({});
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
  const [showDatePickerFor, setShowDatePickerFor] = useState<string | null>(null);
  const [datePickerValue, setDatePickerValue] = useState<string>("1");
  const [showNextMonth, setShowNextMonth] = useState(false);

  useEffect(() => {
    if (calculations) {
      setInput(calculations.input);
      setOutput(calculations.output);
    }
  }, [calculations]);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.style.height = "auto";
      outputRef.current.style.height = `${outputRef.current.scrollHeight}px`;
    }
  }, [output]);

  useEffect(() => {
    handleInput();
  }, [input]);

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isEditingName]);

  const highlightSyntax = useCallback((editor: any) => {
    if (!editor) return;
    const text = editor.getText() || "";
    const lines = text.split("\n");
    let offset = 0;
    for (const line of lines) {
      const trimmed = line.trim();
      const length = line.length;
      if (trimmed.startsWith("#")) {
        editor.formatText(offset, length, { color: "#16a34a", bold: true });
      } else if (trimmed.startsWith("//")) {
        editor.formatText(offset, length, { color: "#9ca3af", italic: true });
      } else if (/^monthlypaydate\b/i.test(trimmed)) {
        const eqIdx = trimmed.indexOf("=");
        const keywordLen = eqIdx >= 0 ? eqIdx : trimmed.length;
        editor.formatText(offset, keywordLen, { color: "#3b82f6" });
      } else {
        const colonIdx = trimmed.indexOf(":");
        const eqIdx = trimmed.indexOf("=");
        const sepIdx = eqIdx >= 0 && (colonIdx < 0 || eqIdx < colonIdx) ? eqIdx : colonIdx;
        if (sepIdx > 0) {
          const nameLen = trimmed.slice(0, sepIdx).length;
          const color = trimmed[sepIdx] === ":" ? "#d97706" : "#06b6d4";
          editor.formatText(offset, nameLen, { color, bold: false });
        }
      }
      offset += length + 1;
    }
  }, []);

  const handleInputScroll = useCallback(() => {
    const container = quillScrollRef.current;
    if (!container) return;
    setScrollTop(container.scrollTop);
    if (outputRef.current) {
      outputRef.current.scrollTop = container.scrollTop;
    }
  }, []);

  const attachQuillScroll = useCallback(() => {
    quillScrollRef.current?.removeEventListener("scroll", handleInputScroll);
    const container = inputContainerRef.current?.querySelector<HTMLElement>(".ql-container");
    if (container) {
      quillScrollRef.current = container;
      container.addEventListener("scroll", handleInputScroll);
    }
  }, [handleInputScroll]);

  const getQuillEditor = useCallback(() => {
    if (quillEditorRef.current) return quillEditorRef.current;
    const root = inputContainerRef.current;
    if (!root) return null;
    const editorEl = root.querySelector<HTMLElement>(".ql-editor");
    const container = editorEl?.closest(".ql-container") as any;
    if (container?.__quill) {
      quillEditorRef.current = container.__quill;
    }
    return quillEditorRef.current;
  }, []);

  const handleQuillChange = useCallback(
    (_value: string, _delta: any, source: string, _editor: any) => {
      if (source !== "user") return;
      const editor = getQuillEditor();
      if (!editor) return;
      attachQuillScroll();
      const text = (editor.getText() || "").replace(/\n$/, "");
      if (text !== input) {
        setInput(text);
      }
      requestAnimationFrame(() => highlightSyntax(editor));
    },
    [input, highlightSyntax, attachQuillScroll, getQuillEditor],
  );

  useEffect(() => {
    const editor = getQuillEditor();
    if (!editor) return;
    const currentText = (editor.getText() || "").replace(/\n$/, "");
    if (currentText !== input) {
      editor.setText(input || "");
    }
    requestAnimationFrame(() => highlightSyntax(editor));
  }, [input, highlightSyntax, getQuillEditor]);

  useEffect(() => {
    attachQuillScroll();
    const container = quillScrollRef.current;
    return () => {
      container?.removeEventListener("scroll", handleInputScroll);
    };
  }, [attachQuillScroll, handleInputScroll]);

  const quillModules = { toolbar: false };
  const quillFormats = ["bold", "italic", "color"];

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

  useEffect(() => {
    handleInput();
  }, [showNextMonth]);

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
        const [name, expression] = trimmedLine.split(":").map((item) => item.trim().toLowerCase());
        const { evaluatedResult, hasCustomOutput } = evaluateExpression({
          expression,
          variables,
          keywordValues,
        });
        result = evaluatedResult;
        customOutput = hasCustomOutput;
        variables[name] = result;

        if (
          !showNextMonth &&
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
            !showNextMonth &&
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
    for (const name in variables) {
      originalValuesRef.current[name] = variables[name];
    }

    const processedLines = getAutoCommentedLines(
      input.split("\n"),
      deductionDates,
      showNextMonth,
      new Date().getDate(),
    );
    const newInput = processedLines.join("\n");

    if (newInput !== input) {
      setInput(newInput);
    }
  }, [input, deductionDates, showNextMonth]);

  const handleOutputScroll = (event: React.UIEvent<HTMLTextAreaElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
    const container = quillScrollRef.current;
    if (container) {
      container.scrollTop = event.currentTarget.scrollTop;
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

  const handleNotebookNameKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      setIsEditingName(false);
    }
  };

  const inputLines = (input || "").split("\n");
  const variableLines: {
    name: string;
    lineIndex: number;
    separator: string;
  }[] = [];
  inputLines.forEach((line, index) => {
    const info = parseVariableLine(line);
    if (info) {
      variableLines.push({
        name: info.name,
        lineIndex: index,
        separator: info.separator,
      });
    }
  });

  return (
    <div className={`flex flex-col min-h-screen ${darkMode ? "dark" : "light"}`}>
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

        <div className="max-w-7xl mx-auto">
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
            <div className="flex flex-wrap gap-1.5 md:gap-2 items-center">
              <button
                onClick={toggleDarkMode}
                className="p-1.5 md:p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
              >
                {darkMode ? (
                  <Sun className="w-4 h-4 md:w-5 md:h-5" />
                ) : (
                  <Moon className="w-4 h-4 md:w-5 md:h-5" />
                )}
              </button>
              {user && (
                <button
                  onClick={saveToDatabase}
                  className="px-2.5 py-1.5 md:px-4 md:py-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 flex items-center text-xs md:text-sm"
                >
                  <Save className="w-3.5 h-3.5 md:w-5 md:h-5 md:mr-2" />
                  <span className="hidden md:inline">Save</span>
                </button>
              )}
              {user && (
                <button
                  onClick={clearButton}
                  className="px-2.5 py-1.5 md:px-4 md:md:py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 flex items-center text-xs md:text-sm"
                >
                  <Trash2 className="w-3.5 h-3.5 md:w-5 md:h-5 md:mr-2" />
                  <span className="hidden md:inline">Clear</span>
                </button>
              )}
            </div>
          </motion.div>

          {(() => {
            const vars = variablesRef.current;
            const orig = originalValuesRef.current;
            const { remainingTotal, dueNextTotal } = computeSummary(
              inputLines,
              deductionDates,
              vars,
              orig,
              new Date().getDate(),
            );
            const showRemaining = !showNextMonth;
            return (
              <motion.div
                className="bg-yellow-100 dark:bg-gray-800 shadow-lg pl-4 pr-4 py-2.5 flex items-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.4 }}
              >
                <div className="text-xs md:text-sm font-mono text-gray-700 dark:text-gray-200 whitespace-nowrap">
                  {showRemaining ? (
                    <span>
                      Remaining:{" "}
                      <span className="font-bold text-green-600 dark:text-green-400">
                        {remainingTotal.toFixed(2)}
                      </span>
                    </span>
                  ) : (
                    <span>
                      Due next:{" "}
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        {dueNextTotal.toFixed(2)}
                      </span>
                    </span>
                  )}
                </div>
                <div
                  className="flex rounded-full bg-gray-300 dark:bg-gray-600 p-0.5 cursor-pointer select-none flex-shrink-0"
                  onClick={() => setShowNextMonth((v) => !v)}
                >
                  <div
                    className={`px-3 py-1 text-xs rounded-full transition-all ${
                      showRemaining
                        ? "bg-white dark:bg-gray-800 shadow text-gray-800 dark:text-white font-medium"
                        : "text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    Remaining
                  </div>
                  <div
                    className={`px-3 py-1 text-xs rounded-full transition-all ${
                      !showRemaining
                        ? "bg-white dark:bg-gray-800 shadow text-gray-800 dark:text-white font-medium"
                        : "text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    Due Next
                  </div>
                </div>
              </motion.div>
            );
          })()}

          <motion.div
            className="flex-grow flex gap-0 bg-yellow-100 dark:bg-gray-800 rounded-b-lg shadow-lg p-4"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div className="flex-1 min-w-0 relative" ref={inputContainerRef}>
              <ReactQuill
                defaultValue=""
                onChange={handleQuillChange}
                modules={quillModules}
                formats={quillFormats}
                placeholder="Type your calculations here..."
                className="quill-editor w-full font-mono text-xs md:text-2xl lg:text-3xl"
                theme="snow"
              />
              <div className="absolute top-0 bottom-0 left-0 w-0.5 bg-red-400"></div>
            </div>

            <div
              className="w-4 mr-2 relative flex-shrink-0 overflow-visible"
              ref={iconContainerRef}
            >
              {variableLines.map(({ name, lineIndex }) => {
                const iconTop = 8 + lineIndex * 48 - scrollTop;
                const containerHeight = iconContainerRef.current?.clientHeight || 0;
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
                      setDatePickerValue(String(deductionDates[name] || 1));
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

            <div className="flex-1 relative">
              <textarea
                ref={outputRef}
                readOnly
                value={output || ""}
                onScroll={handleOutputScroll}
                placeholder="Output will appear here..."
                className="w-full bg-transparent text-gray-800 dark:text-green-500 rounded-none resize-none overflow-hidden font-mono text-xs md:text-2xl lg:text-3xl leading-relaxed whitespace-nowrap"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(transparent, transparent 47px, #999 47px, #999 48px, var(--row-alt) 48px, var(--row-alt) 95px, #999 95px, #999 96px)",
                  lineHeight: "48px",
                  padding: "8px 16px",
                  border: "none",
                  minHeight: "calc(100vh - 400px)",
                  minWidth: "60px",
                }}
              />
              <div className="absolute top-0 bottom-0 left-0 w-0.5"></div>
            </div>
          </motion.div>
        </div>
      </main>

      {singOutModal && <PopUpModal toggleModal={toggleSingOutModal} type="signout" />}
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
              Deduction day for <span className="font-bold">{showDatePickerFor}</span>
            </div>
            <input
              type="number"
              min={1}
              max={31}
              value={datePickerValue}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "" || /^\d+$/.test(val)) {
                  setDatePickerValue(val);
                }
              }}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-transparent text-gray-800 dark:text-white text-center text-lg"
            />
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
              Day of month (1-31)
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => {
                  const day = Math.min(31, Math.max(1, Number(datePickerValue) || 1));
                  setDeductionDates((prev) => ({
                    ...prev,
                    [showDatePickerFor]: day,
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
