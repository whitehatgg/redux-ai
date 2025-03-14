import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ReduxAIProvider } from '../components/ReduxAIProvider';
import { createMachine } from 'xstate';
import 'fake-indexeddb/auto';

/**
 * Testing approach:
 * We use a minimal test machine to avoid complex XState actor lifecycle management.
 * This machine provides just enough functionality to test the ReduxAIProvider's 
 * core behaviors (loading, initialization, error handling) without getting into
 * the details of XState's internal implementation.
 */
const testMachine = createMachine({
  id: 'test',
  initial: 'idle',
  context: {
    messages: []
  },
  states: {
    idle: {
      on: {
        SEND: 'processing'
      }
    },
    processing: {
      on: {
        COMPLETE: 'idle'
      }
    }
  }
});

// Mock state management with our test machine
vi.mock('@redux-ai/state', () => ({
  createReduxAIState: vi.fn(),
  createConversationMachine: vi.fn(() => testMachine)
}));

// Mock vector store creation with a minimal implementation
vi.mock('@redux-ai/vector', () => ({
  createReduxAIVector: vi.fn(() => 
    Promise.resolve({
      addEntry: vi.fn(),
      retrieveSimilar: vi.fn(),
      getAllEntries: vi.fn(),
      storeInteraction: vi.fn(),
      subscribe: vi.fn(() => () => {})
    })
  )
}));

describe('ReduxAIProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading state initially', async () => {
    const { container } = render(
      <ReduxAIProvider store={{} as any} actions={{} as any} endpoint="/api/ai">
        <div>Child content</div>
      </ReduxAIProvider>
    );

    // Check for loading state container
    await waitFor(() => {
      const loadingContainer = container.querySelector('.min-h-screen');
      expect(loadingContainer).toBeInTheDocument();
      expect(loadingContainer?.textContent).toContain('Initializing ReduxAI');
    });
  });

  it('renders children when initialized', async () => {
    const { createReduxAIVector } = await import('@redux-ai/vector');
    const mockVector = {
      addEntry: vi.fn(),
      retrieveSimilar: vi.fn(),
      getAllEntries: vi.fn(),
      storeInteraction: vi.fn(),
      subscribe: vi.fn(() => vi.fn()),
    };

    vi.mocked(createReduxAIVector).mockResolvedValueOnce(mockVector);

    render(
      <ReduxAIProvider store={{} as any} actions={{} as any} endpoint="/api/ai">
        <div data-testid="child">Child content</div>
      </ReduxAIProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByText('Child content')).toBeInTheDocument();
    });
  });

  it('handles initialization errors', async () => {
    const { createReduxAIVector } = await import('@redux-ai/vector');
    vi.mocked(createReduxAIVector).mockRejectedValueOnce(new Error('Initialization failed'));

    render(
      <ReduxAIProvider store={{} as any} actions={{} as any} endpoint="/api/ai">
        <div>Child content</div>
      </ReduxAIProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/ReduxAI Initialization Error/i)).toBeInTheDocument();
      expect(screen.getByText(/Initialization failed/i)).toBeInTheDocument();
    });
  });
});