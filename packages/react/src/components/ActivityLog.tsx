import React from 'react';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import { useReduxAIContext } from './ReduxAIProvider';
import { X } from 'lucide-react';

interface ActivityLogProps {
  open?: boolean;
  onClose?: () => void;
}

export const ActivityLog: React.FC<ActivityLogProps> = ({ open, onClose }) => {
  const { availableActions } = useReduxAIContext();

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
            {availableActions && availableActions.length > 0 ? (
              availableActions.map((action, index) => (
                <div 
                  key={index} 
                  className="rounded-lg p-4 bg-muted"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{action.type}</h4>
                      <span className="text-xs text-muted-foreground">
                        {new Date().toLocaleString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: true,
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {action.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        Activity: {action.type}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        State: Active
                      </span>
                      {action.keywords.map((keyword, idx) => (
                        <span 
                          key={idx}
                          className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                        >
                          Query: {keyword}
                        </span>
                      ))}
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