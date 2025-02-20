import { cleanup, configure } from '@testing-library/react';
import { afterEach, beforeAll, expect, vi } from 'vitest';

import '@testing-library/jest-dom';

import type { MockedFunction, MockedObject } from 'vitest';

// Configure testing library
configure({
  testIdAttribute: 'data-testid',
});

type Procedure = (...args: any[]) => any;
interface MockImplementation<T> {
  [key: string]: T[keyof T];
}

// Create a more structured mock factory
export const createMock = <T extends object>(mockImplementation?: Partial<T>): MockedObject<T> => {
  const mock = vi.fn() as unknown as MockedObject<T>;
  if (mockImplementation) {
    Object.entries(mockImplementation).forEach(([key, value]) => {
      const typedKey = key as keyof T;
      if (typeof value === 'function') {
        (mock as MockImplementation<T>)[key] = vi.fn(value as Procedure) as T[keyof T];
      } else {
        (mock as MockImplementation<T>)[key] = value as T[keyof T];
      }
    });
  }
  return mock;
};

// Setup global mocks
beforeAll(() => {
  // Mock window.fetch with a more detailed implementation
  window.fetch = vi.fn().mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
      blob: () => Promise.resolve(new Blob()),
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      formData: () => Promise.resolve(new FormData()),
    })
  );

  // Add more global mocks here
  vi.mock('@redux-ai/state', () => ({
    default: createMock(),
    createStore: vi.fn(),
    configureStore: vi.fn(),
  }));
});

// React 18 specific setup
declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Clean up after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Export commonly used testing utilities
export const mockFetch = (data: unknown) => {
  window.fetch = vi.fn().mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(data),
    })
  );
};

export const mockApiError = (status = 500, message = 'Internal Server Error') => {
  window.fetch = vi.fn().mockImplementation(() =>
    Promise.resolve({
      ok: false,
      status,
      statusText: message,
      json: () => Promise.resolve({ error: message }),
    })
  );
};
