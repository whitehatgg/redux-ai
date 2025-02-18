import React from 'react';
import { useReduxAIContext } from './ReduxAIProvider';
import type { ReduxAIAction } from '@redux-ai/state';

interface VectorDebuggerProps {
  className?: string;
}

export const VectorDebugger: React.FC<VectorDebuggerProps> = ({ className }) => {
  const { availableActions } = useReduxAIContext();

  return (
    <div className={`w-full rounded-lg border bg-card ${className || ''}`}>
      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Available Actions</h2>
          <span className="text-sm text-muted-foreground">
            {availableActions.length} actions available
          </span>
        </div>

        <div className="space-y-4 max-h-[500px] overflow-y-auto p-4">
          {availableActions.length > 0 ? (
            availableActions.map((action: ReduxAIAction, index: number) => (
              <div 
                key={`${action.type}-${index}`}
                className="p-4 border rounded-md space-y-2 hover:bg-accent/5 transition-colors"
              >
                <div className="font-medium">
                  {action.type}
                </div>
                <p className="text-sm text-muted-foreground">
                  {action.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {action.keywords.map((keyword, idx) => (
                    <span 
                      key={idx}
                      className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No actions available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};