import React from 'react';
import type { ReduxAIAction } from '@redux-ai/state';

import { useVectorDebug } from '../hooks/useVectorDebug';

interface VectorDebuggerProps {
  className?: string;
}

export const VectorDebugger: React.FC<VectorDebuggerProps> = ({ className }) => {
  const { availableActions, isLoading, error } = useVectorDebug();

  if (isLoading) {
    return (
      <div
        className={`w-full rounded-lg border bg-card p-4 ${className || ''}`}
        data-testid="loading-skeleton"
      >
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-1/4 rounded bg-muted"></div>
          <div className="space-y-3">
            <div className="h-20 rounded bg-muted"></div>
            <div className="h-20 rounded bg-muted"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`w-full rounded-lg border bg-card p-4 ${className || ''}`}>
        <div className="text-destructive">
          <h3 className="font-medium">Error loading vector data</h3>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full rounded-lg border bg-card ${className || ''}`}>
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-xl font-semibold">Available Actions</h2>
          <span className="text-sm text-muted-foreground">
            {availableActions.length} actions available
          </span>
        </div>

        <div className="max-h-[500px] space-y-4 overflow-y-auto p-4">
          {availableActions.length > 0 ? (
            availableActions.map((action: ReduxAIAction, index: number) => (
              <div
                key={`${action.type}-${index}`}
                className="space-y-2 rounded-md border p-4 transition-colors hover:bg-accent/5"
              >
                <div className="font-medium">{action.type}</div>
                <p className="text-sm text-muted-foreground">{action.description}</p>
                <div className="flex flex-wrap gap-2">
                  {action.keywords.map((keyword, idx) => (
                    <span
                      key={idx}
                      className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-muted-foreground">No actions available</div>
          )}
        </div>
      </div>
    </div>
  );
};
