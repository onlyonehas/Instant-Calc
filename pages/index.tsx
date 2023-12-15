import { useState, useEffect, ChangeEvent } from 'react';
import styles from '../styles/Home.module.css';
import { getDaysLeft } from '../helpers/paydate'
import { VariableMap } from '../helpers/sharedTypes'
import { evaluateExpression } from '../helpers/calculate'

const initialInput = `# Example Heading
//comment: 300
monthlyPayDate=15
gas: 300
food: 250 
100/4
Variable = prev*2
Total=sum-variable`;

export default function Home() {
  const [input, setInput] = useState<string | null>(initialInput);
  const [output, setOutput] = useState<string | null>('');
  const [, setSum] = useState(0);
  const [, setPrev] = useState(0);

  const variables: VariableMap = {};
  let newOutput = '';
  let customOutput = ''

  const keywordValues = {
    tempSum: 0,
    tempPrev: 0
  }

  const handleInputChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const userInput = localStorage.getItem('userInput');
      const userOutput = localStorage.getItem('userOutput');

      userInput && setInput(userInput);
      userOutput && setOutput(userOutput);
    }
  }, []);

  useEffect(() => {
    handleInput()
  }, [input]);

  // TODO: use regex, refactor code to avoid repetition and unnecessary re-rendering
  
  const handleInput = () => {
    const lines = input?.split('\n');

    lines?.forEach((line) => {
      const trimmedLine = line.trim();
      let result: number = 0;

      if (trimmedLine.startsWith('#') || trimmedLine.startsWith('//')) {
        customOutput = `-`
      } else if (trimmedLine.includes(':')) {
        const [name, expression] = trimmedLine.split(':').map((item) => item.trim().toLowerCase());
        const {evaluatedResult, hasCustomOutput} = evaluateExpression({ expression, variables, keywordValues })
        result = evaluatedResult
        customOutput = hasCustomOutput
        variables[name] = result;
      } else if (trimmedLine.includes('=')) {
        const [name, expression] = trimmedLine.split("=").map((item) => item.trim().replace(/\,/g, '').toLowerCase());
        if (name === "monthlypaydate") {
          const monthlyPayDate = Number(expression);
          customOutput = getDaysLeft(monthlyPayDate)
        } else {
          const {evaluatedResult, hasCustomOutput } = evaluateExpression({expression, variables, keywordValues});
          result = evaluatedResult
          customOutput = hasCustomOutput
        }
        variables[name] = result;
      } else {
        if (trimmedLine) {
          const output  = evaluateExpression({expression:trimmedLine, variables, keywordValues});
          result = output.evaluatedResult
          customOutput = output.hasCustomOutput
        }
      }
      
      newOutput += `${result ? result : customOutput}\n`;
      keywordValues.tempSum += result;
      keywordValues.tempPrev = result;
      customOutput = "-"
    });

    let storedOutput: string | null = ""
    if (typeof window !== "undefined" && window.localStorage) {
      input && localStorage.setItem("userInput", input);
      newOutput && localStorage.setItem("userOutput", newOutput);
      storedOutput = localStorage?.getItem("userOutput");
    }
    setOutput(storedOutput || newOutput);
    setSum(keywordValues.tempSum);
    setPrev(keywordValues.tempPrev);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        Instant
        <i>Calc</i>
      </h1>
      <div className={styles.notepad}>
        <div className={styles['notepad-input-container']}>
          <textarea
            value={input || ""}
            onChange={handleInputChange}
            placeholder="Type your calculations here..."
            className={`${styles['futuristic-textarea']} ${styles['textarea-input']}`}
          />
        </div>
        {output && (
          <div className={styles['notepad-output-container']}>
            <textarea
              readOnly
              value={output}
              placeholder="Output"
              className={`${styles['futuristic-textarea']} ${styles['textarea-output']}`}
            />
          </div>
        )}
      </div>
    </div>
  );
}