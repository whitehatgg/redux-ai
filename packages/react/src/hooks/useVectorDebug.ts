import { useState, useEffect } from 'react';
import { IndexedDBStorage } from '@redux-ai/vector/dist/indexeddb';

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

  useEffect(() => {
    const fetchDebugEntries = async () => {
      try {
        console.log('Initializing IndexedDB storage...');
        const storage = new IndexedDBStorage();
        await storage.initialize();

        console.log('Fetching entries from IndexedDB...');
        const data = await storage.getAllEntries();
        console.log('Retrieved entries:', data);

        if (!Array.isArray(data)) {
          throw new Error('Invalid data format: expected array of entries');
        }

        setEntries(data);
      } catch (err) {
        console.error('Error in useVectorDebug:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch debug entries');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDebugEntries();
    // Set up polling every 5 seconds to keep debug view updated
    const interval = setInterval(fetchDebugEntries, 5000);
    return () => clearInterval(interval);
  }, []);

  return { entries, isLoading, error };
}