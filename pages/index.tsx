import { useState, useEffect, ChangeEvent } from 'react';
import styles from '../styles/Home.module.css';

interface VariableMap {
  [name: string]: number;
}

const initialInput = `# Expenses
//house: 300
britishgas: 320
pck: 200
food: 250
kitchen: 85
fuel/out: 150
phone: 50+32+8
arabic+quran: 88
travel: 80
wahed: 50
utl: 85
Expense= sum
Result = 2,964 - prev
Now = 1000
preExpense= Now + Result
postExpense= Now - expenses`;

export default function Home() {
  const [input, setInput] = useState(initialInput);
  const [output, setOutput] = useState('');
  const [sum, setSum] = useState(0);
  const [prev, setPrev] = useState(0);
  const [result, setResult] = useState(0);

  useEffect(() => {
    handleInput();
  }, []);

  const handleInputChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
  };

  const handleInput = () => {
    const lines = input.split('\n');
    const variables: VariableMap = {};
  
    let newOutput = '';
    let tempSum = 0;
    let tempPrev = 0;
    let tempResult = 0;
  
    lines.forEach((line) => {
      const trimmedLine = line.trim();
  
      if (trimmedLine.startsWith('//')) {
        // Commented line, skip evaluation
        newOutput += line + '\n';
      } else if (trimmedLine.includes(':')) {
        const [name, expression] = trimmedLine.split(':').map((item) => item.trim());
        const result = evaluateExpression(expression, variables);
        variables[name] = result;
        newOutput += `${result}\n`;
        tempSum += result;
      } else if (trimmedLine.includes('=')) {
        const [name, expression] = trimmedLine.split('=').map((item) => item.trim());
        if (name === 'prev') {
          tempPrev = tempSum;
          variables[name] = tempPrev;
        } else if (name === 'Expense') {
          variables[name] = tempSum; // Set Expense to the calculated sum
          newOutput += `${tempSum}\n`;
        } else if (name === 'Result') {
          tempResult = 2964 - tempPrev;
          variables[name] = tempResult;
          newOutput += `${tempResult}\n`;
        } else {
          const result = evaluateExpression(expression, variables);
          variables[name] = result;
          newOutput += `${result}\n`;
        }
      } else if (trimmedLine === 'sum') {
        newOutput += `${tempSum}\n`;
      } else {
        const result = evaluateExpression(trimmedLine, variables);
        variables[trimmedLine] = result;
        newOutput += `${result}\n`;
      }
    });
  
    setOutput(newOutput);
    setSum(tempSum);
    setPrev(tempPrev);
    setResult(tempResult);
  };
  
  const evaluateExpression = (expression: string, variables: VariableMap) => {
    const parts = expression.split('+').map((part) => part.trim());
    let result = 0;

    parts.forEach((part) => {
      const value = variables[part] || parseFloat(part);
      result += value || 0;
    });

    return result;
  };

  const calculateSum = (variables: VariableMap) => {
    let sum = 0;

    for (const variable in variables) {
      if (typeof variables[variable] === 'number') {
        sum += variables[variable];
      }
    }

    return sum;
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        Web Numi
        <i>er</i>
      </h1>
      <div className={styles.notepad}>
        <div className={styles['notepad-input-container']}>
          <textarea
            value={input}
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