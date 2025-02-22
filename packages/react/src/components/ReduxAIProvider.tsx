import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReduxAISchema } from '@redux-ai/schema';
import type { ReduxAIAction } from '@redux-ai/state';
import type { ReduxAIVector } from '@redux-ai/vector';
import { createReduxAIVector } from '@redux-ai/vector';
import type { Action, Store } from '@reduxjs/toolkit';

interface ReduxAIContextType {
  actions: ReduxAIAction[];
  store: Store;
  schema?: ReduxAISchema<Action>;
  vectorStorage?: ReduxAIVector;
  apiEndpoint: string;
}

const ReduxAIContext = createContext<ReduxAIContextType | null>(null);

export interface ReduxAIProviderProps {
  children: React.ReactNode;
  store: Store;
  schema?: ReduxAISchema<Action>;
  actions: ReduxAIAction[];
  apiEndpoint: string;
}

export const ReduxAIProvider: React.FC<ReduxAIProviderProps> = ({
  children,
  store,
  schema,
  actions,
  apiEndpoint,
}) => {
  const [vectorStorage, setVectorStorage] = useState<ReduxAIVector | undefined>();
  const [error, setError] = useState<Error | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initializeVector = async () => {
      try {
        const vector = await createReduxAIVector({
          dimensions: 128,
        });
        setVectorStorage(vector);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to initialize vector storage'));
      } finally {
        setIsInitializing(false);
      }
    };

    initializeVector();
  }, []);

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="text-lg">Initializing ReduxAI...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600">ReduxAI Initialization Error</h2>
          <p className="mt-2 text-gray-600">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <ReduxAIContext.Provider
      value={{
        actions,
        store,
        schema,
        vectorStorage,
        apiEndpoint,
      }}
    >
      {children}
    </ReduxAIContext.Provider>
  );
};

export const useReduxAIContext = () => {
  const context = useContext(ReduxAIContext);
  if (!context) {
    throw new Error('useReduxAIContext must be used within a ReduxAIProvider');
  }
  return context;
};
