import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from './test-utils';
import { ActivityLog } from '../components/ActivityLog';

describe('ActivityLog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading state initially', () => {
    render(<ActivityLog />);
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it('renders empty state when no activities', async () => {
    render(<ActivityLog />);
    await waitFor(() => {
      expect(screen.getByText(/No activities/i)).toBeInTheDocument();
    });
  });
});