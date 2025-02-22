import { useCallback, useState } from 'react';
import { generateSystemPrompt } from '@redux-ai/state';
import type { VectorEntry } from '@redux-ai/vector';

import { useReduxAIContext } from '../components/ReduxAIProvider';

export function useReduxAI() {
  const { store, actions, vectorStorage } = useReduxAIContext();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendQuery = useCallback(
    async (query: string): Promise<string> => {
      setIsProcessing(true);
      setError(null);

      try {
        let conversationHistory = '';
        if (vectorStorage) {
          try {
            const similarEntries = await vectorStorage.retrieveSimilar(query, 3);
            conversationHistory = similarEntries
              .map(
                (entry: VectorEntry) =>
                  `User: ${entry.metadata.query}\nAssistant: ${entry.metadata.response}`
              )
              .join('\n\n');
          } catch (err) {
            console.warn('[useReduxAI] Failed to retrieve conversation history:', err);
          }
        }

        const state = store.getState();
        const systemPrompt = generateSystemPrompt(state, actions, conversationHistory);

        const response = await fetch('/api/query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query,
            prompt: systemPrompt,
            actions,
            currentState: state,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `API request failed: ${response.status}`);
        }

        const data = await response.json();

        if (data.action) {
          store.dispatch(data.action);
        }

        // Store the interaction in vector storage if available
        if (vectorStorage && data.message) {
          try {
            await vectorStorage.storeInteraction(query, data.message, state);
          } catch (err) {
            console.warn('[useReduxAI] Failed to store interaction:', err);
          }
        }

        return data.message;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        setError(errorMessage);
        throw error;
      } finally {
        setIsProcessing(false);
      }
    },
    [store, actions, vectorStorage]
  );

  return {
    sendQuery,
    isProcessing,
    error,
  };
}
