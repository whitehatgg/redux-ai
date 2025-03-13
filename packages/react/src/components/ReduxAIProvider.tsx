import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReduxAIVector } from '@redux-ai/vector';
import { createReduxAIVector } from '@redux-ai/vector';
import type { Store } from '@reduxjs/toolkit';
import { interpret } from 'xstate';
import { createConversationMachine, createReduxAIState, type ReduxAIState } from '@redux-ai/state';
import type { ActorRefFrom } from 'xstate';

interface ReduxAIContextType {
  store: Store;
  actions: Record<string, unknown>;
  storage: ReduxAIVector | null;
  endpoint: string;
  debug?: boolean;
  machineService: ActorRefFrom<ReturnType<typeof createConversationMachine>> | undefined;
  aiState: ReduxAIState | null;
}

const ReduxAIContext = createContext<ReduxAIContextType | null>(null);

export interface ReduxAIProviderProps {
  children: React.ReactNode;
  store: Store;
  actions: Record<string, unknown>;
  endpoint: string;
  debug?: boolean;
}

export const ReduxAIProvider: React.FC<ReduxAIProviderProps> = ({
  children,
  store,
  actions,
  endpoint,
  debug = false,
}) => {
  const [storage, setStorage] = useState<ReduxAIVector | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [machineService, setMachineService] = useState<ActorRefFrom<ReturnType<typeof createConversationMachine>>>();
  const [aiState, setAIState] = useState<ReduxAIState | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const initializeAI = async () => {
      try {
        const storage = await createReduxAIVector({
          dimensions: 128,
        });

        const machine = createConversationMachine();
        const service = interpret(machine);

        if (debug) {
          service.subscribe(() => {
            // State changes are handled through selectors, no need for console logs
          });
        }

        service.start();

        cleanupRef.current = () => {
          service.stop();
        };

        const aiState = createReduxAIState({
          store,
          actions,
          storage,
          endpoint,
          debug,
          machineService: service,
        });

        setStorage(storage);
        setMachineService(service);
        setAIState(aiState);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to initialize ReduxAI');
        setError(error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAI();

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [debug, store, actions, endpoint]);

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="text-lg">Initializing ReduxAI...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600">ReduxAI Initialization Error</h2>
          <p className="mt-2 text-gray-600">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <ReduxAIContext.Provider
      value={{
        store,
        actions,
        storage,
        endpoint,
        debug,
        machineService,
        aiState
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