import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { configure } from '@testing-library/react';

// Extend matchers
expect.extend(matchers);

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