import { useState, useEffect, ChangeEvent } from 'react';
import styles from '../styles/Home.module.css';
import { getDaysLeft } from '../helpers/paydate'
import { VariableMap } from '../helpers/shareTypes'
import { evaluateExpression } from '../helpers/calc'

const initialInput = `# Example Heading
//comment: 300
monthlyPayDate=15
gas: 300
food: 250 
100/4
Variable = prev*2
Total=sum-variable
25% 200
£1 in euro`;

export default function Home() {
  const [input, setInput] = useState(initialInput);
  const [output, setOutput] = useState('');
  const [sum, setSum] = useState(0);
  const [prev, setPrev] = useState(0);

  const variables: VariableMap = {};
  let newOutput = '';
  let customOutput = ''

  const keywordValues = {
    tempSum : 0,
    tempPrev : 0
  }

  const handleInputChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
  };

  useEffect(() => {
    handleInput();
  }, [input]);


  const handleInput = () => {
    const lines = input.split('\n');

    lines.forEach((line) => {
      const trimmedLine = line.trim();
      let result = 0

      if (trimmedLine.startsWith('#') || trimmedLine.startsWith('//')) {
        customOutput = `-`
      } else if (trimmedLine.includes(':')) {
        const [name, expression] = trimmedLine.split(':').map((item) => item.trim().toLowerCase());
        result = evaluateExpression(expression, variables, keywordValues)
        variables[name] = result;
      } else if (trimmedLine.includes('=')) {
        const [name, expression] = trimmedLine.split("=").map((item) => item.trim().replace(/\,/g, '').toLowerCase());

        if (name === "monthlypaydate") {
          const monthlyPayDate = Number(expression);
          customOutput = getDaysLeft(monthlyPayDate)
        } else {
          result = evaluateExpression(expression, variables, keywordValues);
        }
        variables[name] = result;
      } else {
        if (trimmedLine) {
          result = evaluateExpression(trimmedLine, variables, keywordValues);
        }
      }
      newOutput += `${result ? result : customOutput}\n`;
      keywordValues.tempSum += result;
      keywordValues.tempPrev = result;
      customOutput = "-"
    });

    setOutput(newOutput);
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