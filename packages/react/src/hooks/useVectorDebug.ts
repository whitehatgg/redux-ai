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
        const reduxAI = getReduxAI();
        console.log('Got ReduxAI instance');

        // Fetch all state changes and interactions
        const data = await reduxAI.getSimilarInteractions('', 100);
        console.log('Retrieved vector entries:', data);

        // Process and format the entries
        const formattedEntries = data.map(entry => {
          try {
            const state = JSON.parse(entry.state);
            return {
              ...entry,
              state: state.state || state,
              action: state.action?.type || null,
              timestamp: state.timestamp || new Date().toISOString()
            };
          } catch (e) {
            return entry;
          }
        });

        setEntries(formattedEntries.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ));
        setError(null);
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
    const interval = setInterval(fetchEntries, 2000);

    return () => {
      console.log('Cleaning up vector debug polling');
      clearInterval(interval);
    };
  }, [isInitialized]);

  return { entries, isLoading, error };
}