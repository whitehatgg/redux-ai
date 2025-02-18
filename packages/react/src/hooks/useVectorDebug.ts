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
      try {
        setIsLoading(true);
        const reduxAI = getReduxAI();

        // Fetch all recent interactions
        const data = await reduxAI.getSimilarInteractions('', 50);
        console.log('Raw vector entries:', data);

        if (!Array.isArray(data)) {
          console.error('Expected array of entries but got:', typeof data);
          setError('Invalid data format received');
          return;
        }

        // Sort entries by timestamp
        const sortedEntries = data.sort((a, b) => {
          const timestampA = JSON.parse(a.text).timestamp;
          const timestampB = JSON.parse(b.text).timestamp;
          return new Date(timestampB).getTime() - new Date(timestampA).getTime();
        });

        setEntries(sortedEntries);
        setError(null);
      } catch (error) {
        console.error('Error in fetchEntries:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch entries');
        setEntries([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEntries();
    const interval = setInterval(fetchEntries, 2000);

    return () => clearInterval(interval);
  }, [isInitialized]);

  return { entries, isLoading, error };
}