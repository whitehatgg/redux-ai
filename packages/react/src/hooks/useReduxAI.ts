import { useCallback, useState } from 'react';
import { useSelector } from '@xstate/react';
import { useReduxAIContext } from '../components/ReduxAIProvider';

export interface AIResponse {
  message: string;
  action: Record<string, unknown> | null;
}

export function useReduxAI() {
  const { aiState, machineService } = useReduxAIContext();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use XState selector to track messages with proper undefined handling
  const messages = useSelector(
    machineService,
    (state) => state?.context?.messages ?? [],
    (a, b) => a === b
  );

  const sendQuery = useCallback(
    async (query: string): Promise<AIResponse> => {
      if (!aiState) {
        throw new Error('ReduxAI state not initialized');
      }

      setIsProcessing(true);
      setError(null);

      try {
        return await aiState.processQuery(query);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        }
        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    [aiState]
  );

  return {
    sendQuery,
    isProcessing,
    error,
    messages,
  };
}