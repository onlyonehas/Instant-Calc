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
import { app, database } from "@/pages/_document";
import { GoogleAuthProvider, User, getAuth, signInWithPopup } from "firebase/auth";
import { get, ref, set } from "firebase/database";
import { motion } from "framer-motion";
import { Calendar, CloudOff, Edit2, Moon, Plus, Save, Sun, Trash2, X } from "lucide-react";
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

type Notebook = {
  id: string;
  name: string;
  input: string;
  output: string | null;
  color?: string;
};

const NOTEBOOK_COLORS = [
  "#3b82f6",
  "#ef4444",
  "#22c55e",
  "#f59e0b",
  "#a855f7",
  "#ec4899",
  "#14b8a6",
  "#f97316",
];

let nextId = 1;

export default function Index() {
  const user: User | null = useCustomAuth();
  const { notebooksData, saveNotebooks, isLoading } = useCalculations();
  const [notebooks, setNotebooks] = useState<Notebook[]>([
    {
      id: String(nextId++),
      name: "General Expense",
      input: initialInput,
      output: null,
      color: NOTEBOOK_COLORS[0],
    },
  ]);
  const [activeNotebookId, setActiveNotebookId] = useState("1");
  const [, setSum] = useState(0);
  const [, setPrev] = useState(0);

  const { darkMode, toggleDarkMode } = useDarkMode();
  const [singOutModal, toggleSingOutModal] = useState(false);
  const [clearButtonModal, toggleClearButtonModal] = useState(false);

  const activeNotebook = notebooks.find((n) => n.id === activeNotebookId)!;

  const [isEditingName, setIsEditingName] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [colorPickerFor, setColorPickerFor] = useState<string | null>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const outputRef = useRef<HTMLTextAreaElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const quillEditorRef = useRef<any>(null);
  const quillScrollRef = useRef<HTMLElement | null>(null);
  const variablesRef = useRef<{ [name: string]: number }>({});
  const originalValuesRef = useRef<{ [name: string]: number }>({});
  const [scrollTop, setScrollTop] = useState(0);
  const iconContainerRef = useRef<HTMLDivElement>(null);

  const importFileRef = useRef<HTMLInputElement>(null);

  const [deductionDates, setDeductionDates] = useState<{
    [name: string]: number;
  }>({});

  useEffect(() => {
    const stored = localStorage.getItem("deductionDates");
    if (stored) {
      try {
        setDeductionDates(JSON.parse(stored));
      } catch {}
    }
  }, []);
  const [showDatePickerFor, setShowDatePickerFor] = useState<string | null>(null);
  const [datePickerValue, setDatePickerValue] = useState<string>("1");
  const [showNextMonth, setShowNextMonth] = useState(false);

  const setActiveInput = (val: string) =>
    setNotebooks((prev) => prev.map((n) => (n.id === activeNotebookId ? { ...n, input: val } : n)));
  const setActiveOutput = (val: string | null) =>
    setNotebooks((prev) =>
      prev.map((n) => (n.id === activeNotebookId ? { ...n, output: val } : n)),
    );
  const setActiveName = (val: string) =>
    setNotebooks((prev) => prev.map((n) => (n.id === activeNotebookId ? { ...n, name: val } : n)));
  const setNotebookColor = (id: string, color: string) =>
    setNotebooks((prev) => prev.map((n) => (n.id === id ? { ...n, color } : n)));

  const input = activeNotebook?.input ?? "";
  const output = activeNotebook?.output ?? null;
  const notebookName = activeNotebook?.name ?? "";

  useEffect(() => {
    if (notebooksData && notebooksData.notebooks.length) {
      setNotebooks(notebooksData.notebooks);
      setActiveNotebookId(notebooksData.activeNotebookId);
      quillEditorRef.current = null;
    }
  }, [notebooksData]);

  useEffect(() => {
    if (!user) {
      setNotebooks([
        {
          id: String(nextId++),
          name: "General Expense",
          input: initialInput,
          output: null,
          color: NOTEBOOK_COLORS[0],
        },
      ]);
      setActiveNotebookId("1");
      setDeductionDates({});
      localStorage.removeItem("deductionDates");
    }
  }, [user]);

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
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setColorPickerFor(null);
      }
    };
    if (colorPickerFor) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [colorPickerFor]);

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
      if (_editor && !quillEditorRef.current) {
        quillEditorRef.current = _editor;
      }
      if (source !== "user") return;
      const editor = _editor || getQuillEditor();
      if (!editor) return;
      attachQuillScroll();
      const text = (editor.getText() || "").replace(/\n$/, "");
      if (text !== input) {
        setActiveInput(text);
      }
      requestAnimationFrame(() => highlightSyntax(editor));
    },
    [input, highlightSyntax, attachQuillScroll, getQuillEditor],
  );

  useEffect(() => {
    let rafId: number;
    const trySync = () => {
      const editor = getQuillEditor();
      if (!editor) {
        rafId = requestAnimationFrame(trySync);
        return;
      }
      const currentText = (editor.getText() || "").replace(/\n$/, "");
      if (currentText !== input) {
        editor.setText(input || "");
      }
      requestAnimationFrame(() => highlightSyntax(editor));
      attachQuillScroll();
    };
    trySync();
    return () => cancelAnimationFrame(rafId);
  }, [input, highlightSyntax, getQuillEditor, attachQuillScroll]);

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

  const signInWithGoogle = async () => {
    try {
      const auth = getAuth(app);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error(error);
    }
  };

  const saveToDatabase = () => {
    if (user) {
      saveNotebooks(notebooks, activeNotebookId);
    }
  };

  const exportNotebooks = () => {
    const data = { notebooks, activeNotebookId, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "instant-calc-notebooks.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importNotebooks = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target?.result as string);
        if (!data.notebooks || !Array.isArray(data.notebooks) || !data.notebooks.length) {
          alert("Invalid file: no notebooks found.");
          return;
        }
        for (const nb of data.notebooks) {
          if (!nb.id || !nb.name || nb.input === undefined) {
            alert("Invalid file: notebook missing required fields (id, name, input).");
            return;
          }
        }
        const merged = data.notebooks.map((nb: Notebook) => ({
          ...nb,
          color: nb.color || NOTEBOOK_COLORS[0],
        }));
        setNotebooks(merged);
        setActiveNotebookId(data.activeNotebookId || merged[0].id);
        quillEditorRef.current = null;
        if (user) saveNotebooks(merged, data.activeNotebookId || merged[0].id);
      } catch {
        alert("Invalid file: could not parse JSON.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const clearButtonCallback = () => {
    setActiveInput("");
    setActiveOutput("");
  };

  const addNotebook = () => {
    const id = String(nextId++);
    const color = NOTEBOOK_COLORS[notebooks.length % NOTEBOOK_COLORS.length];
    const nb: Notebook = {
      id,
      name: `Notebook ${notebooks.length + 1}`,
      input: "",
      output: null,
      color,
    };
    setNotebooks((prev) => [...prev, nb]);
    setActiveNotebookId(id);
    quillEditorRef.current = null;
  };

  const removeNotebook = (id: string) => {
    if (notebooks.length <= 1) return;
    setNotebooks((prev) => prev.filter((n) => n.id !== id));
    if (activeNotebookId === id) {
      const idx = notebooks.findIndex((n) => n.id === id);
      const next = notebooks[idx - 1] || notebooks[idx + 1];
      setActiveNotebookId(next.id);
      quillEditorRef.current = null;
    }
  };

  const switchNotebook = (id: string) => {
    if (id === activeNotebookId) return;
    setIsEditingName(false);
    setActiveNotebookId(id);
    quillEditorRef.current = null;
  };

  const clearButton = () => {
    toggleClearButtonModal(true);
  };

  const handleInput = useCallback(async () => {
    if (!input) {
      setActiveOutput("");
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

    setActiveOutput(newOutput);
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
      setActiveInput(newInput);
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
    setActiveName(event.target.value);
  };

  const handleNotebookNameClick = () => {
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
            className="bg-yellow-100 dark:bg-gray-800 rounded-t-lg shadow-lg p-4"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1 overflow-x-auto flex-shrink min-w-0">
                {notebooks.map((nb) => (
                  <div
                    key={nb.id}
                    className={`group relative flex items-center gap-1 px-2.5 py-1 rounded-md cursor-pointer text-sm whitespace-nowrap transition-colors ${
                      nb.id === activeNotebookId
                        ? "bg-white dark:bg-gray-700 shadow text-gray-800 dark:text-white font-medium"
                        : "text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50"
                    }`}
                  >
                    {nb.id === activeNotebookId && isEditingName ? (
                      <input
                        ref={nameInputRef}
                        type="text"
                        value={notebookName}
                        onChange={handleNotebookNameChange}
                        onBlur={handleNotebookNameBlur}
                        onKeyDown={handleNotebookNameKeyDown}
                        className="w-24 md:w-32 bg-transparent text-gray-800 dark:text-white focus:outline-none border-b border-gray-300 dark:border-gray-600 text-sm"
                      />
                    ) : (
                      <>
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0"
                          style={{ backgroundColor: nb.color || NOTEBOOK_COLORS[0] }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setColorPickerFor((prev) => (prev === nb.id ? null : nb.id));
                          }}
                        />
                        <span
                          onClick={() => {
                            if (nb.id !== activeNotebookId) switchNotebook(nb.id);
                          }}
                        >
                          {nb.name}
                        </span>
                        {nb.id === activeNotebookId && (
                          <Edit2
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNotebookNameClick();
                            }}
                            className="w-3 h-3 text-gray-400 hover:text-blue-500 transition-colors"
                          />
                        )}
                      </>
                    )}
                    {notebooks.length > 1 && (
                      <X
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNotebook(nb.id);
                        }}
                        className="w-3 h-3 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    )}
                    {colorPickerFor === nb.id && (
                      <div
                        ref={colorPickerRef}
                        className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 p-1.5 flex gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {NOTEBOOK_COLORS.map((c) => (
                          <span
                            key={c}
                            className={`w-5 h-5 rounded-full cursor-pointer border-2 transition-all hover:scale-110 ${
                              nb.color === c
                                ? "border-gray-900 dark:border-white scale-110"
                                : "border-transparent"
                            }`}
                            style={{ backgroundColor: c }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setNotebookColor(nb.id, c);
                              setColorPickerFor(null);
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                <button
                  onClick={addNotebook}
                  className="p-1 rounded-md text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50 hover:text-blue-500 transition-colors flex-shrink-0"
                  title="Add notebook"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 md:gap-2 items-center flex-shrink-0">
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
                <button
                  onClick={exportNotebooks}
                  className="p-1.5 md:p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
                  title="Export notebooks"
                >
                  <svg
                    className="w-4 h-4 md:w-5 md:h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 11l5-5m0 0l5 5m-5-5v12"
                    />
                  </svg>
                </button>
                <input
                  ref={importFileRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={importNotebooks}
                />
                <button
                  onClick={() => importFileRef.current?.click()}
                  className="p-1.5 md:p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
                  title="Import notebooks"
                >
                  <svg
                    className="w-4 h-4 md:w-5 md:h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 13l5 5m0 0l5-5m-5 5V6"
                    />
                  </svg>
                </button>
                {!user ? (
                  <button
                    onClick={signInWithGoogle}
                    className="group relative px-2.5 py-1.5 md:px-4 md:py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-full hover:bg-blue-500 hover:text-white transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 flex items-center text-xs md:text-sm"
                  >
                    <CloudOff className="w-3.5 h-3.5 md:w-5 md:h-5 md:mr-2" />
                    <span className="hidden md:inline">Sign In</span>
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      Sign in to save your notebook to the cloud
                    </div>
                  </button>
                ) : (
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
                      Due this period:{" "}
                      <span className="font-bold text-green-600 dark:text-green-400">
                        {remainingTotal.toFixed(2)}
                      </span>
                    </span>
                  ) : (
                    <span>
                      Upcoming:{" "}
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
                    This Period
                  </div>
                  <div
                    className={`px-3 py-1 text-xs rounded-full transition-all ${
                      !showRemaining
                        ? "bg-white dark:bg-gray-800 shadow text-gray-800 dark:text-white font-medium"
                        : "text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    Upcoming
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
                      className={`w-3.5 h-3.5 transition-all cursor-pointer ${deductionDates[name] ? "text-green-500 opacity-100" : "text-gray-400 opacity-40 hover:opacity-100 hover:text-green-500"}`}
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
