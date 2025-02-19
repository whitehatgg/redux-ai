import React from 'react';

import { useReduxAIContext } from '../components/ReduxAIProvider';

export const AIDebugContainer: React.FC = () => {
  const { availableActions } = useReduxAIContext();
  return availableActions && availableActions.length > 0 ? (
    <div className="mt-4">
      <h3 className="mb-2 text-lg font-semibold">Activity Log</h3>
      <div className="space-y-2">
        {availableActions.map((action, idx) => (
          <div key={idx} className="rounded-lg bg-muted p-3">
            <p className="font-medium">{action.type}</p>
            <p className="text-sm text-muted-foreground">{action.description}</p>
          </div>
        ))}
      </div>
    </div>
  ) : null;
};
