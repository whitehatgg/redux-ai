import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ActivityLog } from '../components/ActivityLog';
import * as useActivityLogModule from '../hooks/useActivityLog';

// Mock the useActivityLog hook
vi.mock('../hooks/useActivityLog', () => ({
  useActivityLog: vi.fn(),
}));

describe('ActivityLog', () => {
  const mockEntries = [
    {
      id: '1',
      metadata: {
        query: 'test query',
        response: 'test response',
        timestamp: new Date('2024-02-27T12:00:00').getTime(),
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should hide content when closed', () => {
    // Mock a default state
    vi.spyOn(useActivityLogModule, 'useActivityLog').mockReturnValue({
      entries: [],
      isLoading: false,
      error: null,
    });

    render(<ActivityLog open={false} />);
    expect(screen.queryByText('Activity Log')).not.toBeInTheDocument();
  });

  it('should show loading state', () => {
    vi.spyOn(useActivityLogModule, 'useActivityLog').mockReturnValue({
      entries: [],
      isLoading: true,
      error: null,
    });

    render(<ActivityLog open={true} />);
    expect(screen.getByText('Loading activity log...')).toBeInTheDocument();
  });

  it('should show error state', () => {
    vi.spyOn(useActivityLogModule, 'useActivityLog').mockReturnValue({
      entries: [],
      isLoading: false,
      error: 'Failed to load activity log',
    });

    render(<ActivityLog open={true} />);
    expect(screen.getByText('Failed to load activity log')).toBeInTheDocument();
  });

  it('should show empty state when no entries', () => {
    vi.spyOn(useActivityLogModule, 'useActivityLog').mockReturnValue({
      entries: [],
      isLoading: false,
      error: null,
    });

    render(<ActivityLog open={true} />);
    expect(screen.getByText('No operations logged yet.')).toBeInTheDocument();
  });

  it('should display activity entries', () => {
    vi.spyOn(useActivityLogModule, 'useActivityLog').mockReturnValue({
      entries: mockEntries,
      isLoading: false,
      error: null,
    });

    render(<ActivityLog open={true} />);

    expect(screen.getByText('test query')).toBeInTheDocument();
    expect(screen.getByText('test response')).toBeInTheDocument();
    expect(screen.getByText('12:00:00 PM')).toBeInTheDocument();
  });
});
