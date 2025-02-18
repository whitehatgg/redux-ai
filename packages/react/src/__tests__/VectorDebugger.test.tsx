import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { VectorDebugger } from '../components/VectorDebugger';
import { useVectorDebug } from '../hooks/useVectorDebug';
import type { ReduxAIAction } from '@redux-ai/state';
import type { VectorEntry } from '@redux-ai/vector';

// Mock the hook
jest.mock('../hooks/useVectorDebug');
const mockUseVectorDebug = useVectorDebug as jest.MockedFunction<typeof useVectorDebug>;

describe('VectorDebugger', () => {
  const mockActions: ReduxAIAction[] = [
    {
      type: 'test/action',
      description: 'Test action description',
      keywords: ['test', 'action']
    }
  ];

  const mockEntries: VectorEntry[] = [];

  beforeEach(() => {
    mockUseVectorDebug.mockReset();
  });

  it('renders loading state correctly', () => {
    mockUseVectorDebug.mockReturnValue({
      isLoading: true,
      error: null,
      availableActions: [],
      entries: mockEntries
    });

    render(<VectorDebugger />);
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('renders error state correctly', () => {
    const errorMessage = 'Test error message';
    mockUseVectorDebug.mockReturnValue({
      isLoading: false,
      error: errorMessage,
      availableActions: [],
      entries: mockEntries
    });

    render(<VectorDebugger />);
    expect(screen.getByText('Error loading vector data')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('renders available actions correctly', () => {
    mockUseVectorDebug.mockReturnValue({
      isLoading: false,
      error: null,
      availableActions: mockActions,
      entries: mockEntries
    });

    render(<VectorDebugger />);
    expect(screen.getByText('Available Actions')).toBeInTheDocument();
    expect(screen.getByText('Test action description')).toBeInTheDocument();
    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('action')).toBeInTheDocument();
  });

  it('renders empty state correctly', () => {
    mockUseVectorDebug.mockReturnValue({
      isLoading: false,
      error: null,
      availableActions: [],
      entries: mockEntries
    });

    render(<VectorDebugger />);
    expect(screen.getByText('No actions available')).toBeInTheDocument();
  });
});