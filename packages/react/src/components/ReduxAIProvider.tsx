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
  error?: string;
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
  const [error, setError] = useState<string>();

  useEffect(() => {
    let mounted = true;
    let vectorDb: VectorStorage;

    const initialize = async () => {
      try {
        console.log('[ReduxAIProvider] Starting initialization...');

        vectorDb = await createReduxAIVector({
          collectionName: 'reduxai_vector',
          maxEntries: 100,
          dimensions: 128
        });

        if (!mounted) return;

        console.log('[ReduxAIProvider] Vector storage initialized');
        setVectorStorage(vectorDb);

        await createReduxAIState({
          store,
          schema,
          vectorStorage: vectorDb,
          availableActions,
          onError: (error: Error) => {
            console.error('[ReduxAIProvider] State error:', error);
            if (mounted) {
              setError(error.message);
              store.dispatch({ 
                type: '__VECTOR_ERROR__', 
                payload: error.message 
              });
            }
          }
        });

        if (!mounted) return;

        console.log('[ReduxAIProvider] State initialization complete');
        setIsInitialized(true);
        setError(undefined);
      } catch (error) {
        console.error('[ReduxAIProvider] Initialization error:', error);
        if (mounted) {
          const errorMessage = error instanceof Error ? error.message : 'Vector storage initialization failed';
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
      if (vectorDb) {
        // Cleanup vector storage if needed
        console.log('[ReduxAIProvider] Cleaning up vector storage');
      }
    };
  }, [store, schema, availableActions]);

  // Prevent rendering until initialization is complete
  if (!isInitialized && !error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Initializing ReduxAI...</p>
        </div>
      </div>
    );
  }

  // Show error state if initialization failed
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4 p-4 max-w-md">
          <p className="text-destructive font-medium">ReduxAI Initialization Error</p>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <ReduxAIContext.Provider value={{ 
      availableActions, 
      isInitialized, 
      store, 
      vectorStorage,
      error 
    }}>
      {children}
    </ReduxAIContext.Provider>
  );
};

export const useReduxAIContext = () => {
  const context = useContext(ReduxAIContext);
  if (!context.isInitialized && !context.error) {
    throw new Error('ReduxAI not initialized');
  }
  return context;
};