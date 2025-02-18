import React from 'react';
import { useReduxAI } from '../hooks/useReduxAI';
import { RAGResults } from './RAGResults';

export const AIDebugContainer: React.FC = () => {
  const { ragResults } = useReduxAI();
  return ragResults ? <RAGResults results={ragResults} /> : null;
};