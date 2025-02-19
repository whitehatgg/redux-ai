import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ActivityLog } from '../components/ActivityLog';
import { useReduxAIContext } from '../components/ReduxAIProvider';

// Mock the ReduxAIContext hook
vi.mock('../components/ReduxAIProvider', () => ({
  useReduxAIContext: vi.fn(),
}));

describe('ActivityLog', () => {
  const mockSubscribe = vi.fn(() => vi.fn());
  const mockVectorStorage = {
    subscribe: mockSubscribe,
    getAllEntries: vi.fn(),
    storeInteraction: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    (useReduxAIContext as jest.Mock).mockReturnValue({
      vectorStorage: mockVectorStorage,
      isInitialized: true,
      availableActions: [],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should not render when closed', () => {
    render(<ActivityLog open={false} />);
    expect(screen.queryByText('Vector Activity Log')).not.toBeInTheDocument();
  });

  it('should render when open', () => {
    render(<ActivityLog open={true} />);
    expect(screen.getByText('Vector Activity Log')).toBeInTheDocument();
    expect(screen.getByText('No vector operations logged yet.')).toBeInTheDocument();
  });

  it('should setup subscription on mount', () => {
    render(<ActivityLog open={true} />);
    expect(mockSubscribe).toHaveBeenCalled();
  });
});