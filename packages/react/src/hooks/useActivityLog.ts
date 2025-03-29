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
    // Side effect tracking removed
  };
}

function convertToActivityEntry(entry: VectorEntry): ActivityEntry {
  const metadata = entry.metadata;

  return {
    id: entry.id,
    metadata: {
      intent: metadata.intent,
      action: metadata.action,
      query: metadata.query || '',
      response: metadata.response || '',
      reasoning: metadata.reasoning || [],
      timestamp: metadata.timestamp,
      // Side effects tracking removed as requested
    },
  };
}

export function useActivityLog() {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { storage: vectorStorage } = useReduxAIContext();

  // This effect handles both initial loading and subscription to new entries
  // The vectorStorage dependency is sufficient as it's the only external dependency
  // that affects the functionality of this hook
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

    // Subscription is tied to vectorStorage lifecycle
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
  }, [vectorStorage]); // vectorStorage is the only required dependency

  return {
    entries,
    isLoading,
    error,
  };
}