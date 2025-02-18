import React from 'react';
import { useSelector } from 'react-redux';
import { useReduxAI } from '../hooks/useReduxAI';

interface DebugEntry {
  query: string;
  response: string;
  state: string;
  timestamp: string;
}

export const VectorDebugger: React.FC = () => {
  const [entries, setEntries] = React.useState<DebugEntry[]>([]);
  const counter = useSelector((state: any) => state.demo.counter);
  const { ragResults } = useReduxAI();

  React.useEffect(() => {
    if (ragResults && Array.isArray(ragResults.similarDocs) && ragResults.similarDocs.length > 0) {
      const newEntry: DebugEntry = {
        query: ragResults.similarDocs[0]?.query || 'No query',
        response: ragResults.similarDocs[0]?.response || 'No response',
        state: ragResults.similarDocs[0]?.state || '{}',
        timestamp: new Date().toISOString()
      };
      setEntries(prev => [newEntry, ...prev]);
    }
  }, [ragResults]);

  return (
    <div className="w-full max-w-2xl mx-auto rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="p-6">
        <h2 className="text-2xl font-semibold mb-4">State Debug Info</h2>
        <div className="mb-4 p-4 border rounded">
          <div className="font-semibold">Current Counter: {counter}</div>
        </div>
        <div className="h-[400px] overflow-auto">
          {entries && entries.length > 0 ? (
            entries.map((entry, index) => (
              <div key={index} className="mb-6 p-4 border rounded">
                <div className="font-semibold mb-2">
                  Query: {entry.query}
                </div>
                <div className="text-muted-foreground mb-2">
                  Response: {entry.response}
                </div>
                <div className="text-sm text-muted-foreground">
                  State: <pre className="mt-2 p-2 bg-muted rounded overflow-x-auto">{entry.state}</pre>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  {new Date(entry.timestamp).toLocaleString()}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground">
              No state changes recorded yet. Try interacting with the counter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};