export interface CompletionResponse {
  message: string;
  action: Record<string, unknown> | null;
}

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ProviderConfig {
  timeout?: number;
  debug?: boolean;
}

export abstract class BaseLLMProvider {
  protected timeout: number;
  protected debug: boolean;

  constructor(config: ProviderConfig = {}) {
    this.timeout = config.timeout ?? 30000;
    this.debug = config.debug ?? false;
  }

  protected abstract convertMessage(message: Message): unknown;
  protected abstract completeRaw(messages: Message[]): Promise<unknown>;

  async complete(prompt: string): Promise<CompletionResponse> {
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
            'You must respond with a valid JSON object that includes "intent" and "message" fields when determining intent, or "message" and "action" fields for other responses. The action object must have a "type" field that exactly matches one of the provided action types.',
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

      // Return either an intent response or action response
      if (typedResponse.intent) {
        return {
          message: typedResponse.message,
          action: { intent: typedResponse.intent },
        };
      }

      if (typedResponse.action && typeof typedResponse.action === 'object') {
        const action = typedResponse.action as Record<string, unknown>;
        if (!action.type || typeof action.type !== 'string') {
          throw new Error('Action response missing required type field');
        }
        return {
          message: typedResponse.message,
          action,
        };
      }

      return {
        message: typedResponse.message,
        action: null,
      };
    } catch (error) {
      if (this.debug) {
        console.debug('[Provider] Error:', error);
      }
      throw error;
    }
  }
}
