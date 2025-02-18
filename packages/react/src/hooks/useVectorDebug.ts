import { useState, useEffect } from 'react';
import type { VectorEntry } from '@redux-ai/vector';
import { createReduxAIVector } from '@redux-ai/vector';

export function useVectorDebug() {
  const [entries, setEntries] = useState<VectorEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vectorInstance, setVectorInstance] = useState<Awaited<ReturnType<typeof createReduxAIVector>> | null>(null);

  useEffect(() => {
    const initVectorAndFetch = async () => {
      try {
        const instance = await createReduxAIVector();
        setVectorInstance(instance);
        const data = await instance.getAllEntries();
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

    initVectorAndFetch();
    const interval = setInterval(initVectorAndFetch, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return { entries, isLoading, error, vectorInstance };
}