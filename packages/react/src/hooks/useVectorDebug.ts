import { useState, useEffect } from 'react';
import type { VectorEntry } from '@redux-ai/vector';
import { getReduxAI } from '@redux-ai/state';
import { useReduxAIContext } from '../components/ReduxAIProvider';

export function useVectorDebug() {
  const [entries, setEntries] = useState<VectorEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isInitialized } = useReduxAIContext();

  useEffect(() => {
    if (!isInitialized) {
      console.log('ReduxAI not initialized yet, skipping vector debug fetch');
      return;
    }

    const fetchEntries = async () => {
      console.log('Fetching vector storage entries...');
      try {
        const reduxAI = getReduxAI();
        console.log('Got ReduxAI instance');

        const data = await reduxAI.getSimilarInteractions('', 100);
        console.log('Retrieved vector entries:', data);

        setEntries(Array.isArray(data) ? data : []);
        setError(null);
        console.log('Updated entries state with:', Array.isArray(data) ? data.length : 0, 'items');
      } catch (err) {
        console.error('Error fetching debug entries:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch debug entries');
        setEntries([]);
      } finally {
        setIsLoading(false);
      }
    };

    console.log('Setting up vector debug polling...');
    fetchEntries();
    const interval = setInterval(fetchEntries, 5000);

    return () => {
      console.log('Cleaning up vector debug polling');
      clearInterval(interval);
    };
  }, [isInitialized]);

  return { entries, isLoading, error };
}