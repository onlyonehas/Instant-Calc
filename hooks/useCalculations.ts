import { database } from "@/pages/_document";
import { User } from "firebase/auth";
import { get, off, ref, set, update } from "firebase/database";
import { useEffect, useState } from "react";
import { useCustomAuth } from "./useCustomAuth";

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

export const useCalculations = (): UseCalculationsResult => {
  const user: User | null = useCustomAuth();
  const [calculations, setCalculations] = useState<Calculation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [calculationsRef, setCalculationsRef] = useState<any>(null);
  const [hasFetchedCalculations, setHasFetchedCalculations] = useState(false);

  useEffect(() => {
    if (user && database) {
      setCalculationsRef(ref(database, `users/${user?.uid}/calculations`));
    }
    return () => {
      if (calculationsRef) {
        off(calculationsRef);
      }
    };
  }, [user, database]);

  useEffect(() => {
    if (!hasFetchedCalculations && calculationsRef) {
      getCalculations(); // Pass the reference here
      setHasFetchedCalculations(true);
    }
  }, [hasFetchedCalculations, calculationsRef]);

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

      if (calculationsRef) {
        if (!calculations) {
          await set(calculationsRef, { input, output });
        } else {
          await update(calculationsRef, { input, output });
        }
      }
    } catch (error) {
      setError(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  return { calculations, saveCalculations, getCalculations, isLoading, error };
};
