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
        if (!storage) {
          throw new Error('Storage not initialized');
        }

        // Initialize if not already done
        if (!storage.db) {
          console.log('Initializing IndexedDB storage...');
          await storage.initialize();
          console.log('IndexedDB storage initialized successfully');
        }

        console.log('Fetching entries from IndexedDB...');
        const data = await storage.getAllEntries();
        console.log('Raw data from IndexedDB:', data);

        // Validate data structure
        if (!Array.isArray(data)) {
          throw new Error(`Invalid data format: expected array but got ${typeof data}`);
        }

        // Validate each entry
        const validatedData = data.map((entry, index) => {
          if (!entry || typeof entry !== 'object') {
            throw new Error(`Invalid entry at index ${index}: ${JSON.stringify(entry)}`);
          }

          if (!('query' in entry && 'response' in entry && 'state' in entry && 'timestamp' in entry)) {
            throw new Error(`Missing required fields in entry at index ${index}`);
          }

          return entry as DebugEntry;
        });

        setEntries(validatedData);
        setError(null);
      } catch (err) {
        console.error('Detailed error in useVectorDebug:', err);
        let errorMessage = 'Failed to fetch debug entries';

        if (err instanceof Error) {
          errorMessage += `: ${err.message}`;
          console.error('Error stack:', err.stack);
        } else {
          errorMessage += `: Unknown error type: ${err}`;
        }

        setError(errorMessage);
        setEntries([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchDebugEntries();

    // Poll for updates every 5 seconds
    const interval = setInterval(fetchDebugEntries, 5000);

    // Cleanup
    return () => {
      clearInterval(interval);
    };
  }, [storage]);

  return { entries, isLoading, error };
}