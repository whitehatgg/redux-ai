import React, { createContext, useContext, useEffect, useState } from 'react';
import { Store, Action } from '@reduxjs/toolkit';
import { ReduxAISchema } from '@redux-ai/schema';
import { createReduxAIVector, VectorStorage } from '@redux-ai/vector';
import { createReduxAIState, ReduxAIAction } from '@redux-ai/state';

interface ReduxAIContextType {
  availableActions: ReduxAIAction[];
  isInitialized: boolean;
  store?: Store;
  vectorStorage?: VectorStorage;
}

const ReduxAIContext = createContext<ReduxAIContextType>({
  availableActions: [],
  isInitialized: false
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
  const [vectorStorage, setVectorStorage] = useState<VectorStorage>();

  useEffect(() => {
    const initialize = async () => {
      try {
        console.log('Initializing ReduxAI Provider...');

        // Create vector storage for semantic search
        const vectorDb = await createReduxAIVector({
          collectionName: 'reduxai_vector',
          maxEntries: 100,
          dimensions: 128,
          onStateChange: (action) => {
            // Track vector database operations in Redux store
            if (store && action) {
              (store as any).lastAction = {
                ...action,
                timestamp: new Date().toISOString(),
                type: `vector/${action.type}`,
                response: action.payload ? JSON.stringify(action.payload) : undefined
              };
              // Force a store update to trigger subscribers
              store.dispatch({ type: '__VECTOR_UPDATE__', payload: action });
            }
          }
        });

        setVectorStorage(vectorDb);

        // Initialize ReduxAI state management
        await createReduxAIState({
          store,
          schema,
          vectorStorage: vectorDb as VectorStorage,
          availableActions,
          onError: (error: Error) => {
            console.error('ReduxAI Error:', error);
            // Log errors in activity log
            if (store) {
              (store as any).lastAction = {
                type: 'vector/error',
                timestamp: new Date().toISOString(),
                response: error.message
              };
              store.dispatch({ type: '__VECTOR_ERROR__', payload: error.message });
            }
          }
        });

        // Make store accessible on window for development
        (window as any).__REDUX_STORE__ = store;

        setIsInitialized(true);
        console.log('ReduxAI Provider initialized successfully');
      } catch (error) {
        console.error('ReduxAI initialization error:', error);
      }
    };

    initialize();
  }, [store, schema, availableActions]);

  return (
    <ReduxAIContext.Provider value={{ availableActions, isInitialized, store, vectorStorage }}>
      {children}
    </ReduxAIContext.Provider>
  );
};

export const useReduxAIContext = () => useContext(ReduxAIContext);