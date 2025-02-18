import React, { createContext, useContext, useEffect, useState } from 'react';
import { Store } from '@reduxjs/toolkit';
import { ReduxAISchema } from '@redux-ai/schema';
import { createReduxAIVector } from '@redux-ai/vector';
import { createReduxAIState } from '@redux-ai/state';

interface ReduxAIContextType {
  isInitialized: boolean;
  error: string | null;
}

const ReduxAIContext = createContext<ReduxAIContextType>({
  isInitialized: false,
  error: null,
});

export interface ReduxAIAction {
  type: string;
  description: string;
  keywords: string[];
}

export interface ReduxAIProviderProps {
  children: React.ReactNode;
  store: Store;
  schema?: ReduxAISchema<any>;
  availableActions: ReduxAIAction[];
}

export const ReduxAIProvider: React.FC<ReduxAIProviderProps> = ({
  children,
  store,
  schema,
  availableActions,
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

useEffect(() => {
    const initialize = async () => {
      try {
        console.log('Starting ReduxAI initialization...');

        // Initialize vector storage with proper configuration
        console.log('Initializing vector storage...');
        const vectorStorage = await createReduxAIVector({
          collectionName: 'redux-ai-store',
          initialize: true
        });
        console.log('Vector storage initialized successfully');

        // Initialize ReduxAI state manager
        console.log('Initializing ReduxAI state manager...');
        await createReduxAIState({
          store,
          schema,
          vectorStorage,
          availableActions,
          onError: (error: Error) => {
            console.error('ReduxAI Error:', error);
            setError(error.message);
          }
        });

        setIsInitialized(true);
        console.log('ReduxAI initialization complete');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to initialize ReduxAI';
        console.error('ReduxAI initialization error:', message);
        setError(message);
      }
    };

    initialize();
  }, [store, schema, availableActions]);

  if (error) {
    return (
      <div className="text-red-500 p-4 border border-red-300 rounded bg-red-50">
        Error initializing ReduxAI: {error}
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="animate-pulse p-4 text-gray-600">
        Initializing ReduxAI...
      </div>
    );
  }

  return (
    <ReduxAIContext.Provider value={{ isInitialized, error }}>
      {children}
    </ReduxAIContext.Provider>
  );
};

export const useReduxAIContext = () => useContext(ReduxAIContext);