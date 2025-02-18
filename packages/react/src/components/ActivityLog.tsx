import React from 'react';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import { useReduxAIContext } from './ReduxAIProvider';  // Changed from useReduxAI
import { X } from 'lucide-react';

interface ActivityLogProps {
  open?: boolean;
  onClose?: () => void;
}

export const ActivityLog: React.FC<ActivityLogProps> = ({ open, onClose }) => {
  const { stateChanges } = useReduxAIContext();  // Use context directly

  if (!open) return null;

  const formatActionType = (action: any) => {
    if (!action) return 'No action';
    if (action?.type === 'applicant/setSearchTerm') {
      return `Search for: ${action.payload}`;
    }
    return action?.type || 'Unknown action';
  };

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-background border-l shadow-lg z-50">
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
            {stateChanges && stateChanges.length > 0 ? (
              stateChanges.map((change, index) => (
                <div key={index} className="bg-muted rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {formatActionType(change.action)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(change.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {change.action?.payload && (
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground">
                        Payload: {JSON.stringify(change.action.payload)}
                      </p>
                    </div>
                  )}
                  {change.state && (
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground">
                        State: {JSON.stringify(change.state, null, 2)}
                      </p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No activity recorded yet. Try interacting with the table or AI assistant.
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