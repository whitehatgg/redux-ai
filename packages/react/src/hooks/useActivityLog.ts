import { useEffect, useState } from 'react';
import type { VectorEntry } from '@redux-ai/vector';

import { useReduxAIContext } from '../components/ReduxAIProvider';

export interface ActivityEntry {
  id: string;
  metadata: {
    intent?: string;
    action?: Record<string, unknown>;
    query?: string;
    response?: string;
    reasoning?: string[];
    timestamp: number;
  };
}

function convertToActivityEntry(entry: VectorEntry): ActivityEntry {
  return {
    id: entry.id,
    metadata: {
      intent: String(entry.metadata.intent || ''),
      action: entry.metadata.action as Record<string, unknown> | undefined,
      query: String(entry.metadata.query || ''),
      response: String(entry.metadata.response || ''),
      reasoning: Array.isArray(entry.metadata.reasoning) ? entry.metadata.reasoning : undefined,
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
          const convertedData = data
            .map(convertToActivityEntry)
            .sort((a, b) => b.metadata.timestamp - a.metadata.timestamp);
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
        setEntries(prev => [convertedEntry, ...prev]);
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