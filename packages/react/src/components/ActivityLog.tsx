import React from 'react';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import { useReduxAIContext } from './ReduxAIProvider';
import { X } from 'lucide-react';

interface ActivityLogProps {
  open?: boolean;
  onClose?: () => void;
}

export const ActivityLog: React.FC<ActivityLogProps> = ({ open, onClose }) => {
  const { stateChanges } = useReduxAIContext();
  console.log('ActivityLog - Current state changes:', stateChanges);

  if (!open) return null;

  // Format action in a generic way
  const formatAction = (action: any) => {
    if (!action) return 'No action';
    if (action.type === '@@redux/INIT') return 'Redux Initialized';
    return `${action.type}${action.payload ? `: ${JSON.stringify(action.payload)}` : ''}`;
  };

  // Only show AI actions and initialization
  const filteredChanges = stateChanges.filter(change => 
    change.trigger === 'ai' || change.action?.type === '@@redux/INIT'
  );

  console.log('ActivityLog - Filtered changes:', filteredChanges);

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
            {filteredChanges && filteredChanges.length > 0 ? (
              filteredChanges.map((change, index) => (
                <div 
                  key={index} 
                  className={`rounded-lg p-4 ${
                    change.trigger === 'ai' ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-muted'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          change.trigger === 'ai'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
                        }`}>
                          {change.trigger === 'ai' ? 'AI Triggered' : 'System Initialized'}
                        </span>
                        <p className="text-sm font-medium">
                          {formatAction(change.action)}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(change.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {change.state && (
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground overflow-hidden text-ellipsis">
                        State: {JSON.stringify(change.state, null, 2)}
                      </p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No AI activity recorded yet. Try interacting with the AI assistant.
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