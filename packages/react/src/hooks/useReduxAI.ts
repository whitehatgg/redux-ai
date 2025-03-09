import { useCallback, useState } from 'react';
import { createReduxAIState } from '@redux-ai/state';

import { useReduxAIContext } from '../components/ReduxAIProvider';

export interface AIResponse {
  message: string;
  action: Record<string, unknown> | null;
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
          throw new Error('Vector storage not initialized');
        }

        const state = createReduxAIState({
          store,
          actions,
          storage,
          endpoint,
          onError: error => {
            console.error('[ReduxAI]:', error);
            if (error instanceof Error) {
              setError(error.message);
            }
          },
        });

        // eslint-disable-next-line no-useless-catch
        try {
          return await state.processQuery(query);
        } catch (error) {
          throw error;
        }
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