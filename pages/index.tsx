import { useState, useEffect, ChangeEvent } from 'react';
import styles from '../styles/Home.module.css';
import { evaluate } from 'mathjs';

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
Expenses = sum 
Result = 2,964 - prev
Now = 1000
preExpense= Now + Result 
postExpense= Now - expenses`;

export default function Home() {
  const [input, setInput] = useState(initialInput);
  const [output, setOutput] = useState('');
  const [sum, setSum] = useState(0);
  const [prev, setPrev] = useState(0);
  const reservedKeywords = ["prev", "sum"]
  const variables: VariableMap = {};
  let newOutput = '';
  let tempSum = 0;
  let tempPrev = 0;


  useEffect(() => {
    handleInput();
  }, []);

  const handleInputChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
  };

  const handleInput = () => {
    const lines = input.split('\n');
    // let tempResult = 0;

    lines.forEach((line) => {
      const trimmedLine = line.trim();
      let result = 0
      if (trimmedLine.startsWith('//')) {
        // Commented line, skip evaluation
        newOutput += '--';
      } else if (trimmedLine.startsWith('#')) {
        // Commented line, skip evaluation
        newOutput += '--';
      } else if (trimmedLine.includes(':')) {
        const [name, expression] = trimmedLine.split(':').map((item) => item.trim().toLowerCase());
        result = evaluateExpression(expression, variables)
        variables[name] = result;
      } else if (trimmedLine.includes('=')) {
        const [name, expression] = trimmedLine.split("=").map((item) => item.trim().replace(/\,/g, '').toLowerCase());
        result = evaluateExpression(expression, variables);         
        variables[name] = result;
      } else {
        if (trimmedLine) {
          result = evaluateExpression(trimmedLine, variables);
        }
      }
      console.log(result)
      newOutput += `${result? result : '--'}\n`;
      console.log(newOutput)
      tempSum += result;
      tempPrev = result;
    });

    setOutput(newOutput);
    setSum(tempSum);
    setPrev(tempPrev);
    // setResult(tempResult);
  };

  const evaluateExpression = (expression: string, variables: VariableMap) => {
    const individualValue = expression.split(/[+-/*()]/gm).map((item) => item.trim());
    // let result2 = evaluateExpression(moreExpressions, variables);
    individualValue.forEach(value => {
      if (typeof value == "string") {
        if (reservedKeywords.includes(value)) {
          if (value == "prev") {
            expression = expression.replace(value, String(tempPrev))
          }
          if (value == "sum") {
            expression = expression.replace(value, String(tempSum))
          }
        }
        
        if (variables[value] >= 0) {
          expression = expression.replace(value, String(variables[value]))
        }
      }
    })

    let res
    const exp  = Number(expression) 

    if(expression.length > 0){
      try{
        res = evaluate(expression)
      }catch(e){
        console.log(e)
      }
    }

    return res | exp
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