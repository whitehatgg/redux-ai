import { useState, useEffect } from 'react';
import { IndexedDBStorage } from '@redux-ai/vector/src/indexeddb';

interface DebugEntry {
  query: string;
  response: string;
  state: string;
  timestamp: string;
}

export function useVectorDebug() {
  const [entries, setEntries] = useState<DebugEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storage] = useState(() => new IndexedDBStorage());

  useEffect(() => {
    const fetchDebugEntries = async () => {
      try {
        if (!storage.db) {
          await storage.initialize();
        }

        const data = await storage.getAllEntries();
        if (!Array.isArray(data)) {
          throw new Error('Invalid data format');
        }

        setEntries(data as DebugEntry[]);
        setError(null);
      } catch (err) {
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
  }, [storage]);

  return { entries, isLoading, error };
}