import { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useVectorDebug } from './useVectorDebug';
import type { VectorEntry } from '@redux-ai/vector';

interface RAGResponse {
  ragResponse: string;
  similarDocs: VectorEntry[];
  timestamp: string;
}

export function useReduxAI() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ragResults, setRagResults] = useState<RAGResponse | null>(null);
  const { entries, isLoading: isInitializing, error: vectorError } = useVectorDebug();
  const dispatch = useDispatch();

  const sendQuery = useCallback(async (query: string): Promise<string> => {
    if (isInitializing) {
      throw new Error('Vector store not initialized');
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Update RAG results with current vector entries
      const ragResponse: RAGResponse = {
        ragResponse: 'Query processed successfully',
        similarDocs: entries,
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
  }, [entries, isInitializing]);

  return {
    sendQuery,
    isProcessing,
    error: error || vectorError,
    ragResults,
    isInitialized: !isInitializing
  };
}