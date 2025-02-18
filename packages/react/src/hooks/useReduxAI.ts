import { useState, useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { getReduxAI } from '@redux-ai/state';

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

export function useReduxAI() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ragResults, setRagResults] = useState<RAGResponse | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    const initialize = async () => {
      try {
        try {
          getReduxAI();
          setIsInitialized(true);
          console.log('ReduxAI already initialized');
        } catch (err) {
          console.log('Waiting for ReduxAI initialization...');
        }
      } catch (err: unknown) {
        console.error('Failed to initialize ReduxAI:', err);
        setError('Failed to initialize AI functionality');
      }
    };

    initialize();

    const interval = setInterval(() => {
      try {
        getReduxAI();
        setIsInitialized(true);
        clearInterval(interval);
      } catch (err) {
        // Continue polling
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const sendQuery = useCallback(async (query: string): Promise<string> => {
    if (!isInitialized) {
      throw new Error('ReduxAI not initialized');
    }

    setIsProcessing(true);
    setError(null);

    try {
      const reduxAI = getReduxAI();
      console.log('Processing query:', query);
      const response = await reduxAI.processQuery(query);
      console.log('Query response:', response);

      let similarDocs = [];
      try {
        const fetchedDocs = await reduxAI.getSimilarInteractions(query);
        console.log('Raw similar docs:', fetchedDocs);
        similarDocs = Array.isArray(fetchedDocs) ? fetchedDocs : [];
      } catch (err) {
        console.warn('Failed to get similar interactions:', err);
      }

      console.log('Processed similarDocs:', similarDocs);

      // Create RAG results with proper type safety and defaults
      const ragResponse: RAGResponse = {
        ragResponse: response?.message || '',
        similarDocs: similarDocs.map(doc => ({
          query: doc.query || '',
          response: doc.response || '',
          state: doc.state || '',
          timestamp: doc.timestamp || new Date().toISOString()
        })),
        timestamp: new Date().toISOString()
      };

      console.log('Setting RAG results:', ragResponse);
      setRagResults(ragResponse);
      return response?.message || '';
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