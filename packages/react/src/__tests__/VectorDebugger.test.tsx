import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

import type { ReduxAIAction } from '@redux-ai/state';
import type { VectorEntry } from '@redux-ai/vector';

import { VectorDebugger } from '../components/VectorDebugger';
import { useVectorDebug } from '../hooks/useVectorDebug';

// Mock the hook
vi.mock('../hooks/useVectorDebug');
const mockUseVectorDebug = useVectorDebug as unknown as ReturnType<typeof vi.fn>;

describe('VectorDebugger', () => {
  const mockActions: ReduxAIAction[] = [
    {
      type: 'test/action',
      description: 'Test action description',
      keywords: ['test', 'action'],
    },
  ];

  const mockEntries: VectorEntry[] = [];

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders loading state correctly', async () => {
    mockUseVectorDebug.mockReturnValue({
      isLoading: true,
      error: null,
      availableActions: [],
      entries: mockEntries,
    });

    render(<VectorDebugger />);
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('renders error state correctly', async () => {
    const errorMessage = 'Test error message';
    mockUseVectorDebug.mockReturnValue({
      isLoading: false,
      error: errorMessage,
      availableActions: [],
      entries: mockEntries,
    });

    render(<VectorDebugger />);
    expect(screen.getByText('Error loading vector data')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('renders available actions correctly', async () => {
    mockUseVectorDebug.mockReturnValue({
      isLoading: false,
      error: null,
      availableActions: mockActions,
      entries: mockEntries,
    });

    render(<VectorDebugger />);
    expect(screen.getByText('Available Actions')).toBeInTheDocument();
    expect(screen.getByText('Test action description')).toBeInTheDocument();
    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('action')).toBeInTheDocument();
  });

  it('renders empty state correctly', async () => {
    mockUseVectorDebug.mockReturnValue({
      isLoading: false,
      error: null,
      availableActions: [],
      entries: mockEntries,
    });

    render(<VectorDebugger />);
    expect(screen.getByText('No actions available')).toBeInTheDocument();
  });

  it('handles undefined entries gracefully', async () => {
    mockUseVectorDebug.mockReturnValue({
      isLoading: false,
      error: null,
      availableActions: [],
      entries: undefined as any,
    });

    render(<VectorDebugger />);
    expect(screen.getByText('No actions available')).toBeInTheDocument();
  });
});