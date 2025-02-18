import React from 'react';
import { useVectorDebug } from '../hooks/useVectorDebug';
import type { VectorEntry } from '@redux-ai/vector';

export const VectorDebugger: React.FC = () => {
  const { entries = [], isLoading, error } = useVectorDebug();

  if (isLoading) {
    return (
      <div className="w-full max-w-2xl mx-auto rounded-lg border bg-card p-6">
        <div className="flex items-center justify-center p-4">
          <div className="animate-pulse text-muted-foreground">
            Loading activity log...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-2xl mx-auto rounded-lg border bg-destructive/10 p-6">
        <div className="flex items-center justify-center p-4 text-destructive">
          Error loading activity log: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto rounded-lg border bg-card p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Activity Log</h2>
          <span className="text-sm text-muted-foreground">
            {entries.length} events recorded
          </span>
        </div>

        <div className="space-y-4 max-h-[500px] overflow-y-auto">
          {entries && entries.length > 0 ? (
            entries.map((entry: any, index: number) => {
              const { parsedState, type } = entry;

              if (!parsedState) {
                console.warn('Entry has no parsed state:', entry);
                return null;
              }

              return (
                <div 
                  key={`${entry.timestamp}-${index}`} 
                  className="p-4 border rounded-md space-y-2 hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium">
                      {type === 'STATE_CHANGE' ? (
                        <>Action: {parsedState.action?.type}</>
                      ) : (
                        <>Query: {parsedState.query}</>
                      )}
                    </div>
                    <time className="text-xs text-muted-foreground">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </time>
                  </div>

                  {parsedState.state && (
                    <div className="text-sm text-muted-foreground">
                      Counter: {parsedState.state.counter}
                      {parsedState.state.message && (
                        <span className="ml-2">| Message: {parsedState.state.message}</span>
                      )}
                    </div>
                  )}

                  {parsedState.response && (
                    <div className="text-sm mt-2">{parsedState.response}</div>
                  )}
                </div>
              );
            }).filter(Boolean)
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No activity recorded yet. Try interacting with the counter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};