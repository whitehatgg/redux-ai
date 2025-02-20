import { vi } from 'vitest';

// Define a more specific type for procedures
type Procedure = (...args: unknown[]) => unknown;

interface MockImplementation<T> {
  [key: string]: T[keyof T];
}

// Create a more structured mock factory
export const createMock = <T extends object>(mockImplementation?: Partial<T>): T => {
  const mock = vi.fn() as unknown as T;
  if (mockImplementation) {
    Object.entries(mockImplementation).forEach(([key, value]) => {
      if (typeof value === 'function') {
        (mock as MockImplementation<T>)[key] = vi.fn(value as Procedure) as T[keyof T];
      } else {
        (mock as MockImplementation<T>)[key] = value as T[keyof T];
      }
    });
  }
  return mock;
};

// Export commonly used testing utilities with proper response types
interface FetchResponse<T = unknown> {
  ok: boolean;
  status?: number;
  statusText?: string;
  json: () => Promise<T>;
}

export const mockFetch = <T>(data: T): void => {
  window.fetch = vi.fn().mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(data),
    } as FetchResponse<T>)
  );
};

export const mockApiError = (status = 500, message = 'Internal Server Error'): void => {
  window.fetch = vi.fn().mockImplementation(() =>
    Promise.resolve({
      ok: false,
      status,
      statusText: message,
      json: () => Promise.resolve({ error: message }),
    } as FetchResponse)
  );
};
