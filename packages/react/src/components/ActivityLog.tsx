import React from 'react';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import { useReduxAI } from '../hooks/useReduxAI';
import { X } from 'lucide-react';

interface ActivityLogProps {
  open?: boolean;
  onClose?: () => void;
}

export const ActivityLog: React.FC<ActivityLogProps> = ({ open, onClose }) => {
  const { stateChanges } = useReduxAI();

  if (!open) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-background border-l shadow-lg transform transition-transform ease-in-out duration-300 z-50">
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
        <ScrollArea.Viewport className="p-4">
          {stateChanges.map((change, index) => (
            <div key={index} className="mb-4 last:mb-0 p-4 bg-muted rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-sm font-medium">
                    Action: {change.action?.type || 'State Change'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(change.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="mt-2">
                <p className="text-sm font-medium">State:</p>
                <pre className="text-xs bg-background p-2 rounded mt-1 overflow-x-auto">
                  {JSON.stringify(change.state, null, 2)}
                </pre>
              </div>
            </div>
          ))}
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar
          className="flex select-none touch-none p-0.5 bg-slate-100 transition-colors hover:bg-slate-200"
          orientation="vertical"
        >
          <ScrollArea.Thumb className="relative flex-1 rounded-full bg-slate-300" />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>
    </div>
  );
};