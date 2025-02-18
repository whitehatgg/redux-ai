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

        // Fetch recent state changes and interactions
        const data = await reduxAI.getSimilarInteractions('', 100);
        console.log('Retrieved vector entries:', data);

        const formattedEntries = data
          .map(entry => {
            try {
              if (!entry.state) {
                console.warn('Entry has no state:', entry);
                return null;
              }

              const parsed = JSON.parse(entry.state);
              console.log('Processing entry:', parsed);

              return {
                ...entry,
                parsedState: parsed,
                timestamp: parsed.timestamp,
                type: parsed.type || 'UNKNOWN',
                action: parsed.action || null,
                query: parsed.query || null,
                response: parsed.response || null
              };
            } catch (e) {
              console.error('Error parsing entry:', e, entry);
              return null;
            }
          })
          .filter(Boolean)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        console.log('Formatted entries:', formattedEntries);
        setEntries(formattedEntries);
        setError(null);
      } catch (err) {
        console.error('Error fetching debug entries:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch debug entries');
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