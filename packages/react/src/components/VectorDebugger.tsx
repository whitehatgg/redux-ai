import React from 'react';

interface DebugEntry {
  query: string;
  response: string;
  state: string;
  timestamp: string;
}

export const VectorDebugger: React.FC<{
  entries: DebugEntry[];
}> = ({ entries }) => {
  return (
    <div className="w-full max-w-2xl mx-auto rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Vector Memory Debug</h2>
        <div className="h-[500px] overflow-auto">
          {entries.map((entry, index) => (
            <div key={index} className="mb-6 p-4 border rounded">
              <div className="font-semibold mb-2">
                Query: {entry.query}
              </div>
              <div className="text-muted-foreground mb-2">
                Response: {entry.response}
              </div>
              <div className="text-sm text-muted-foreground">
                State: {entry.state}
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                {new Date(entry.timestamp).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};