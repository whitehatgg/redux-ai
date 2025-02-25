import { useCallback, useState } from 'react';
import { createReduxAIState } from '@redux-ai/state';
import { useReduxAIContext } from '../components/ReduxAIProvider';

export function useReduxAI() {
  const { store, schema, vectorStorage, apiEndpoint } = useReduxAIContext();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendQuery = useCallback(
    async (query: string): Promise<string> => {
      setIsProcessing(true);
      setError(null);

      try {
        if (!vectorStorage) {
          throw new Error('Vector storage is not properly initialized');
        }

        const state = createReduxAIState({
          store,
          schema,
          vectorStorage,
          apiEndpoint,
        });

        const result = await state.processQuery(query);
        return result.message;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        setError(errorMessage);
        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    [store, schema, vectorStorage, apiEndpoint]
  );

  return {
    sendQuery,
    isProcessing,
    error,
  };
}