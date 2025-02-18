import React from 'react';
import { useVectorDebug } from '../hooks/useVectorDebug';
import type { VectorEntry } from '@redux-ai/vector';

interface VectorDebuggerProps {
  className?: string;
}

export const VectorDebugger: React.FC<VectorDebuggerProps> = ({ className }) => {
  const { entries = [], isLoading, error } = useVectorDebug();

  if (isLoading) {
    return (
      <div className={`w-full max-w-2xl mx-auto rounded-lg border bg-card p-6 ${className || ''}`}>
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
      <div className={`w-full max-w-2xl mx-auto rounded-lg border bg-destructive/10 p-6 ${className || ''}`}>
        <div className="flex items-center justify-center p-4 text-destructive">
          Error loading activity log: {error}
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-2xl mx-auto rounded-lg border bg-card p-6 ${className || ''}`}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Activity Log</h2>
          <span className="text-sm text-muted-foreground">
            {entries.length} events recorded
          </span>
        </div>

        <div className="space-y-4 max-h-[500px] overflow-y-auto">
          {entries && entries.length > 0 ? (
            entries.map((entry: VectorEntry, index: number) => {
              try {
                const data = JSON.parse(entry.state);
                return (
                  <div 
                    key={`${data.timestamp}-${index}`} 
                    className="p-4 border rounded-md space-y-2 hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium">
                        {data.type === 'STATE_CHANGE' ? (
                          <>Action: {data.action.type}</>
                        ) : (
                          <>Query: {data.query || 'Unknown query'}</>
                        )}
                      </div>
                      <time className="text-xs text-muted-foreground">
                        {new Date(data.timestamp).toLocaleTimeString()}
                      </time>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      {data.state && JSON.stringify(data.state, null, 2)}
                    </div>

                    {data.response && (
                      <div className="text-sm mt-2">{data.response}</div>
                    )}
                  </div>
                );
              } catch (error) {
                console.error('Error rendering entry:', error, entry);
                return null;
              }
            }).filter(Boolean)
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No activity recorded yet. Try interacting with the table or AI assistant.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};