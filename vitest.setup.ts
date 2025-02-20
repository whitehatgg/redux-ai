import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { configure } from '@testing-library/react';
import '@testing-library/jest-dom';

// Configure testing library
configure({ 
  testIdAttribute: 'data-testid',
});

// Mock window.fetch
window.fetch = vi.fn();

// React 18 specific setup
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Clean up after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});