import { Header } from "@/components/Header";
import { useCalculations } from "@/hooks/useCalculations";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import "dotenv/config";
import { User } from "firebase/auth";
import { ChangeEvent, useCallback, useEffect, useState } from "react";
import "react-quill/dist/quill.snow.css";
import "tailwindcss/tailwind.css";
import { evaluateExpression } from "../helpers/calculate";
import { getDaysLeft } from "../helpers/paydate";
import { VariableMap } from "../helpers/sharedTypes";
import styles from "../styles/Home.module.css";

const initialInput = `# Example Heading
//comment: 300
monthlyPayDate=15
gas: 300
food: 250 
100/4
Variable = prev*2
Total=sum-variable`;

export default function Home() {
  const user: User | null = useCustomAuth();
  const { calculations, saveCalculations } = useCalculations(user);
  const [mode, toggleDarkMode] = useState(false);
  const [input, setInput] = useState<string>(initialInput);
  const [output, setOutput] = useState<string | null>();
  const [, setSum] = useState(0);
  const [, setPrev] = useState(0);

  const handleInputChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
  };

  // useEffect(() => {
  //   if (typeof window !== 'undefined' && window.localStorage) {
  //     const userInput = localStorage.getItem('userInput');
  //     const userOutput = localStorage.getItem('userOutput');

  //     userInput && setInput(userInput);
  //     userOutput && setOutput(userOutput);
  //   }
  // }, []);

  useEffect(() => {
    if (calculations) {
      setInput(calculations.input);
      setOutput(calculations.output);
    }
  }, [calculations]);

  useEffect(() => {
    handleInput();
  }, [input]);

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

  // TODO: use regex, refactor code to avoid repetition and unnecessary re-rendering
  const handleInput = useCallback(() => {
    const lines = input?.split("\n");

    lines?.forEach((line) => {
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
    });
    // let storedOutput: string | null = ""
    // if (typeof window !== "undefined" && window.localStorage) {
    //   input && localStorage.setItem("userInput", input);
    //   newOutput && localStorage.setItem("userOutput", newOutput);
    //   storedOutput = localStorage?.getItem("userOutput");
    // }
    setOutput(newOutput);
    setSum(keywordValues.tempSum);
    setPrev(keywordValues.tempPrev);
  }, [input]);

  const textAreaStyle = mode
    ? styles["futuristicTextareaLight"]
    : styles["futuristicTextarea"];

  const textAreaOutputStyle = mode
    ? styles["textareaOutputLight"]
    : styles["textareaOutput"];

  return (
    <div className={mode ? "light max-h-full" : "dark max-h-full"}>
      <div className={styles.container}>
        <Header user={user} mode={mode} toggleDarkMode={toggleDarkMode} />
        <h1 className={styles.title}>
          Instant
          <i>Calc</i>
        </h1>
      </div>

      <button
        onClick={saveToDatabase}
        className="text-white bg-[#1b722a] hover:bg-[#4285F4]/90 focus:ring-4 focus:outline-none focus:ring-[#4285F4]/50 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center me-2 mb-2"
      >
        Save
      </button>

      <div className={styles.notepad}>
        <div className={styles["notepadInputContainer"]}>
          <textarea
            value={input || ""}
            onChange={handleInputChange}
            placeholder="Type your calculations here..."
            className={`${textAreaStyle} ${styles["textareaInput"]}`}
          />
        </div>
        {output && (
          <div className={styles["notepadOutputContainer"]}>
            <textarea
              readOnly
              value={output}
              placeholder="Output"
              className={`${textAreaStyle} ${textAreaOutputStyle}`}
            />
          </div>
        )}
      </div>
    </div>
  );
}
