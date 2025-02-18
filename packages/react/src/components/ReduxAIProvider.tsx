import React, { createContext, useContext, useEffect, useState } from 'react';
import { Store } from '@reduxjs/toolkit';
import { ReduxAISchema } from '@redux-ai/schema';
import { createReduxAIVector } from '@redux-ai/vector';
import { createReduxAIState, ReduxAIAction } from '@redux-ai/state';

interface ReduxAIContextType {
  isInitialized: boolean;
  error: string | null;
  stateChanges: Array<{
    action?: any;
    state: any;
    timestamp: string;
  }>;
}

const ReduxAIContext = createContext<ReduxAIContextType>({
  isInitialized: false,
  error: null,
  stateChanges: [],
});

export interface ReduxAIProviderProps {
  children: React.ReactNode;
  store: Store;
  schema?: ReduxAISchema<any>;
  availableActions: ReduxAIAction[];
  onActionMatch?: (query: string) => Promise<{ action: any; message: string } | null>;
}

export const ReduxAIProvider: React.FC<ReduxAIProviderProps> = ({
  children,
  store,
  schema,
  availableActions,
  onActionMatch,
}) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stateChanges, setStateChanges] = useState<Array<{
    action?: any;
    state: any;
    timestamp: string;
  }>>([]);

  useEffect(() => {
    let isCleanedUp = false;

    const initialize = async () => {
      try {
        console.log('Starting ReduxAI initialization...');

        // Initialize vector storage with proper configuration
        console.log('Initializing vector storage...');
        const vectorStorage = await createReduxAIVector({
          collectionName: 'redux-ai-store',
          maxEntries: 100,
          dimensions: 128,
          clearExisting: true // Add flag to clear existing data
        });
        console.log('Vector storage initialized successfully');

        if (isCleanedUp) return;

        // Initialize ReduxAI state manager
        console.log('Initializing ReduxAI state manager...');
        const aiState = await createReduxAIState({
          store,
          schema,
          vectorStorage,
          availableActions,
          onActionMatch,
          onError: (error: Error) => {
            console.error('ReduxAI Error:', error);
            if (!isCleanedUp) {
              setError(error.message);
            }
          }
        });

        if (isCleanedUp) return;

        // Add middleware to track state changes
        const unsubscribe = store.subscribe(() => {
          const state = store.getState();
          const lastAction = (store as any)._lastAction;

          if (lastAction && lastAction.type && !isCleanedUp) {
            const stateChange = {
              action: lastAction,
              state,
              timestamp: new Date().toISOString()
            };

            setStateChanges(prev => [...prev, stateChange]);

            // Store the interaction in vector storage
            vectorStorage.store(
              lastAction.type,
              JSON.stringify(stateChange),
              stateChange
            ).catch(error => {
              console.error('Error storing state change:', error);
            });
          }
        });

        if (!isCleanedUp) {
          setIsInitialized(true);
        }
        console.log('ReduxAI initialization complete');

        return () => {
          isCleanedUp = true;
          unsubscribe();
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to initialize ReduxAI';
        console.error('ReduxAI initialization error:', message);
        if (!isCleanedUp) {
          setError(message);
        }
      }
    };

    initialize();

    return () => {
      isCleanedUp = true;
    };
  }, [store, schema, availableActions, onActionMatch]);

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
    <ReduxAIContext.Provider value={{ isInitialized, error, stateChanges }}>
      {children}
    </ReduxAIContext.Provider>
  );
};

export const useReduxAIContext = () => useContext(ReduxAIContext);