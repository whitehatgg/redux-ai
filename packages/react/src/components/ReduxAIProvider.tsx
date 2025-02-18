import React, { createContext, useContext, useEffect, useState } from 'react';
import { Store, Action } from '@reduxjs/toolkit';
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
  schema?: ReduxAISchema<Action>;  // Update to use Action type
  availableActions: ReduxAIAction[];
  onActionMatch?: (query: string) => Promise<{ action: Action | null; message: string } | null>;
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

        // Delete both potential database names to ensure clean start
        await Promise.all([
          new Promise<void>((resolve) => {
            const req1 = indexedDB.deleteDatabase('redux-ai-store');
            req1.onsuccess = () => {
              console.log('Successfully deleted redux-ai-store database');
              resolve();
            };
            req1.onerror = () => {
              console.warn('Error deleting redux-ai-store database, might not exist');
              resolve();
            };
          }),
          new Promise<void>((resolve) => {
            const req2 = indexedDB.deleteDatabase('reduxai_vector');
            req2.onsuccess = () => {
              console.log('Successfully deleted reduxai_vector database');
              resolve();
            };
            req2.onerror = () => {
              console.warn('Error deleting reduxai_vector database, might not exist');
              resolve();
            };
          })
        ]);

        // Add a small delay to ensure database cleanup is complete
        await new Promise(resolve => setTimeout(resolve, 100));

        if (isCleanedUp) return;

        // Initialize vector storage with fresh configuration
        console.log('Initializing vector storage...');
        const vectorStorage = await createReduxAIVector({
          collectionName: 'reduxai_vector', // Use consistent name
          maxEntries: 100,
          dimensions: 128
        });

        console.log('Vector storage initialized successfully');

        if (isCleanedUp) return;

        // Initialize ReduxAI state manager
        console.log('Initializing ReduxAI state manager...');
        await createReduxAIState({
          store,
          schema: schema as ReduxAISchema<Action>, // Cast schema to expected type
          vectorStorage,
          availableActions,
          onActionMatch: async (query: string, context: string) => {
            if (!onActionMatch) return null;

            try {
              const result = await onActionMatch(query);
              if (!result) return null;

              // Validate action structure
              if (result.action && typeof result.action === 'object' && 'type' in result.action) {
                return result;
              }

              console.warn('Invalid action structure received:', result.action);
              return {
                action: null,
                message: result.message || 'Invalid action structure received'
              };
            } catch (error) {
              console.error('Error in action match:', error);
              return null;
            }
          },
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

          if (lastAction && typeof lastAction === 'object' && 'type' in lastAction) {
            const stateChange = {
              action: lastAction,
              state,
              timestamp: new Date().toISOString()
            };

            setStateChanges(prev => [...prev, stateChange]);

            // Store the interaction in vector storage using the correct method name
            vectorStorage.storeInteraction(
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