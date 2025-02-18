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
    let unsubscribe: (() => void) | undefined;

    const initialize = async () => {
      try {
        console.log('Starting ReduxAI initialization...');

        // Delete existing IndexedDB database
        const deleteRequest = window.indexedDB.deleteDatabase('redux-ai-store');

        await new Promise((resolve, reject) => {
          deleteRequest.onerror = () => reject(new Error('Failed to delete existing database'));
          deleteRequest.onsuccess = () => resolve(undefined);
        });

        // Initialize vector storage with fresh configuration
        console.log('Initializing vector storage...');
        const vectorStorage = await createReduxAIVector({
          collectionName: 'redux-ai-store',
          maxEntries: 100,
          dimensions: 128
        });

        console.log('Vector storage initialized successfully');

        if (isCleanedUp) return;

        // Initialize ReduxAI state manager
        console.log('Initializing ReduxAI state manager...');
        await createReduxAIState({
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
        unsubscribe = store.subscribe(() => {
          if (isCleanedUp) return;

          const state = store.getState();
          const lastAction = (store as any)._lastAction;

          if (lastAction && lastAction.type) {
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
          console.log('ReduxAI initialization complete');
        }

      } catch (error) {
        console.error('ReduxAI initialization error:', error);
        if (!isCleanedUp) {
          setError(error instanceof Error ? error.message : 'Failed to initialize ReduxAI');
        }
      }
    };

    initialize();

    return () => {
      isCleanedUp = true;
      if (unsubscribe) {
        unsubscribe();
      }
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