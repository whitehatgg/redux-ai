import React, { useRef } from 'react';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import { X } from 'lucide-react';
import { useReduxAIContext } from './ReduxAIProvider';
import type { VectorEntry } from '@redux-ai/vector';

interface ActivityLogEntry {
  type: string;
  timestamp: string;
  query?: string;
  response?: string;
}

interface ActivityLogProps {
  open?: boolean;
  onClose?: () => void;
}

export const ActivityLog: React.FC<ActivityLogProps> = ({ open, onClose }) => {
  const { vectorStorage } = useReduxAIContext();
  const [entries, setEntries] = React.useState<ActivityLogEntry[]>([]);
  const subscriptionRef = useRef<(() => void) | null>(null);
  const entriesRef = useRef<ActivityLogEntry[]>([]);

  React.useEffect(() => {
    entriesRef.current = entries;
  }, [entries]);

  React.useEffect(() => {
    if (!vectorStorage || subscriptionRef.current) return;

    console.log('ActivityLog: Initial setup of vector storage subscription');

    const unsubscribe = vectorStorage.subscribe((entry: VectorEntry) => {
      console.log('ActivityLog: Processing vector entry:', {
        content: entry.content,
        metadata: entry.metadata?.type,
        operationId: entry.metadata?.operationId
      });

      // Skip if we already have this entry (check by timestamp)
      if (entriesRef.current.some(e => e.timestamp === entry.timestamp)) {
        console.log('ActivityLog: Skipping duplicate entry');
        return;
      }

      const newEntry: ActivityLogEntry = {
        type: entry.metadata?.type === 'interaction' ? 'vector/store' : 'vector/add',
        timestamp: entry.timestamp,
        query: entry.query,
        response: entry.response
      };

      setEntries(prev => {
        console.log('ActivityLog: Adding new entry, current count:', prev.length);
        return [...prev, newEntry];
      });
    });

    subscriptionRef.current = unsubscribe;

    return () => {
      console.log('ActivityLog: Cleaning up subscription');
      if (subscriptionRef.current) {
        subscriptionRef.current();
        subscriptionRef.current = null;
      }
    };
  }, [vectorStorage]);

  if (!open) return null;

  return (
    <div className="fixed inset-y-0 left-0 w-80 bg-background border-r shadow-lg z-50">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">Vector Activity Log</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-muted rounded-md"
          title="Close Activity Log"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <ScrollArea.Root className="h-[calc(100vh-5rem)]">
        <ScrollArea.Viewport className="h-full w-full">
          <div className="p-4 space-y-4">
            {entries.length > 0 ? (
              entries.map((entry, index) => (
                <div 
                  key={`${entry.type}-${entry.timestamp}-${index}`}
                  className="rounded-lg p-4 bg-muted"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">Operation: {entry.type}</h4>
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {entry.query && (
                        <div className="text-sm">
                          <span className="font-medium">Query: </span>
                          <span className="text-muted-foreground">{entry.query}</span>
                        </div>
                      )}
                      {entry.response && (
                        <div className="text-sm">
                          <span className="font-medium">Response: </span>
                          <span className="text-muted-foreground">{entry.response}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No vector operations logged yet.
              </div>
            )}
          </div>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar
          className="flex select-none touch-none p-0.5 bg-muted transition-colors hover:bg-muted/80"
          orientation="vertical"
        >
          <ScrollArea.Thumb className="relative flex-1 rounded-full bg-border" />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>
    </div>
  );
};