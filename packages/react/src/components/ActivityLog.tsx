import React from 'react';
import type { VectorEntry } from '@redux-ai/vector';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import { X } from 'lucide-react';

import { useReduxAIContext } from './ReduxAIProvider';

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

  React.useEffect(() => {
    if (!vectorStorage) return;

    console.debug('ActivityLog: Setting up vector storage subscription');

    const unsubscribe = vectorStorage.subscribe((entry: VectorEntry) => {
      console.debug('ActivityLog: Received vector entry:', entry);

      const metadata = entry.metadata as Record<string, unknown>;
      const newEntry: ActivityLogEntry = {
        type: 'vector/store',
        timestamp: new Date(entry.timestamp).toISOString(),
        query: typeof metadata.query === 'string' ? metadata.query : undefined,
        response: typeof metadata.response === 'string' ? metadata.response : undefined,
      };

      setEntries(prev => [...prev, newEntry]);
    });

    return () => {
      console.debug('ActivityLog: Cleaning up subscription');
      unsubscribe();
    };
  }, [vectorStorage]);

  if (!open) return null;

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-80 border-r bg-background shadow-lg">
      <div className="flex items-center justify-between border-b p-4">
        <h3 className="font-semibold">Vector Activity Log</h3>
        <button
          onClick={onClose}
          className="rounded-md p-1 hover:bg-muted"
          title="Close Activity Log"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <ScrollArea.Root className="h-[calc(100vh-5rem)]">
        <ScrollArea.Viewport className="h-full w-full">
          <div className="space-y-4 p-4">
            {entries.length > 0 ? (
              entries.map((entry, index) => (
                <div
                  key={`${entry.type}-${entry.timestamp}-${index}`}
                  className="rounded-lg bg-muted p-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Operation: {entry.type}</h4>
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
              <div className="py-8 text-center text-muted-foreground">
                No vector operations logged yet.
              </div>
            )}
          </div>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar
          className="flex touch-none select-none bg-muted p-0.5 transition-colors hover:bg-muted/80"
          orientation="vertical"
        >
          <ScrollArea.Thumb className="relative flex-1 rounded-full bg-border" />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>
    </div>
  );
};
