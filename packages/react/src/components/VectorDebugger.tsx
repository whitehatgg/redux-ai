import React from 'react';
import { useSelector } from 'react-redux';
import { useReduxAI } from '../hooks/useReduxAI';

interface DebugEntry {
  query: string;
  response: string;
  state: string;
  timestamp: string;
}

interface RootState {
  demo: {
    counter: number;
  };
}

export const VectorDebugger: React.FC = () => {
  const [debugEntries, setDebugEntries] = React.useState<DebugEntry[]>([]);
  const counter = useSelector((state: RootState) => state.demo.counter);
  const { ragResults, isInitialized } = useReduxAI();

  React.useEffect(() => {
    // Skip if not initialized
    if (!isInitialized) {
      return;
    }

    // Safely check for ragResults and similarDocs
    if (!ragResults || !Array.isArray(ragResults.similarDocs)) {
      return;
    }

    // Get the first document if it exists
    const doc = ragResults.similarDocs[0];
    if (!doc) {
      return;
    }

    // Create new entry with safe fallbacks
    const newEntry: DebugEntry = {
      query: doc.query ?? 'No query available',
      response: doc.response ?? 'No response available',
      state: doc.state ?? '{}',
      timestamp: doc.timestamp ?? new Date().toISOString()
    };

    setDebugEntries(prev => [newEntry, ...prev].slice(0, 10));
  }, [ragResults, isInitialized]);

  // Show loading state
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center p-4 text-muted-foreground">
        <div className="animate-pulse">Initializing vector storage...</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto rounded-lg border bg-card p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">State Debugger</h2>
          <div className="text-sm text-muted-foreground">
            Counter: {counter}
          </div>
        </div>

        <div className="space-y-4 max-h-[500px] overflow-y-auto">
          {debugEntries && debugEntries.length > 0 ? (
            debugEntries.map((entry, index) => (
              <div 
                key={`${entry.timestamp}-${index}`} 
                className="p-4 border rounded-md space-y-2 hover:bg-accent/5 transition-colors"
              >
                <div className="font-medium">
                  Query: {entry.query}
                </div>
                <div className="text-sm text-muted-foreground">
                  Response: {entry.response}
                </div>
                <div className="text-sm">
                  <div className="font-medium mb-1">State:</div>
                  <pre className="bg-muted p-2 rounded-md overflow-x-auto text-xs">
                    {entry.state}
                  </pre>
                </div>
                <time className="text-xs text-muted-foreground">
                  {new Date(entry.timestamp).toLocaleString()}
                </time>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No state changes recorded. Interact with the counter to see debug information.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};