import React, { createContext, useContext, useEffect } from 'react';
import { Store, Action } from '@reduxjs/toolkit';
import { ReduxAISchema } from '@redux-ai/schema';
import { createReduxAIVector } from '@redux-ai/vector';
import { createReduxAIState, ReduxAIAction } from '@redux-ai/state';

interface ReduxAIContextType {
  availableActions: ReduxAIAction[];
}

const ReduxAIContext = createContext<ReduxAIContextType>({
  availableActions: []
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
  useEffect(() => {
    const initialize = async () => {
      try {
        const vectorStorage = await createReduxAIVector({
          collectionName: 'reduxai_vector',
          maxEntries: 100,
          dimensions: 128
        });

        await createReduxAIState({
          store,
          schema,
          vectorStorage,
          availableActions,
          onError: (error: Error) => {
            console.error('ReduxAI Error:', error);
          }
        });
      } catch (error) {
        console.error('ReduxAI initialization error:', error);
      }
    };

    initialize();
  }, [store, schema, availableActions]);

  return (
    <ReduxAIContext.Provider value={{ availableActions }}>
      {children}
    </ReduxAIContext.Provider>
  );
};

export const useReduxAIContext = () => useContext(ReduxAIContext);