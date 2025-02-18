import { useState, useCallback } from 'react';
import { useStore } from 'react-redux';
import { getReduxAI } from '@redux-ai/state';

export function useReduxAI() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const store = useStore();

  const sendQuery = useCallback(async (query: string): Promise<string> => {
    setIsProcessing(true);
    setError(null);

    try {
      const reduxAI = getReduxAI();
      if (!reduxAI) {
        throw new Error('ReduxAI not initialized');
      }

      console.log('[useReduxAI] Sending query:', query);
      const response = await reduxAI.processQuery(query);
      console.log('[useReduxAI] Received response:', response.message);

      return response.message;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('[useReduxAI] Error in sendQuery:', errorMessage);
      setError(errorMessage);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    sendQuery,
    isProcessing,
    error
  };
}