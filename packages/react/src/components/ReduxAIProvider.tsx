import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReduxAISchema } from '@redux-ai/schema';
import type { ReduxAIAction } from '@redux-ai/state';
import { createReduxAIState } from '@redux-ai/state';
import type { VectorStorage } from '@redux-ai/vector';
import { createReduxAIVector } from '@redux-ai/vector';
import type { Action, Store } from '@reduxjs/toolkit';

interface ReduxAIContextType {
  availableActions: ReduxAIAction[];
  isInitialized: boolean;
  store?: Store;
  vectorStorage?: VectorStorage;
  error?: string;
}

const ReduxAIContext = createContext<ReduxAIContextType>({
  availableActions: [],
  isInitialized: false,
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
        if (isInitialized) return; // Prevent multiple initializations
        console.log('[ReduxAIProvider] Starting initialization...');

        // Initialize vector storage
        vectorDb = await createReduxAIVector({
          collectionName: 'reduxai_vector',
          maxEntries: 100,
          dimensions: 128,
        });

        if (!mounted) return;

        console.log('[ReduxAIProvider] Vector storage initialized');
        setVectorStorage(vectorDb);

        // Initialize Redux AI state
        await createReduxAIState({
          store,
          schema,
          vectorStorage: vectorDb,
          availableActions,
          onError: (error: Error) => {
            console.error('[ReduxAIProvider] State error:', error);
            if (mounted) {
              setError(error.message);
            }
          },
        });

        if (!mounted) return;

        console.log('[ReduxAIProvider] State initialization complete');
        setIsInitialized(true);
        setError(undefined);
      } catch (error) {
        console.error('[ReduxAIProvider] Initialization error:', error);
        if (mounted) {
          const errorMessage = error instanceof Error ? error.message : 'Initialization failed';
          setError(errorMessage);
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
      if (vectorDb) {
        console.log('[ReduxAIProvider] Cleaning up vector storage');
      }
    };
  }, [store, schema, availableActions]); // Only re-run if these props change

  // Show loading state until initialization is complete
  if (!isInitialized && !error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Initializing ReduxAI...</p>
        </div>
      </div>
    );
  }

  // Show error state if initialization failed
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="max-w-md space-y-4 p-4 text-center">
          <p className="font-medium text-destructive">ReduxAI Initialization Error</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <ReduxAIContext.Provider
      value={{
        availableActions,
        isInitialized,
        store,
        vectorStorage,
        error,
      }}
    >
      {children}
    </ReduxAIContext.Provider>
  );
};

export const useReduxAIContext = () => {
  const context = useContext(ReduxAIContext);
  if (!context) {
    throw new Error('useReduxAIContext must be used within a ReduxAIProvider');
  }
  return context;
};
