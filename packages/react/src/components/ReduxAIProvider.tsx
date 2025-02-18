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
    let mounted = true;

    const initialize = async () => {
      try {
        const vectorDb = await createReduxAIVector({
          collectionName: 'reduxai_vector',
          maxEntries: 100,
          dimensions: 128
        });

        if (!mounted) return;

        setVectorStorage(vectorDb);

        await createReduxAIState({
          store,
          schema,
          vectorStorage: vectorDb,
          availableActions,
          onError: (error: Error) => {
            console.error('[ReduxAIProvider] State error:', error);
            store.dispatch({ 
              type: '__VECTOR_ERROR__', 
              payload: error.message 
            });
          }
        });

        if (!mounted) return;

        setIsInitialized(true);
        console.log('[ReduxAIProvider] Initialization complete');
      } catch (error) {
        console.error('[ReduxAIProvider] Initialization error:', error);
        if (mounted) {
          store.dispatch({ 
            type: '__VECTOR_ERROR__', 
            payload: error instanceof Error ? error.message : 'Vector storage initialization failed' 
          });
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, [store, schema, availableActions]);

  return (
    <ReduxAIContext.Provider value={{ 
      availableActions, 
      isInitialized, 
      store, 
      vectorStorage 
    }}>
      {children}
    </ReduxAIContext.Provider>
  );
};

export const useReduxAIContext = () => useContext(ReduxAIContext);