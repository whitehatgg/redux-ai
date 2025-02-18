import { useState, useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { getReduxAI, initializeReduxAI } from '@redux-ai/state';

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
    const initialize = async () => {
      try {
        await initializeReduxAI();
        setIsInitialized(true);
        console.log('ReduxAI initialized successfully');
      } catch (err: unknown) {
        console.error('Failed to initialize ReduxAI:', err);
        setError('Failed to initialize AI functionality');
      }
    };

    initialize();
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
      console.log('Processing query:', query);
      const response = await reduxAI.processQuery(query);
      console.log('Query response:', response);
      const similarDocs = await reduxAI.getSimilarInteractions(query);
      console.log('Similar docs:', similarDocs);

      // Safely convert similarDocs to the expected format
      const formattedSimilarDocs = (Array.isArray(similarDocs) ? similarDocs : []).map(doc => ({
        query: doc?.query || 'No query available',
        response: doc?.response || 'No response available',
        state: doc?.state || '{}',
        timestamp: doc?.timestamp || new Date().toISOString()
      }));

      // Create RAG results with proper type safety
      const ragResponse: RAGResponse = {
        ragResponse: response.message,
        similarDocs: formattedSimilarDocs,
        timestamp: new Date().toISOString()
      };

      setRagResults(ragResponse);
      return response.message;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Error in sendQuery:', errorMessage);
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