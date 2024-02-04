import { useState, useEffect } from 'react';
import { get, off, ref, set, update } from 'firebase/database';
import { database } from '@/pages/_document';
import { User } from 'firebase/auth';

interface Calculation {
  input: string;
  output: string;
}

interface UseCalculationsResult {
  calculations: Calculation | null;
  saveCalculations: (input: string, output: string) => void;
  getCalculations: () => void;
  isLoading: boolean;
  error: Error | null;
}

export const useCalculations = (user: User | null): UseCalculationsResult => {
  const [calculations, setCalculations] = useState<Calculation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  let calculationsRef: any;

  useEffect(() => {
    if (user) {
      calculationsRef = ref(database, `users/${user?.uid}/calculations`);
      getCalculations();
    }
    return () => {
      if (calculationsRef) {
        off(calculationsRef);
      }
    };
  }, [user, database]);

  const getCalculations = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const snapshot = await get(calculationsRef);
      const data = snapshot.val() as Calculation;
      setCalculations(data);
    } catch (error) {
      setError(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveCalculations = async (input: string, output: string) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!calculations) {
        await set(calculationsRef, { input, output });
      } else {
        await update(calculationsRef, { input, output });
      }
    } catch (error) {
      setError(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  return { calculations, saveCalculations, getCalculations, isLoading, error };
}


