import React from 'react';
import { useVectorDebug } from '../hooks/useVectorDebug';
import type { VectorEntry } from '@redux-ai/vector';
import { useReduxAIContext } from './ReduxAIProvider';

interface VectorDebuggerProps {
  className?: string;
}

export const VectorDebugger: React.FC<VectorDebuggerProps> = ({ className }) => {
  const { stateChanges } = useReduxAIContext();

  return (
    <div className={`w-full rounded-lg border bg-card ${className || ''}`}>
      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Activity Log</h2>
          <span className="text-sm text-muted-foreground">
            {stateChanges.length} events recorded
          </span>
        </div>

        <div className="space-y-4 max-h-[500px] overflow-y-auto p-4">
          {stateChanges.length > 0 ? (
            stateChanges.map((entry, index) => (
              <div 
                key={`${entry.timestamp}-${index}`} 
                className="p-4 border rounded-md space-y-2 hover:bg-accent/5 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium">
                    Action: {entry.action?.type || 'State Change'}
                  </div>
                  <time className="text-xs text-muted-foreground">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </time>
                </div>

                {entry.action?.payload && (
                  <div className="text-sm text-muted-foreground">
                    <strong>Payload: </strong>
                    {JSON.stringify(entry.action.payload, null, 2)}
                  </div>
                )}

                <div className="text-sm text-muted-foreground">
                  <strong>State: </strong>
                  {JSON.stringify(entry.state.applicant, null, 2)}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No activity recorded yet. Try interacting with the table or AI assistant.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};