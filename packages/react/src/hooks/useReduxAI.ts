import { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';

interface QueryResponse {
  message: string;
  action: any | null;
  error?: string;
}

/**
 * Hook for natural language interaction with Redux store
 * Allows querying and updating store state through AI
 */
export function useReduxAI() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dispatch = useDispatch();

  const sendQuery = useCallback(async (query: string): Promise<string> => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data: QueryResponse = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // If action is provided, dispatch it to update Redux store
      if (data.action) {
        dispatch(data.action);
      }

      return data.message;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setError(errorMessage);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [dispatch]);

  return {
    sendQuery,
    isProcessing,
    error
  };
}