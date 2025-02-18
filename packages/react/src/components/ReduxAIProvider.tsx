import React, { createContext, useContext, useState, useEffect } from 'react';
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
    console.log('[ReduxAIProvider] Starting initialization...');

    const initialize = async () => {
      try {
        console.log('[ReduxAIProvider] Creating vector storage...');
        const vectorDb = await createReduxAIVector({
          collectionName: 'reduxai_vector',
          maxEntries: 100,
          dimensions: 128
        });

        console.log('[ReduxAIProvider] Vector storage created:', vectorDb);
        setVectorStorage(vectorDb);

        console.log('[ReduxAIProvider] Initializing ReduxAI state...');
        await createReduxAIState({
          store,
          schema,
          vectorStorage: vectorDb,
          availableActions,
          onError: (error: Error) => {
            console.error('[ReduxAIProvider] Error:', error);
            store.dispatch({ type: '__VECTOR_ERROR__', payload: error.message });
          }
        });

        setIsInitialized(true);
        console.log('[ReduxAIProvider] Initialization complete');
      } catch (error) {
        console.error('[ReduxAIProvider] Initialization error:', error);
        store.dispatch({ type: '__VECTOR_ERROR__', payload: error instanceof Error ? error.message : 'Vector storage initialization failed' });
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