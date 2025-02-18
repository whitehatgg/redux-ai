import React from 'react';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import { X } from 'lucide-react';
import { useStore } from 'react-redux';
import type { AnyAction } from '@reduxjs/toolkit';

interface ActivityEntry {
  type: string;
  timestamp: string;
  state: any;
  response?: string;
}

interface ActivityLogProps {
  open?: boolean;
  onClose?: () => void;
}

interface ExtendedStore {
  getState: () => any;
  subscribe: (listener: () => void) => () => void;
  lastAction?: AnyAction & {
    timestamp?: string;
    response?: string;
  };
}

export const ActivityLog: React.FC<ActivityLogProps> = ({ open, onClose }) => {
  const store = useStore() as ExtendedStore;
  const [entries, setEntries] = React.useState<ActivityEntry[]>([]);

  React.useEffect(() => {
    let mounted = true;
    console.log('ActivityLog: Setting up store subscription');

    const unsubscribe = store.subscribe(() => {
      if (!mounted) return;

      const lastAction = store.lastAction;
      console.log('ActivityLog: Store updated, lastAction:', lastAction);

      if (lastAction?.type) {
        console.log('ActivityLog: New action detected:', lastAction);

        // Only add entries for vector operations or errors
        if (lastAction.type.startsWith('vector/') || lastAction.type === '__VECTOR_ERROR__') {
          console.log('ActivityLog: Adding new vector entry:', lastAction);
          setEntries(prev => [...prev, {
            type: lastAction.type,
            timestamp: lastAction.timestamp || new Date().toISOString(),
            state: store.getState(),
            response: lastAction.response
          }]);
        }
      }
    });

    return () => {
      console.log('ActivityLog: Cleaning up store subscription');
      mounted = false;
      unsubscribe();
    };
  }, [store]);

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
                  key={index} 
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
                      {entry.response && (
                        <div className="text-sm">
                          <span className="font-medium">Details: </span>
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