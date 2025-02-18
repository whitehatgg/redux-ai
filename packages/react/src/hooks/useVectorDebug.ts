import { useState, useEffect } from 'react';
import type { VectorEntry } from '@redux-ai/vector';
import { createReduxAIVector } from '@redux-ai/vector';

export function useVectorDebug() {
  const [entries, setEntries] = useState<VectorEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDebugEntries = async () => {
      try {
        const vectorInstance = await createReduxAIVector();
        const data = await vectorInstance.getAllEntries();

        setEntries(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        console.error('Error fetching debug entries:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch debug entries');
        setEntries([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDebugEntries();
    const interval = setInterval(fetchDebugEntries, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return { entries, isLoading, error };
}