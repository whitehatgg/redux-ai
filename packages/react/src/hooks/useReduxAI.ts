import { useState, useCallback, useEffect } from 'react';
import { useDispatch, useStore } from 'react-redux';
import type { VectorEntry } from '@redux-ai/vector';
import { createReduxAIVector } from '@redux-ai/vector';

interface RAGResponse {
  ragResponse: string;
  similarDocs: VectorEntry[];
  timestamp: string;
}

export function useReduxAI() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ragResults, setRagResults] = useState<RAGResponse | null>(null);
  const [vectorInstance, setVectorInstance] = useState<Awaited<ReturnType<typeof createReduxAIVector>> | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const dispatch = useDispatch();
  const store = useStore();

  useEffect(() => {
    const initVector = async () => {
      try {
        const instance = await createReduxAIVector();
        setVectorInstance(instance);
        setError(null);
      } catch (err) {
        console.error('Error initializing vector store:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize vector store');
      } finally {
        setIsInitializing(false);
      }
    };

    initVector();
  }, []);

  const sendQuery = useCallback(async (query: string): Promise<string> => {
    if (!vectorInstance || isInitializing) {
      throw new Error('Vector store not initialized');
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Get current state
      const currentState = store.getState();

      // Get similar interactions for context
      const similarDocs = await vectorInstance.retrieveSimilar(query);

      // Store the interaction
      await vectorInstance.storeInteraction(
        query,
        'Query processed successfully',
        JSON.stringify(currentState, null, 2)
      );

      // Update RAG results
      const ragResponse: RAGResponse = {
        ragResponse: 'Query processed successfully',
        similarDocs,
        timestamp: new Date().toISOString()
      };

      setRagResults(ragResponse);
      return 'Query processed successfully';
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setError(errorMessage);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [vectorInstance, isInitializing, store]);

  return {
    sendQuery,
    isProcessing,
    error,
    ragResults,
    isInitialized: !isInitializing && !!vectorInstance
  };
}