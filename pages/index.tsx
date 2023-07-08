import { useState, useEffect, ChangeEvent } from 'react';
import styles from '../styles/Home.module.css';
import { evaluate } from 'mathjs';

interface VariableMap {
  [name: string]: number;
}

const initialInput = `# Example Heading
//comment: 300
monthlyPayDate=15
gas: 300
food: 250 
100/4
Variable = prev*2
Total=sum-variable
25% 200`;

export default function Home() {
  const [input, setInput] = useState(initialInput);
  const [output, setOutput] = useState('');
  const [sum, setSum] = useState(0);
  const [prev, setPrev] = useState(0);
  const [message, setCustomMessage] = useState('');

  const reservedKeywords = ["prev", "sum", "to", "in"]
  const currencySymbol = ["£", "$", "€"]
  const variables: VariableMap = {};
  let newOutput = '';
  let tempSum = 0;
  let tempPrev = 0;
  let custom = ''
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
        custom = `-`
      } else if (trimmedLine.includes(':')) {
        const [name, expression] = trimmedLine.split(':').map((item) => item.trim().toLowerCase());
        result = evaluateExpression(expression, variables)
        variables[name] = result;
      } else if (trimmedLine.includes('=')) {
        const [name, expression] = trimmedLine.split("=").map((item) => item.trim().replace(/\,/g, '').toLowerCase());

        if(name === "monthlypaydate"){
          const monthlyPayDate = Number(expression);
          custom = getDaysLeft(monthlyPayDate)
        } else {
          result = evaluateExpression(expression, variables);         
        }
        variables[name] = result;
      
      } else {
        if (trimmedLine) {
          result = evaluateExpression(trimmedLine, variables);
        }
      }
      newOutput += `${result? result : custom}\n`;
      tempSum += result;
      tempPrev = result;
      custom = "-"
    });

    setOutput(newOutput);
    setSum(tempSum);
    setPrev(tempPrev);
  };

  const evaluateExpression = (expression: string, variables: VariableMap) => {
    const individualValue = expression.split(/[+-/*()]/gm).map((item) => item.trim());

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

    let result
    if(expression.length > 0){
      try{
        result = evaluate(expression)
      }catch(e){
        console.error(e)
      }
    }
    const formattedExp  = Number(expression) 

    return result | formattedExp
  };


  const getDaysLeft = (monthlyPayDate: number) => {
    const today : any = new Date();
    const date = today.getDate();
    const daysLeft = monthlyPayDate - date;
    const nextPayDate = new Date(today.setDate(date + daysLeft));

    if (daysLeft < 0) {
      nextPayDate.setMonth(today.getMonth()+1);
    }

    const day = new Date(nextPayDate).getDay();

    let minusWeekend = 0
    if (day === 6) {
      minusWeekend -= 1;
    } else if (day === 0) {
      minusWeekend -= 2;
    }

    nextPayDate.setDate(nextPayDate.getDate() + minusWeekend)

    const diffInMs   = new Date(nextPayDate).valueOf() - new Date().valueOf() 
    const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));
    // const nextDate = nextPayDate.toLocaleDateString("en-GB")
    const nextPayMsg = (`Next pay in ${diffInDays} Days`)
    return nextPayMsg;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        Web Nume
        <i>ric</i>
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