import React from 'react';
import { useReduxAIContext } from '../components/ReduxAIProvider';

export const AIDebugContainer: React.FC = () => {
  const { availableActions } = useReduxAIContext();
  return availableActions && availableActions.length > 0 ? (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-2">Activity Log</h3>
      <div className="space-y-2">
        {availableActions.map((action, idx) => (
          <div key={idx} className="p-3 rounded-lg bg-muted">
            <p className="font-medium">{action.type}</p>
            <p className="text-sm text-muted-foreground">{action.description}</p>
          </div>
        ))}
      </div>
    </div>
  ) : null;
};