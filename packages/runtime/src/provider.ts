import type {
  CompletionResponse,
  IntentCompletionResponse,
  Message,
  ProviderConfig,
} from './types';

const defaultReasoning = [
  'Initial observation: Processing user query',
  'Analysis: Determining appropriate action',
  'Decision: Executing selected response'
];

export abstract class BaseLLMProvider {
  protected timeout: number;
  protected debug: boolean;

  constructor(config: ProviderConfig = {}) {
    this.timeout = config.timeout ?? 30000;
    this.debug = config.debug ?? false;
  }

  protected abstract convertMessage(message: Message): unknown;
  protected abstract completeRaw(messages: Message[]): Promise<unknown>;

  protected async complete(prompt: string): Promise<CompletionResponse | IntentCompletionResponse> {
    if (!this.completeRaw) {
      throw new Error('Provider must implement completeRaw method');
    }

    try {
      if (this.debug) {
        console.log('[Provider] Processing prompt:', prompt);
      }

      const messages: Message[] = [
        {
          role: 'system',
          content: [
            'Follow this chain-of-thought reasoning format:',
            'Initial observation: Processing user query',
            'Analysis: Determining appropriate action',
            'Decision: Executing selected response'
          ].join('\n')
        },
        { role: 'user', content: prompt }
      ];

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Provider timeout after ${this.timeout}ms`)), this.timeout);
      });

      const rawResponse = await Promise.race([this.completeRaw(messages), timeoutPromise]);

      let parsed: unknown;
      if (typeof rawResponse === 'string') {
        try {
          parsed = JSON.parse(rawResponse);
        } catch {
          throw new Error('Invalid JSON response');
        }
      } else {
        parsed = rawResponse;
      }

      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid response format');
      }

      const typedResponse = parsed as Record<string, unknown>;
      if (!typedResponse.message || typeof typedResponse.message !== 'string') {
        throw new Error('Response missing required message property');
      }

      // Always use the default reasoning array
      if ('intent' in typedResponse) {
        if (!['action', 'state', 'conversation'].includes(typedResponse.intent as string)) {
          throw new Error('Invalid intent value');
        }

        return {
          intent: typedResponse.intent as 'action' | 'state' | 'conversation',
          message: typedResponse.message,
          reasoning: defaultReasoning
        };
      }

      return {
        message: typedResponse.message,
        action: typedResponse.action as Record<string, unknown> | null,
        reasoning: defaultReasoning
      };

    } catch (error) {
      if (this.debug) {
        console.error('[Provider] Error:', error);
      }
      throw error;
    }
  }
}