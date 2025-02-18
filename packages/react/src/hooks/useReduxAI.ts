import { useState, useCallback, useEffect } from 'react';
import { useDispatch, useStore } from 'react-redux';
import type { VectorEntry } from '@redux-ai/vector';
import { getReduxAI } from '@redux-ai/state';
import { useReduxAIContext } from '../components/ReduxAIProvider';

interface RAGResponse {
  ragResponse: string;
  similarDocs: VectorEntry[];
  timestamp: string;
}

export function useReduxAI() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ragResults, setRagResults] = useState<RAGResponse | null>(null);
  const dispatch = useDispatch();
  const store = useStore();
  const { isInitialized } = useReduxAIContext();

  // Track state changes
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      const currentState = store.getState();
      console.log('State updated:', currentState);
      // Store the state change in vector storage
      if (isInitialized) {
        const reduxAI = getReduxAI();
        reduxAI.storeInteraction(
          'state_change',
          'State updated',
          currentState
        ).catch(console.error);
      }
    });

    return () => unsubscribe();
  }, [store, isInitialized]);

  const sendQuery = useCallback(async (query: string): Promise<string> => {
    setIsProcessing(true);
    setError(null);

    try {
      const reduxAI = getReduxAI();
      const currentState = store.getState();

      // Store the query and current state
      await reduxAI.storeInteraction(query, '', currentState);

      const response = await reduxAI.processQuery(query);
      console.log('ReduxAI Response:', response);

      const similarDocs = await reduxAI.getSimilarInteractions(query, 5);
      console.log('Similar interactions:', similarDocs);

      const ragResponse: RAGResponse = {
        ragResponse: response.message,
        similarDocs,
        timestamp: new Date().toISOString()
      };

      setRagResults(ragResponse);
      return response.message;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Error in sendQuery:', error);
      setError(errorMessage);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [store, isInitialized]);

  return {
    sendQuery,
    isProcessing,
    error,
    isInitialized,
    ragResults
  };
}