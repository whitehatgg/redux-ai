import { describe, expect, it, vi } from 'vitest';

import type { LLMProvider, Message } from '../types';

/**
 * Test suite for LLMProvider
 * 
 * Mocking Best Practices:
 * 1. Use factory pattern with vi.mock to ensure proper hoisting in all environments
 * 2. Define mock factory inside vi.mock to avoid initialization order issues
 * 3. Return class constructor that creates fresh mock instances
 * 4. Avoid using top-level variables in mock definitions
 */

// Create a mock provider class implementing the LLMProvider interface
class MockProvider implements LLMProvider {
  complete: ReturnType<typeof vi.fn>;

  constructor() {
    this.complete = vi.fn().mockImplementation(async (messages: Message[], currentState?: Record<string, unknown>) => ({
      message: `Processed ${messages.length} messages with state: ${JSON.stringify(currentState)}`,
      action: 'test_action',
    }));
  }
}

describe('LLMProvider', () => {
  let provider: LLMProvider;
  const mockMessages: Message[] = [
    { role: 'system', content: 'System message' },
    { role: 'user', content: 'User message' },
  ];

  const mockState = {
    key: 'value',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new MockProvider();
  });

  it('should process messages and state correctly', async () => {
    const response = await provider.complete(mockMessages, mockState);

    expect(response).toEqual({
      message: `Processed ${mockMessages.length} messages with state: ${JSON.stringify(mockState)}`,
      action: 'test_action',
    });
  });

  it('should handle empty state', async () => {
    const response = await provider.complete(mockMessages);

    expect(response).toEqual({
      message: `Processed ${mockMessages.length} messages with state: undefined`,
      action: 'test_action',
    });
  });

  it('should handle empty message list', async () => {
    const response = await provider.complete([], mockState);

    expect(response).toEqual({
      message: `Processed 0 messages with state: ${JSON.stringify(mockState)}`,
      action: 'test_action',
    });
  });
});