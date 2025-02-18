import { VectorStorage } from './storage';

export interface VectorConfig {
  collectionName?: string; // Made optional since we're not using it with IndexedDB
}

export class ReduxAIVector {
  private storage: VectorStorage;

  private constructor(storage: VectorStorage) {
    this.storage = storage;
  }

  static async create(_config: VectorConfig): Promise<ReduxAIVector> {
    const storage = await VectorStorage.create();
    return new ReduxAIVector(storage);
  }

  async storeInteraction(query: string, response: string, state: any) {
    const stateString = typeof state === 'string' ? state : JSON.stringify(state, null, 2);

    await this.storage.addEntry({
      query,
      response,
      state: stateString,
      timestamp: new Date().toISOString(),
    });
  }

  async retrieveSimilar(query: string, limit: number = 5) {
    try {
      return await this.storage.retrieveSimilar(query, limit);
    } catch (error) {
      console.error('Error retrieving similar interactions:', error);
      return [];
    }
  }
}

export const createReduxAIVector = async (config: VectorConfig) => {
  return ReduxAIVector.create(config);
};