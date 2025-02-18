import { Document } from "@langchain/core/documents";
import { IndexedDBStorage } from './indexeddb';

export interface VectorEntry {
  query: string;
  response: string;
  state: string;
  timestamp: string;
}

export class VectorStorage {
  private storage: IndexedDBStorage;
  private vectors: Map<string, number[]> = new Map();
  private retryCount = 3;
  private retryDelay = 1000;

  private constructor(storage: IndexedDBStorage) {
    this.storage = storage;
  }

  static async create(collectionName: string): Promise<VectorStorage> {
    const storage = new IndexedDBStorage();
    await storage.initialize();

    const instance = new VectorStorage(storage);
    await instance.loadVectors();
    return instance;
  }

  private async loadVectors() {
    try {
      const entries = await this.storage.getAllEntries();
      console.log(`Loading vectors for ${entries.length} entries`);

      for (const entry of entries) {
        try {
          const embedding = await this.getEmbedding(entry.query);
          this.vectors.set(entry.timestamp, embedding);
        } catch (error) {
          console.error(`Failed to load vector for entry ${entry.timestamp}:`, error);
        }
      }
    } catch (error) {
      console.error('Failed to load vectors:', error);
      throw new Error('Failed to initialize vector storage');
    }
  }

  private async getEmbedding(text: string, attempt = 1): Promise<number[]> {
    try {
      console.log(`Requesting embedding for text: ${text.substring(0, 50)}...`);

      const response = await fetch('/api/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (!data.embedding || !Array.isArray(data.embedding)) {
        throw new Error('Invalid embedding format received from server');
      }

      return data.embedding;
    } catch (error) {
      console.error(`Embedding request failed (attempt ${attempt}):`, error);

      if (attempt < this.retryCount) {
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.getEmbedding(text, attempt + 1);
      }

      throw new Error(`Failed to get embedding after ${this.retryCount} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async addEntry(entry: VectorEntry) {
    try {
      // Ensure state is stringified
      const processedEntry = {
        ...entry,
        state: typeof entry.state === 'string' ? entry.state : JSON.stringify(entry.state, null, 2)
      };

      console.log('Adding new entry to vector storage');

      // Generate embedding for the query
      const embedding = await this.getEmbedding(entry.query);

      // Store entry and its embedding
      await this.storage.addEntry(processedEntry);
      this.vectors.set(processedEntry.timestamp, embedding);

      console.log('Successfully added entry and embedding');
    } catch (error) {
      console.error('Failed to add entry:', error);
      throw error;
    }
  }

  async findSimilar(query: string, limit: number = 5): Promise<VectorEntry[]> {
    try {
      const entries = await this.storage.getAllEntries();
      if (entries.length === 0) {
        return [];
      }

      console.log(`Finding similar entries for query: ${query.substring(0, 50)}...`);

      // Generate embedding for the search query
      const queryEmbedding = await this.getEmbedding(query);

      // Calculate cosine similarity with all stored vectors
      const similarities = Array.from(entries).map(entry => ({
        entry,
        similarity: this.cosineSimilarity(queryEmbedding, this.vectors.get(entry.timestamp)!)
      }));

      // Sort by similarity and get top results
      return similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit)
        .map(result => result.entry);
    } catch (error) {
      console.error('Failed to find similar entries:', error);
      throw error;
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, value, i) => sum + value * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, value) => sum + value * value, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, value) => sum + value * value, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }
}