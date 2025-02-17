import { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';

interface QueryResponse {
  message: string;
  action: any | null;
}

export function useReduxAI() {
  const [isProcessing, setIsProcessing] = useState(false);
  const dispatch = useDispatch();

  const sendQuery = useCallback(async (query: string): Promise<string> => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: QueryResponse = await response.json();

      if (data.action) {
        dispatch(data.action);
      }

      return data.message;
    } catch (error) {
      console.error('Error sending query:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [dispatch]);

  return {
    sendQuery,
    isProcessing,
  };
}