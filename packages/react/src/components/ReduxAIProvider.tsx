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
    isAIAction: boolean;
    trigger: 'ai' | 'ui';
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
  schema?: ReduxAISchema<Action>;
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
  const [stateChanges, setStateChanges] = useState<Array<{
    action?: any;
    state: any;
    timestamp: string;
    isAIAction: boolean;
    trigger: 'ai' | 'ui';
  }>>([]);

  // Function to record state change
  const recordStateChange = (action: any, state: any) => {
    console.log('ReduxAIProvider - Recording state change:', { action, state });

    // Only record valid Redux actions
    if (!action || typeof action !== 'object' || !('type' in action)) {
      console.warn('ReduxAIProvider - Invalid action:', action);
      return;
    }

    // Skip internal actions except initialization
    if (action.type.startsWith('@@') && action.type !== '@@redux/INIT') {
      console.log('ReduxAIProvider - Skipping internal action:', action.type);
      return;
    }

    // Check if this is one of the AI-available actions
    const isAIAction = availableActions.some(available => available.type === action.type);
    console.log('ReduxAIProvider - Is AI action:', isAIAction);

    // Determine trigger source directly from the action
    const triggerType = action.__source === 'ai' ? 'ai' as const : 'ui' as const;
    console.log('ReduxAIProvider - Trigger type:', triggerType);

    const timestamp = new Date().toISOString();
    const newChange = {
      action,
      state,
      timestamp,
      isAIAction,
      trigger: triggerType
    };

    setStateChanges(prev => {
      // Only check for duplicates if it's not the initialization action
      if (action.type !== '@@redux/INIT') {
        const isDuplicate = prev.some(entry =>
          entry.action?.type === action.type &&
          JSON.stringify(entry.action?.payload) === JSON.stringify(action.payload) &&
          Date.now() - new Date(entry.timestamp).getTime() < 2000 // Within 2 seconds
        );

        if (isDuplicate) {
          console.log('ReduxAIProvider - Duplicate action detected, skipping');
          return prev;
        }
      }

      console.log('ReduxAIProvider - Adding new state change:', newChange);
      const newChanges = [...prev, newChange];
      console.log('ReduxAIProvider - Updated state changes:', newChanges);
      return newChanges;
    });
  };

  useEffect(() => {
    let isCleanedUp = false;
    let unsubscribe: (() => void) | undefined;

    const initialize = async () => {
      try {
        console.log('ReduxAIProvider - Starting initialization...');

        // Create initial state change for initialization
        const initialState = store.getState();
        recordStateChange({ type: '@@redux/INIT', __source: 'ui' }, initialState);

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

        if (isCleanedUp) return;

        const vectorStorage = await createReduxAIVector({
          collectionName: 'reduxai_vector',
          maxEntries: 100,
          dimensions: 128
        });

        if (isCleanedUp) return;

        await createReduxAIState({
          store,
          schema: schema as ReduxAISchema<Action>,
          vectorStorage,
          availableActions,
          onError: (error: Error) => {
            console.error('ReduxAI Error:', error);
            if (!isCleanedUp) {
              setError(error.message);
            }
          }
        });

        if (isCleanedUp) return;

        // Subscribe to store changes to track actions and state
        console.log('ReduxAIProvider - Setting up store subscription');
        unsubscribe = store.subscribe(() => {
          const action = (store as any)._currentAction; // Get the current action from the store
          const state = store.getState();
          if (action) {
            recordStateChange(action, state);
          }
        });

        if (!isCleanedUp) {
          setIsInitialized(true);
          console.log('ReduxAIProvider - Initialization complete');
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
  }, [store, schema, availableActions]);

  const contextValue = {
    isInitialized,
    error,
    stateChanges
  };

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
    <ReduxAIContext.Provider value={contextValue}>
      {children}
    </ReduxAIContext.Provider>
  );
};

export const useReduxAIContext = () => useContext(ReduxAIContext);