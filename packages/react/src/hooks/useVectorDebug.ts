import { useState, useEffect } from 'react';
import type { VectorEntry } from '@redux-ai/vector';
import { useReduxAIContext } from '../components/ReduxAIProvider';

export function useVectorDebug() {
  const [entries, setEntries] = useState<VectorEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { availableActions, vectorStorage, isInitialized, error: contextError } = useReduxAIContext();

  useEffect(() => {
    if (!isInitialized) {
      setIsLoading(false);
      return;
    }

    async function fetchEntries() {
      if (!vectorStorage) {
        setError('Vector storage not initialized');
        setIsLoading(false);
        return;
      }

      try {
        console.log('[VectorDebug] Fetching entries...');
        const vectorEntries = await vectorStorage.getAllEntries();
        setEntries(vectorEntries);
        setError(null);
      } catch (err) {
        console.error('[VectorDebug] Error fetching entries:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch vector entries');
      } finally {
        setIsLoading(false);
      }
    }

    fetchEntries();
  }, [vectorStorage, isInitialized]);

  return { 
    entries, 
    isLoading, 
    error: error || contextError, 
    isInitialized,
    availableActions 
  };
}