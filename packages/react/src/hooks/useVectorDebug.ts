import { useState, useCallback, useEffect } from 'react';
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
        console.log('Fetching vector entries...');

        // Fetch recent state changes and interactions
        const data = await reduxAI.getSimilarInteractions('', 100);
        console.log('Raw vector entries:', data);

        if (!Array.isArray(data)) {
          console.error('Expected array of entries but got:', typeof data);
          setError('Invalid data format received');
          return;
        }

        const formattedEntries = data
          .map(entry => {
            try {
              if (!entry.state) {
                console.warn('Entry missing state:', entry);
                return null;
              }

              const parsed = JSON.parse(entry.state);
              console.log('Successfully parsed entry:', parsed);

              return {
                ...entry,
                parsedState: parsed,
                timestamp: new Date().toISOString()
              };
            } catch (error) {
              console.error('Failed to parse entry:', error, entry);
              return null;
            }
          })
          .filter(Boolean);

        console.log('Formatted entries:', formattedEntries);
        setEntries(formattedEntries);
        setError(null);
      } catch (error) {
        console.error('Error in fetchEntries:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch vector entries');
        setEntries([]);
      } finally {
        setIsLoading(false);
      }
    };

    console.log('Starting vector debug polling...');
    fetchEntries();
    const interval = setInterval(fetchEntries, 2000);

    return () => clearInterval(interval);
  }, [isInitialized]);

  return { entries, isLoading, error };
}