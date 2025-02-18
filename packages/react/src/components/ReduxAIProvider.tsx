import React, { createContext, useContext, useState, useEffect } from 'react';
import { Store, Action } from '@reduxjs/toolkit';
import { ReduxAISchema } from '@redux-ai/schema';
import { createReduxAIVector, VectorStorage } from '@redux-ai/vector';
import { createReduxAIState, ReduxAIAction } from '@redux-ai/state';

interface ReduxAIContextType {
  availableActions: ReduxAIAction[];
  isInitialized: boolean;
  error: string | null;
  store?: Store;
  vectorStorage?: VectorStorage;
}

const ReduxAIContext = createContext<ReduxAIContextType>({
  availableActions: [],
  isInitialized: false,
  error: null
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
  const [vectorStorage, setVectorStorage] = useState<VectorStorage>();

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        console.log('[ReduxAIProvider] Starting initialization...');

        const vectorDb = await createReduxAIVector({
          collectionName: 'reduxai_vector',
          maxEntries: 100,
          dimensions: 128
        });

        if (!mounted) return;
        console.log('[ReduxAIProvider] Vector storage initialized');

        setVectorStorage(vectorDb);

        const state = await createReduxAIState({
          store,
          schema,
          vectorStorage: vectorDb,
          availableActions,
          onError: (error: Error) => {
            console.error('[ReduxAIProvider] State error:', error);
            setError(error.message);
            store.dispatch({ 
              type: '__VECTOR_ERROR__', 
              payload: error.message 
            });
          }
        });

        if (!mounted) return;

        if (!state) {
          throw new Error('Failed to initialize ReduxAI state');
        }

        setIsInitialized(true);
        setError(null);
        console.log('[ReduxAIProvider] Initialization complete');
      } catch (error) {
        console.error('[ReduxAIProvider] Initialization error:', error);
        if (mounted) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to initialize ReduxAI';
          setError(errorMessage);
          store.dispatch({ 
            type: '__VECTOR_ERROR__', 
            payload: errorMessage
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
      error,
      store, 
      vectorStorage 
    }}>
      {error ? (
        <div className="p-4 bg-destructive/10 text-destructive rounded-md">
          <h3 className="font-medium">Initialization Error</h3>
          <p className="text-sm">{error}</p>
        </div>
      ) : children}
    </ReduxAIContext.Provider>
  );
};

export const useReduxAIContext = () => useContext(ReduxAIContext);