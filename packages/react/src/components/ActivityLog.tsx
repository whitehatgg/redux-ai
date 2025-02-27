import React from 'react';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import { X } from 'lucide-react';

import { useActivityLog } from '../hooks/useActivityLog';

interface ActivityLogProps {
  open?: boolean;
  onClose?: () => void;
}

export const ActivityLog: React.FC<ActivityLogProps> = ({ open, onClose }) => {
  const { entries, isLoading, error } = useActivityLog();

  if (!open) return null;

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-80 border-r bg-background shadow-lg">
      <div className="flex items-center justify-between border-b p-4">
        <h3 className="font-semibold">Activity Log</h3>
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
            {isLoading ? (
              <div className="py-8 text-center text-muted-foreground">Loading activity log...</div>
            ) : error ? (
              <div className="py-8 text-center text-destructive">{error}</div>
            ) : entries.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No operations logged yet.
              </div>
            ) : (
              entries.map(entry => (
                <div key={entry.id} className="rounded-lg bg-muted p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Operation: vector/store</h4>
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.metadata.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Query: </span>
                        <span className="text-muted-foreground">{entry.metadata.query}</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Response: </span>
                        <span className="text-muted-foreground">{entry.metadata.response}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
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
