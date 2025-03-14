import type {
  CompletionResponse,
  IntentCompletionResponse,
  Message,
  ProviderConfig,
} from './types';

export abstract class BaseLLMProvider {
  protected timeout: number;

  constructor(config: ProviderConfig = {}) {
    this.timeout = config.timeout ?? 30000;
  }

  protected abstract convertMessage(message: Message): unknown;
  protected abstract completeRaw(messages: Message[]): Promise<unknown>;

  public async createCompletion(messages: Message[]): Promise<CompletionResponse | IntentCompletionResponse> {
    if (!this.completeRaw) {
      throw new Error('Provider must implement completeRaw method');
    }

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Provider timeout after ${this.timeout}ms`)), this.timeout);
      });

      const rawResponse = await Promise.race([this.completeRaw(messages), timeoutPromise]);
      return rawResponse as CompletionResponse | IntentCompletionResponse;

    } catch (error: unknown) {
      throw error;
    }
  }
}