import { Document } from "@langchain/core/documents";
import { Pipeline } from '@xenova/transformers';
import { IndexedDBStorage } from './indexeddb';

export interface VectorEntry {
  query: string;
  response: string;
  state: string;
  timestamp: string;
}

export class VectorStorage {
  private indexedDB: IndexedDBStorage;
  private embeddingPipeline: Pipeline | null = null;

  private constructor(indexedDB: IndexedDBStorage) {
    this.indexedDB = indexedDB;
  }

  static async create(collectionName: string): Promise<VectorStorage> {
    const indexedDB = new IndexedDBStorage();
    await indexedDB.initialize();
    return new VectorStorage(indexedDB);
  }

  private async getEmbedding(text: string): Promise<number[]> {
    try {
      if (!this.embeddingPipeline) {
        this.embeddingPipeline = await Pipeline.fromPretrained(
          'Xenova/all-MiniLM-L6-v2',
          'feature-extraction',
          {
            quantized: false,
            progress_callback: null
          }
        );
      }

      const output = await this.embeddingPipeline(text, {
        pooling: 'mean',
        normalize: true
      });

      return Array.from(output.data);
    } catch (error) {
      console.error('Failed to generate embedding:', error);
      throw error;
    }
  }

  async addEntry(entry: VectorEntry) {
    try {
      console.log('Adding new entry to vector storage');
      await this.indexedDB.addEntry(entry);
      console.log('Successfully added entry');
    } catch (error) {
      console.error('Failed to add entry:', error);
      throw error;
    }
  }

  async retrieveSimilar(query: string, limit: number = 5): Promise<VectorEntry[]> {
    try {
      const entries = await this.indexedDB.getAllEntries();
      const queryEmbedding = await this.getEmbedding(query);

      // Calculate cosine similarity with each entry
      const entriesWithSimilarity = await Promise.all(
        entries.map(async (entry) => {
          const entryEmbedding = await this.getEmbedding(entry.query);
          const similarity = this.cosineSimilarity(queryEmbedding, entryEmbedding);
          return { ...entry, similarity };
        })
      );

      // Sort by similarity and return top N results
      return entriesWithSimilarity
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit)
        .map(({ similarity, ...entry }) => entry);
    } catch (error) {
      console.error('Failed to find similar entries:', error);
      return [];
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (normA * normB);
  }
}