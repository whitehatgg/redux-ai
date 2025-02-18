import { useState, useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { getReduxAI, initializeReduxAI } from '../../../client/src/store';

interface RAGResponse {
  ragResponse: string;
  similarDocs: Array<{
    query: string;
    response: string;
    state: string;
    timestamp: string;
  }>;
  timestamp: string;
}

interface QueryResponse {
  message: string;
  action: any | null;
  ragResults?: RAGResponse;
  error?: string;
}

/**
 * Hook for natural language interaction with Redux store
 * Allows querying and updating store state through AI
 */
export function useReduxAI() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ragResults, setRagResults] = useState<RAGResponse | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    initializeReduxAI()
      .then(() => setIsInitialized(true))
      .catch((err) => {
        console.error('Failed to initialize ReduxAI:', err);
        setError('Failed to initialize AI functionality');
      });
  }, []);

  const sendQuery = useCallback(async (query: string): Promise<string> => {
    if (!isInitialized) {
      throw new Error('ReduxAI not initialized');
    }

    setIsProcessing(true);
    setError(null);
    setRagResults(null);

    try {
      const reduxAI = getReduxAI();
      const response = await reduxAI.processQuery(query);
      const similarDocs = await reduxAI.getSimilarInteractions(query);

      // Create RAG results
      const ragResponse: RAGResponse = {
        ragResponse: response.message,
        similarDocs,
        timestamp: new Date().toISOString()
      };

      setRagResults(ragResponse);
      return response.message;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setError(errorMessage);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [isInitialized]);

  return {
    sendQuery,
    isProcessing,
    error,
    ragResults,
    isInitialized
  };
}