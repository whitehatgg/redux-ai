import { useState, useCallback, useEffect } from 'react';
import { useDispatch, useStore } from 'react-redux';
import { getReduxAI } from '@redux-ai/state';
import { useReduxAIContext } from '../components/ReduxAIProvider';

interface StateChange {
  type: string;
  timestamp: string;
  state: any;
  action?: {
    type: string;
    payload?: any;
  };
}

interface DemoState {
  demo: {
    counter: number;
    message?: string;
  };
  _lastAction?: {
    type: string;
    payload?: any;
  };
}

export function useReduxAI() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stateChanges, setStateChanges] = useState<StateChange[]>([]);
  const dispatch = useDispatch();
  const store = useStore<DemoState>();
  const { isInitialized } = useReduxAIContext();

  // Track state changes
  useEffect(() => {
    if (!isInitialized) return;

    const unsubscribe = store.subscribe(() => {
      const currentState = store.getState();
      console.log('State updated:', currentState);

      // Add the new state change to our list
      setStateChanges(prev => [
        {
          type: 'STATE_CHANGE',
          timestamp: new Date().toISOString(),
          state: currentState.demo,
          action: currentState._lastAction
        },
        ...prev
      ]);

      // Store in vector storage for history
      const reduxAI = getReduxAI();
      try {
        reduxAI.processQuery(`State changed to: ${JSON.stringify(currentState.demo)}`).catch(console.error);
      } catch (error) {
        console.error('Error processing state change:', error);
      }
    });

    return () => unsubscribe();
  }, [store, isInitialized]);

  const sendQuery = useCallback(async (query: string): Promise<string> => {
    setIsProcessing(true);
    setError(null);

    try {
      const reduxAI = getReduxAI();
      const response = await reduxAI.processQuery(query);
      return response.message;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      console.error('Error in sendQuery:', error);
      setError(errorMessage);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [store, isInitialized]);

  return {
    sendQuery,
    isProcessing,
    error,
    isInitialized,
    stateChanges
  };
}