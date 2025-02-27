import { useCallback, useState } from 'react';
import { createReduxAIState } from '@redux-ai/state';

import { useReduxAIContext } from '../components/ReduxAIProvider';

export interface AIResponse {
  message?: string;
  action?: Record<string, unknown> | null;
  error?: string;
}

export function useReduxAI() {
  const { store, actions, storage, endpoint } = useReduxAIContext();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendQuery = useCallback(
    async (query: string): Promise<AIResponse> => {
      setIsProcessing(true);
      setError(null);

      try {
        if (!storage) {
          throw new Error('Vector storage is not properly initialized');
        }

        const state = createReduxAIState({
          store,
          actions,
          storage,
          endpoint,
          onError: error => {
            console.error('ReduxAI Error:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            setError(errorMessage);
            throw error; // Re-throw to be caught below
          },
        });

        const result = await state.processQuery(query);

        if (!result) {
          throw new Error('No response received from the server');
        }

        // Handle error responses
        if ('error' in result && result.error) {
          throw new Error(result.error);
        }

        // Ensure we have either a message or an action
        if (!result.message && !result.action) {
          throw new Error('Invalid response format: missing message and action');
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        setError(errorMessage);
        return { error: errorMessage };
      } finally {
        setIsProcessing(false);
      }
    },
    [store, actions, storage, endpoint]
  );

  return {
    sendQuery,
    isProcessing,
    error,
  };
}
