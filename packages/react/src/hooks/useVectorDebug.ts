import { useState, useEffect } from 'react';

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
        const response = await fetch('/api/vector/debug');
        if (!response.ok) {
          throw new Error('Failed to fetch vector debug entries');
        }
        const data = await response.json();
        setEntries(data);
      } catch (err) {
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
