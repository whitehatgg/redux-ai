import { useEffect, useState } from 'react';
import type { VectorEntry } from '@redux-ai/vector';

import { useReduxAIContext } from '../components/ReduxAIProvider';

export interface ActivityEntry {
  id: string;
  metadata: {
    query: string;
    response: string;
    timestamp: number;
  };
}

function convertToActivityEntry(entry: VectorEntry): ActivityEntry {
  return {
    id: entry.id,
    metadata: {
      query: String(entry.metadata.query || ''),
      response: String(entry.metadata.response || ''),
      timestamp: Number(entry.metadata.timestamp || Date.now()),
    },
  };
}

export function useActivityLog() {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { storage: vectorStorage } = useReduxAIContext();

  useEffect(() => {
    if (!vectorStorage) {
      return;
    }

    let isMounted = true;

    const loadEntries = async () => {
      try {
        setIsLoading(true);
        const data = await vectorStorage.getAllEntries();
        if (isMounted) {
          const convertedData = data.map(convertToActivityEntry);
          setEntries(convertedData);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to load activity log');
          console.error('[ActivityLog] Error loading entries:', err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    const unsubscribe = vectorStorage.subscribe((newEntry: VectorEntry) => {
      if (isMounted) {
        const convertedEntry = convertToActivityEntry(newEntry);
        setEntries(prev => [...prev, convertedEntry]);
      }
    });

    loadEntries();

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [vectorStorage]);

  return {
    entries,
    isLoading,
    error,
  };
}
