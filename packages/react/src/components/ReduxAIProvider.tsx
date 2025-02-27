import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReduxAIVector } from '@redux-ai/vector';
import { createReduxAIVector } from '@redux-ai/vector';
import type { Store } from '@reduxjs/toolkit';

interface ReduxAIContextType {
  store: Store;
  actions: any;
  storage: ReduxAIVector | null;
  endpoint: string;
  debug?: boolean;
}

const ReduxAIContext = createContext<ReduxAIContextType | null>(null);

export interface ReduxAIProviderProps {
  children: React.ReactNode;
  store: Store;
  actions: any; // JSON schema for possible actions
  endpoint: string;
  debug?: boolean;
}

export const ReduxAIProvider: React.FC<ReduxAIProviderProps> = ({
  children,
  store,
  actions,
  endpoint,
  debug = false,
}) => {
  const [storage, setStorage] = useState<ReduxAIVector | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initializeAI = async () => {
      try {
        const storage = await createReduxAIVector({
          dimensions: 128,
        });
        setStorage(storage);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to initialize ReduxAI system'));
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAI();
  }, [store, actions, endpoint]);

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
        store,
        actions,
        storage,
        endpoint,
        debug,
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
