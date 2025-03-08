import { beforeAll } from 'vitest';

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

// Basic test environment setup
beforeAll(() => {
  // Add any global test setup if needed
});

export {};