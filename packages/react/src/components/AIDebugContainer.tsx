import React from 'react';
import { useReduxAI } from '../hooks/useReduxAI';
import { useVectorDebug } from '../hooks/useVectorDebug';
import { RAGResults } from './RAGResults';
import { VectorDebugger } from './VectorDebugger';

export const AIDebugContainer: React.FC = () => {
  const { ragResults } = useReduxAI();
  const { entries, isLoading, error } = useVectorDebug();

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="space-y-8 p-4">
      {ragResults && <RAGResults results={ragResults} />}
      {isLoading ? (
        <div className="animate-pulse">Loading vector debug data...</div>
      ) : (
        <VectorDebugger entries={entries} />
      )}
    </div>
  );
};
