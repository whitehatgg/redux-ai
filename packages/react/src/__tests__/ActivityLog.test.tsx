import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ActivityLog } from '../components/ActivityLog';
import type { VectorEntry } from '@redux-ai/vector';

describe('ActivityLog', () => {
  const mockSubscribe = vi.fn(() => mockUnsubscribe);
  const mockUnsubscribe = vi.fn();
  const mockGetAllEntries = vi.fn().mockResolvedValue([]);
  const mockVectorStorage = {
    subscribe: mockSubscribe,
    getAllEntries: mockGetAllEntries,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows empty state when no activities', async () => {
    render(<ActivityLog open={true} />);

    await waitFor(
      () => {
        expect(screen.getByText('No vector operations logged yet.')).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    expect(mockSubscribe).toHaveBeenCalled();
    expect(mockGetAllEntries).toHaveBeenCalled();
  });

  it('renders activity entries', async () => {
    const mockEntry: VectorEntry = {
      type: 'vector/store',
      timestamp: Date.now(),
      metadata: {
        query: 'test query',
        response: 'test response',
      },
    };

    mockGetAllEntries.mockResolvedValueOnce([mockEntry]);

    render(<ActivityLog open={true} />);

    await waitFor(
      () => {
        expect(screen.getByText(/test query/)).toBeInTheDocument();
        expect(screen.getByText(/test response/)).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it('handles subscription updates', async () => {
    render(<ActivityLog open={true} />);

    // Get initial subscription callback
    await waitFor(() => {
      expect(mockSubscribe).toHaveBeenCalled();
    });

    // Simulate subscription update
    const newEntry: VectorEntry = {
      type: 'vector/store',
      timestamp: Date.now(),
      metadata: {
        query: 'new query',
        response: 'new response',
      },
    };

    const [subscriptionCallback] = mockSubscribe.mock.calls[0];
    if (subscriptionCallback) {
      subscriptionCallback(newEntry);
    }

    await waitFor(
      () => {
        expect(screen.getByText(/new query/)).toBeInTheDocument();
        expect(screen.getByText(/new response/)).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it('cleans up subscription on unmount', async () => {
    const { unmount } = render(<ActivityLog open={true} />);

    await waitFor(() => {
      expect(mockSubscribe).toHaveBeenCalled();
    });

    unmount();
    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});