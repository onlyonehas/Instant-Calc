import { useState, useEffect, ChangeEvent } from 'react';
import styles from '../styles/Home.module.css';

interface VariableMap {
  [name: string]: number;
}

export default function Home() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  useEffect(() => {
    handleInput();
  }, [input]);

  const handleInputChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
  };

  const handleInput = () => {
    const lines = input.split('\n');
    const variables: VariableMap = {};

    let newOutput = '';

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
      } else if (trimmedLine.includes('=')) {
        const [name, expression] = trimmedLine.split('=').map((item) => item.trim());
        const result = evaluateExpression(expression, variables);
        variables[name] = result;
        newOutput += `${result}\n`;
      } else if (trimmedLine === 'sum') {
        newOutput += `${calculateSum(variables)}\n`;
      } else {
        const result = evaluateExpression(trimmedLine, variables);
        variables[trimmedLine] = result;
        newOutput += `${result}\n`;
      }
    });

    setOutput(newOutput);
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
      <h1 className={styles.title}>Web Numi<i>er</i></h1>
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
