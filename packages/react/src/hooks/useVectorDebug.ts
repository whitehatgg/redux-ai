import { useState } from 'react';
import type { VectorEntry } from '@redux-ai/vector';
import { useReduxAIContext } from '../components/ReduxAIProvider';

export function useVectorDebug() {
  const [entries] = useState<VectorEntry[]>([]);
  const [isLoading] = useState(false);
  const [error] = useState<string | null>(null);
  const { availableActions } = useReduxAIContext();

  return { entries, isLoading, error, availableActions };
}