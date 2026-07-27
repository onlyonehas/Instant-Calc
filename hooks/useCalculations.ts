import { database } from "@/pages/_document";
import { User } from "firebase/auth";
import { get, ref, set } from "firebase/database";
import { useEffect, useState } from "react";
import { useCustomAuth } from "./useCustomAuth";

export interface Notebook {
  id: string;
  name: string;
  input: string;
  output: string | null;
  color?: string;
}

export const NOTEBOOK_COLORS = [
  "#3b82f6",
  "#ef4444",
  "#22c55e",
  "#f59e0b",
  "#a855f7",
  "#ec4899",
  "#14b8a6",
  "#f97316",
];

interface NotebooksData {
  notebooks: Notebook[];
  activeNotebookId: string;
}

interface UseCalculationsResult {
  notebooksData: NotebooksData | null;
  saveNotebooks: (notebooks: Notebook[], activeNotebookId: string) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

export const useCalculations = (): UseCalculationsResult => {
  const user: User | null = useCustomAuth();
  const [notebooksData, setNotebooksData] = useState<NotebooksData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [calculationsRef, setCalculationsRef] = useState<any>(null);
  const [hasFetchedCalculations, setHasFetchedCalculations] = useState(false);

  useEffect(() => {
    if (user && database) {
      setCalculationsRef(ref(database, `users/${user?.uid}/calculations`));
    }
  }, [user, database]);

  useEffect(() => {
    if (!user) {
      setNotebooksData(null);
      setHasFetchedCalculations(false);
      setCalculationsRef(null);
    }
  }, [user]);

  useEffect(() => {
    if (!hasFetchedCalculations && calculationsRef) {
      getCalculations();
      setHasFetchedCalculations(true);
    }
  }, [hasFetchedCalculations, calculationsRef]);

  const getCalculations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const snapshot = await get(calculationsRef);
      const data = snapshot.val();

      if (!data) {
        setNotebooksData(null);
        return;
      }

      if (data.notebooks) {
        setNotebooksData(data as NotebooksData);
      } else if (data.input !== undefined) {
        setNotebooksData({
          notebooks: [
            {
              id: "1",
              name: "General Expense",
              input: data.input,
              output: data.output ?? null,
              color: NOTEBOOK_COLORS[0],
            },
          ],
          activeNotebookId: "1",
        });
      }
    } catch (error) {
      setError(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveNotebooks = async (notebooks: Notebook[], activeNotebookId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      if (calculationsRef) {
        await set(calculationsRef, { notebooks, activeNotebookId });
      }
    } catch (error) {
      setError(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  return { notebooksData, saveNotebooks, isLoading, error };
};
