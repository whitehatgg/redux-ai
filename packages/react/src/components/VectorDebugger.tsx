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
  const { ragResults, isInitialized } = useReduxAI();

  React.useEffect(() => {
    if (!isInitialized || !ragResults) {
      console.log('Skipping update - not initialized or no results:', { isInitialized, ragResults });
      return;
    }

    console.log('RAG Results updated:', JSON.stringify(ragResults, null, 2));

    // Ensure similarDocs is an array and has items
    if (!Array.isArray(ragResults.similarDocs) || ragResults.similarDocs.length === 0) {
      console.log('No valid similarDocs found');
      return;
    }

    const similarDocs = ragResults.similarDocs;
    console.log('Processed similarDocs:', similarDocs);

    const firstDoc = similarDocs[0];
    if (!firstDoc) {
      console.log('No valid first document found');
      return;
    }

    const newEntry: DebugEntry = {
      query: firstDoc.query || '',
      response: firstDoc.response || '',
      state: firstDoc.state || '',
      timestamp: firstDoc.timestamp || new Date().toISOString()
    };

    console.log('Adding new debug entry:', newEntry);
    setEntries(prevEntries => [newEntry, ...prevEntries]);
  }, [ragResults, isInitialized]);

  if (!isInitialized) {
    return (
      <div className="w-full max-w-2xl mx-auto p-4 text-center">
        Initializing vector storage...
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="p-6">
        <h2 className="text-2xl font-semibold mb-4">State Debug Info</h2>
        <div className="mb-4 p-4 border rounded">
          <div className="font-semibold">Current Counter: {counter}</div>
        </div>
        <div className="h-[400px] overflow-auto">
          {entries.length > 0 ? (
            entries.map((entry, index) => (
              <div key={`${entry.timestamp}-${index}`} className="mb-6 p-4 border rounded">
                <div className="font-semibold mb-2">
                  Query: {entry.query || 'N/A'}
                </div>
                <div className="text-muted-foreground mb-2">
                  Response: {entry.response || 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">
                  State: <pre className="mt-2 p-2 bg-muted rounded overflow-x-auto">{entry.state || '{}'}</pre>
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