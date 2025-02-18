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
    // Only record valid Redux actions
    if (!action || typeof action !== 'object' || !('type' in action)) {
      console.warn('Invalid action:', action);
      return;
    }

    // Skip internal actions or non-state-changing actions
    const isInternalAction = action.type.startsWith('@@') ||
                           action.type === 'INVALID_ACTION';
    if (isInternalAction) {
      return;
    }

    // Check if this is one of the AI-available actions
    const isAIAction = availableActions.some(available => available.type === action.type);

    // Determine trigger source based on action source
    const isAITriggered = action.__source === 'ai';

    setStateChanges(prev => {
      const timestamp = new Date().toISOString();
      const newChange = { 
        action, 
        state, 
        timestamp, 
        isAIAction,
        trigger: isAITriggered ? 'ai' : 'ui'
      };

      // Check if this exact action was already recorded
      const isDuplicate = prev.some(entry =>
        entry.action?.type === action.type &&
        JSON.stringify(entry.action?.payload) === JSON.stringify(action.payload) &&
        Date.now() - new Date(entry.timestamp).getTime() < 2000 // Within 2 seconds
      );

      if (isDuplicate) {
        return prev;
      }

      return [...prev, newChange];
    });
  };

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

        await new Promise(resolve => setTimeout(resolve, 100));

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

        // Subscribe to store changes
        unsubscribe = store.subscribe(() => {
          if (isCleanedUp) return;
          const state = store.getState();
          const action = store.getState().__lastAction;

          if (action) {
            recordStateChange(action, state);
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
    <ReduxAIContext.Provider value={{ isInitialized, error, stateChanges }}>
      {children}
    </ReduxAIContext.Provider>
  );
};

export const useReduxAIContext = () => useContext(ReduxAIContext);