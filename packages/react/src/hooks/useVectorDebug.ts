import { useEffect, useState } from 'react';
import type { VectorEntry } from '@redux-ai/vector';

import { useReduxAIContext } from '../components/ReduxAIProvider';

export function useVectorDebug() {
  const [entries, setEntries] = useState<VectorEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { storage } = useReduxAIContext();

  useEffect(() => {
    async function fetchEntries() {
      if (!storage) {
        setError('Storage not initialized');
        setIsLoading(false);
        return;
      }

      try {
        const vectorEntries = await storage.getAllEntries();
        setEntries(vectorEntries);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch vector entries');
      } finally {
        setIsLoading(false);
      }
    }

    fetchEntries();
  }, [storage]);

  return { entries, isLoading, error };
}
