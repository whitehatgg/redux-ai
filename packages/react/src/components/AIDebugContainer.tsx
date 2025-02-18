import React from 'react';
import { useReduxAI } from '../hooks/useReduxAI';
import { RAGResults } from './RAGResults';

export const AIDebugContainer: React.FC = () => {
  const { stateChanges } = useReduxAI();
  return stateChanges.length > 0 ? (
    <div className="mt-4">
      <RAGResults results={{
        ragResponse: "State changes detected",
        similarDocs: stateChanges.map(change => ({
          query: change.type,
          response: JSON.stringify(change.action),
          state: JSON.stringify(change.state),
          timestamp: change.timestamp
        })),
        timestamp: new Date().toISOString()
      }} />
    </div>
  ) : null;
};