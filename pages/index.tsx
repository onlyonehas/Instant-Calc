import 'dotenv/config'
import 'tailwindcss/tailwind.css'
import styles from '../styles/Home.module.css';
import { useState, useEffect, ChangeEvent, useCallback } from 'react';
import { getDaysLeft } from '../helpers/paydate'
import { VariableMap } from '../helpers/sharedTypes'
import { evaluateExpression } from '../helpers/calculate'
import { GoogleAuthProvider, User, getAuth, signInWithPopup, signOut } from 'firebase/auth';
import { app } from './_document';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { useCalculations } from '@/hooks/useCalculations';
// import { Profile } from '@/app/profile';

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

  const [input, setInput] = useState<string | null>(initialInput);
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
      setInput(calculations.input)
      setOutput(calculations.output)
    }
  }, [calculations]);

  useEffect(() => {
    handleInput()
  }, [input]);

  const SignInButton = () => {
    const signInWithGoogle = async () => {
      try {
        const auth = getAuth(app);
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      } catch (error) {
        console.error(error);
      }
    };
    return (
      <button onClick={signInWithGoogle} type="button" className="text-white bg-[#4285F4] hover:bg-[#4285F4]/90 focus:ring-4 focus:outline-none focus:ring-[#4285F4]/50 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:focus:ring-[#4285F4]/55 me-2 mb-2">
        <svg className="w-4 h-4 me-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 18 19">
          <path fillRule="evenodd" d="M8.842 18.083a8.8 8.8 0 0 1-8.65-8.948 8.841 8.841 0 0 1 8.8-8.652h.153a8.464 8.464 0 0 1 5.7 2.257l-2.193 2.038A5.27 5.27 0 0 0 9.09 3.4a5.882 5.882 0 0 0-.2 11.76h.124a5.091 5.091 0 0 0 5.248-4.057L14.3 11H9V8h8.34c.066.543.095 1.09.088 1.636-.086 5.053-3.463 8.449-8.4 8.449l-.186-.002Z" clipRule="evenodd" />
        </svg>
        Sign in with Google
      </button>
    )
  };

  const SignOutButton = () => {
    const signOutUser = () => {
      const auth = getAuth(app);
      signOut(auth).then(() => {
      }).catch((error) => {
        console.error(error);
      });
    };
    return (
      <div>
        <div className="flex flex-col items-center">
          <h2 className="text-xl font-medium">{user?.displayName} 👋</h2>
          <p className="text-base font-medium text-gray-400">Calculations</p>
        </div>
        <button onClick={signOutUser} className="text-white bg-[#dd3838] hover:bg-[#4285F4]/90 focus:ring-4 focus:outline-none focus:ring-[#4285F4]/50 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:focus:ring-[#4285F4]/55 me-2 mb-2">Sign Out</button>
        <button onClick={saveToDatabase} className="text-white bg-[#1b722a] hover:bg-[#4285F4]/90 focus:ring-4 focus:outline-none focus:ring-[#4285F4]/50 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:focus:ring-[#4285F4]/55 me-2 mb-2">Save</button>
      </div>
    )
  };

  const variables: VariableMap = {};
  let newOutput = '';
  let customOutput = ''

  const keywordValues = {
    tempSum: 0,
    tempPrev: 0
  }

  const saveToDatabase = () => {
    if (user && input && output) {
      if (input !== initialInput && output !== null) {
        saveCalculations(input, output);
      }
    }
  }

  // TODO: use regex, refactor code to avoid repetition and unnecessary re-rendering
  const handleInput = useCallback(() => {
    const lines = input?.split('\n');

    lines?.forEach((line) => {
      const trimmedLine = line.trim();
      let result: number = 0;

      if (trimmedLine.startsWith('#') || trimmedLine.startsWith('//')) {
        customOutput = `-`
      } else if (trimmedLine.includes(':')) {
        const [name, expression] = trimmedLine.split(':').map((item) => item.trim().toLowerCase());
        const { evaluatedResult, hasCustomOutput } = evaluateExpression({ expression, variables, keywordValues })
        result = evaluatedResult
        customOutput = hasCustomOutput
        variables[name] = result;
      } else if (trimmedLine.includes('=')) {
        const [name, expression] = trimmedLine.split("=").map((item) => item.trim().replace(/\,/g, '').toLowerCase());
        if (name === "monthlypaydate") {
          const monthlyPayDate = Number(expression);
          customOutput = getDaysLeft(monthlyPayDate)
        } else {
          const { evaluatedResult, hasCustomOutput } = evaluateExpression({ expression, variables, keywordValues });
          result = evaluatedResult
          customOutput = hasCustomOutput
        }
        variables[name] = result;
      } else {
        if (trimmedLine) {
          const output = evaluateExpression({ expression: trimmedLine, variables, keywordValues });
          result = output.evaluatedResult
          customOutput = output.hasCustomOutput
        }
      }

      newOutput += `${result ? result : customOutput}\n`;
      keywordValues.tempSum += result;
      keywordValues.tempPrev = result;
      customOutput = "-"
    })
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

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        Instant
        <i>Calc</i>
      </h1>
      <div className='space-y-10 space-x-10'>
        {!user ? (
          <SignInButton />
        ) : (
          <div>
            <SignOutButton />
          </div>
        )}
      </div>
      <div className={styles.notepad}>
        <div className={styles['notepadInputContainer']}>
          <textarea
            value={input || ""}
            onChange={handleInputChange}
            placeholder="Type your calculations here..."
            className={`${styles['futuristicTextarea']} ${styles['textareaInput']}`}
          />
        </div>
        {output && (
          <div className={styles['notepadOutputContainer']}>
            <textarea
              readOnly
              value={output}
              placeholder="Output"
              className={`${styles['futuristicTextarea']} ${styles['textareaOutput']}`}
            />
          </div>
        )}
      </div>
    </div>
  );
}