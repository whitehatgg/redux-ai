import React from 'react';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import { useSelector } from 'react-redux';
import { useReduxAI } from '../hooks/useReduxAI';

interface StateChange {
  type: string;
  timestamp: string;
  state: any;
  action?: {
    type: string;
    payload?: any;
  };
}

export const ActivityLog: React.FC = () => {
  const { stateChanges } = useReduxAI();

  return (
    <div className="w-full max-w-3xl rounded-lg border border-border bg-card text-card-foreground shadow">
      <div className="p-6">
        <h3 className="text-2xl font-semibold">Activity Log</h3>
        <p className="text-sm text-muted-foreground">
          View Redux State Changes
        </p>
      </div>
      <div className="p-6 pt-0">
        <ScrollArea.Root className="h-[400px] w-full rounded-md border">
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
    </div>
  );
};