import { VectorStorage } from './storage';

export interface VectorConfig {
  collectionName: string;
}

export class ReduxAIVector {
  private storage: VectorStorage;

  private constructor(storage: VectorStorage) {
    this.storage = storage;
  }

  static async create(config: VectorConfig): Promise<ReduxAIVector> {
    const storage = await VectorStorage.create(config.collectionName);
    return new ReduxAIVector(storage);
  }

  async storeInteraction(query: string, response: string, state: any) {
    await this.storage.addEntry({
      query,
      response,
      state: JSON.stringify(state),
      timestamp: new Date().toISOString(),
    });
  }

  async retrieveSimilar(query: string, limit: number = 5) {
    const results = await this.storage.findSimilar(query, limit);
    return {
      ...results,
      timestamp: new Date().toISOString()
    };
  }
}

export const createReduxAIVector = async (config: VectorConfig) => {
  return ReduxAIVector.create(config);
};