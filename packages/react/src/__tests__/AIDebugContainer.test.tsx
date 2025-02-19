import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AIDebugContainer } from '../components/AIDebugContainer';
import { ReduxAIProvider } from '../components/ReduxAIProvider';
import { configureStore } from '@reduxjs/toolkit';

describe('AIDebugContainer', () => {
  it('renders nothing when no actions are available', () => {
    const store = configureStore({
      reducer: { test: (state = {}) => state }
    });

    render(
      <ReduxAIProvider store={store} availableActions={[]}>
        <AIDebugContainer />
      </ReduxAIProvider>
    );

    expect(screen.queryByText('Activity Log')).toBeNull();
  });

  it('renders activity log with available actions', () => {
    const store = configureStore({
      reducer: { test: (state = {}) => state }
    });

    const mockActions = [
      {
        type: 'test/action',
        description: 'Test action description',
        keywords: ['test']
      }
    ];

    render(
      <ReduxAIProvider store={store} availableActions={mockActions}>
        <AIDebugContainer />
      </ReduxAIProvider>
    );

    expect(screen.getByText('Activity Log')).toBeInTheDocument();
    expect(screen.getByText('Test action description')).toBeInTheDocument();
  });
});
