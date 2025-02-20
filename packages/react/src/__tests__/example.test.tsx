import type { Store } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import '@testing-library/jest-dom/vitest'; // Import Vitest DOM matchers

// Import from the package's test utils
import { createMock, mockApiError } from '../test-utils';

// Example of mocking a store
const mockStore = createMock<Store>({
  getState: () => ({
    theme: { mode: 'light' },
  }),
  dispatch: vi.fn(),
  subscribe: vi.fn(),
});

describe('Example Test Suite', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
  });

  it('should demonstrate mock usage with DOM testing', () => {
    // Example of rendering a test component and using screen
    render(<div data-testid="test-element">Test Content</div>);

    const element = screen.getByTestId('test-element');
    expect(element).toBeDefined();
    expect(element.textContent).toBe('Test Content');
    expect(mockStore.dispatch).not.toHaveBeenCalled();
  });

  it('should handle API errors', async () => {
    // Example of mocking API errors
    mockApiError(404, 'Not Found');

    // Test API error handling
    const response = await fetch('/api/test');
    expect(response.ok).toBe(false);
    expect(response.status).toBe(404);
  });
});
