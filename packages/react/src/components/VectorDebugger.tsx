import React from 'react';
import { useSelector } from 'react-redux';
import { useVectorDebug } from '../hooks/useVectorDebug';

interface RootState {
  demo: {
    counter: number;
  };
}

export const VectorDebugger: React.FC = () => {
  const counter = useSelector((state: RootState) => state.demo.counter);
  const { entries, isLoading, error } = useVectorDebug();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4 text-muted-foreground">
        <div className="animate-pulse">
          Initializing vector storage...
        </div>
      </div>
    );
  }

  // Show error state if any
  if (error) {
    return (
      <div className="flex items-center justify-center p-4 text-destructive">
        <div>Error: {error}</div>
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
          {entries.length > 0 ? (
            entries.map((entry, index) => (
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