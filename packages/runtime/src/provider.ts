import type {
  CompletionResponse,
  IntentCompletionResponse,
  Message,
  ProviderConfig,
} from './types';

export abstract class BaseLLMProvider {
  protected timeout: number;
  protected debug: boolean;

  constructor(config: ProviderConfig = {}) {
    this.timeout = config.timeout ?? 30000;
    this.debug = config.debug ?? false;
  }

  protected abstract convertMessage(message: Message): unknown;
  protected abstract completeRaw(messages: Message[]): Promise<unknown>;

  async complete(prompt: string): Promise<CompletionResponse | IntentCompletionResponse> {
    if (!this.completeRaw) {
      throw new Error('Provider must implement completeRaw method');
    }

    try {
      if (this.debug) {
        console.debug('[Provider] Starting completion with prompt:', prompt);
      }

      const messages: Message[] = [
        {
          role: 'system',
          content:
            'You must respond with a valid JSON object. For intent determination, include "intent" and "message". For actions, include "message" and a single valid action object that exactly matches one of the allowed action types.',
        },
        { role: 'user', content: prompt },
      ];

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Provider timeout after ${this.timeout}ms`));
        }, this.timeout);
      });

      const rawResponse = await Promise.race([this.completeRaw(messages), timeoutPromise]);

      if (this.debug) {
        console.debug('[Provider] Raw response:', typeof rawResponse, rawResponse);
      }

      let parsed: unknown;
      if (typeof rawResponse === 'string') {
        try {
          parsed = JSON.parse(rawResponse);
        } catch {
          throw new Error('Invalid JSON response from provider');
        }
      } else {
        parsed = rawResponse;
      }

      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid response: not an object');
      }

      const typedResponse = parsed as Record<string, unknown>;
      if (!typedResponse.message || typeof typedResponse.message !== 'string') {
        throw new Error('Response missing required message property');
      }

      // Validate intent response
      if ('intent' in typedResponse) {
        if (!['action', 'state', 'conversation'].includes(typedResponse.intent as string)) {
          throw new Error('Invalid intent value');
        }
        return {
          intent: typedResponse.intent as 'action' | 'state' | 'conversation',
          message: typedResponse.message,
        };
      }

      // Return a simplified response without strict schema validation
      return {
        message: typedResponse.message,
        action: typedResponse.action as Record<string, unknown> | null,
      };
    } catch (error) {
      if (this.debug) {
        console.error('[Provider] Error:', error);
      }
      throw error;
    }
  }
}
