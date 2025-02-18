import React from 'react';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import { X } from 'lucide-react';
import { useStore } from 'react-redux';

interface ActivityEntry {
  type: string;
  timestamp: string;
  state: any;
  query?: string;
}

interface ActivityLogProps {
  open?: boolean;
  onClose?: () => void;
}

export const ActivityLog: React.FC<ActivityLogProps> = ({ open, onClose }) => {
  const store = useStore();
  const [entries, setEntries] = React.useState<ActivityEntry[]>([]);

  // Subscribe to store changes
  React.useEffect(() => {
    return store.subscribe(() => {
      const lastAction = (store as any).lastAction;
      if (lastAction) {
        setEntries(prev => [...prev, {
          type: lastAction.type,
          timestamp: new Date().toISOString(),
          state: store.getState(),
          query: lastAction.__source === 'ai' ? lastAction.query : undefined
        }]);
      }
    });
  }, [store]);

  if (!open) return null;

  return (
    <div className="fixed inset-y-0 left-0 w-80 bg-background border-r shadow-lg z-50">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">Activity Log</h3>
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
                      <h4 className="font-medium text-sm">Activity: {entry.type}</h4>
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">State: </span>
                        <span className="text-muted-foreground">
                          {JSON.stringify(entry.state).substring(0, 100)}...
                        </span>
                      </div>
                      {entry.query && (
                        <div className="text-sm">
                          <span className="font-medium">Query: </span>
                          <span className="text-muted-foreground">{entry.query}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No activities logged yet.
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