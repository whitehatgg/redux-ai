import React from 'react';
import { useVectorDebug } from '../hooks/useVectorDebug';
import type { VectorEntry } from '@redux-ai/vector';

export const VectorDebugger: React.FC = () => {
  const { entries = [], isLoading, error } = useVectorDebug();

  // Show loading state
  if (isLoading) {
    return (
      <div className="w-full max-w-2xl mx-auto rounded-lg border bg-card p-6">
        <div className="flex items-center justify-center p-4">
          <div className="animate-pulse text-muted-foreground">
            Loading state history...
          </div>
        </div>
      </div>
    );
  }

  // Show error state if any
  if (error) {
    return (
      <div className="w-full max-w-2xl mx-auto rounded-lg border bg-destructive/10 p-6">
        <div className="flex items-center justify-center p-4 text-destructive">
          Error loading state history: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto rounded-lg border bg-card p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">State History</h2>
          <span className="text-sm text-muted-foreground">
            {entries.length} entries
          </span>
        </div>

        <div className="space-y-4 max-h-[500px] overflow-y-auto">
          {entries && entries.length > 0 ? (
            entries.map((entry: VectorEntry, index: number) => (
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
                {entry.state && (
                  <div className="text-sm">
                    <div className="font-medium mb-1">State:</div>
                    <pre className="bg-muted p-2 rounded-md overflow-x-auto text-xs">
                      {typeof entry.state === 'string' ? entry.state : JSON.stringify(entry.state, null, 2)}
                    </pre>
                  </div>
                )}
                <time className="text-xs text-muted-foreground">
                  {new Date(entry.timestamp).toLocaleString()}
                </time>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No state changes recorded yet. Try interacting with the application.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};