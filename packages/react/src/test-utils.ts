import { vi } from 'vitest';

type Procedure = (...args: any[]) => any;
interface MockImplementation<T> {
  [key: string]: T[keyof T];
}

// Create a more structured mock factory
export const createMock = <T extends object>(mockImplementation?: Partial<T>): T => {
  const mock = vi.fn() as unknown as T;
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
