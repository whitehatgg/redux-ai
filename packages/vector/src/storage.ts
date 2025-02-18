import { Document } from "@langchain/core/documents";
import { ChromaClient } from 'chromadb';
import { Pipeline } from '@xenova/transformers';

export interface VectorEntry {
  query: string;
  response: string;
  state: string;
  timestamp: string;
}

export class VectorStorage {
  private client: ChromaClient;
  private collection: any;
  private embeddingPipeline: Pipeline | null = null;

  private constructor(client: ChromaClient, collection: any) {
    this.client = client;
    this.collection = collection;
  }

  static async create(collectionName: string): Promise<VectorStorage> {
    // Initialize ChromaDB with client-side configuration
    const client = new ChromaClient({
      path: "clientside"
    });

    // Get or create collection with client-side settings
    const collection = await client.getOrCreateCollection({
      name: collectionName,
      metadata: { 
        "hnsw:space": "cosine",
        "client_type": "js"
      }
    });

    return new VectorStorage(client, collection);
  }

  private async getEmbedding(text: string): Promise<number[]> {
    try {
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
      return data.embedding;
    } catch (error) {
      console.error('Failed to get embedding:', error);
      throw error;
    }
  }

  async addEntry(entry: VectorEntry) {
    try {
      console.log('Adding new entry to vector storage');

      const processedEntry = {
        ...entry,
        state: typeof entry.state === 'string' ? entry.state : JSON.stringify(entry.state, null, 2)
      };

      const embedding = await this.getEmbedding(processedEntry.query);

      await this.collection.add({
        ids: [processedEntry.timestamp],
        embeddings: [embedding],
        documents: [processedEntry.query],
        metadatas: [{
          response: processedEntry.response,
          state: processedEntry.state,
          timestamp: processedEntry.timestamp
        }]
      });

      console.log('Successfully added entry');
    } catch (error) {
      console.error('Failed to add entry:', error);
      throw error;
    }
  }

  async retrieveSimilar(query: string, limit: number = 5): Promise<VectorEntry[]> {
    try {
      const embedding = await this.getEmbedding(query);

      const results = await this.collection.query({
        queryEmbeddings: [embedding],
        nResults: limit
      });

      if (!results.metadatas?.[0]) {
        return [];
      }

      return results.metadatas[0].map((metadata: any, index: number) => ({
        query: results.documents[0][index],
        response: metadata.response,
        state: metadata.state,
        timestamp: metadata.timestamp
      }));
    } catch (error) {
      console.error('Failed to find similar entries:', error);
      return [];
    }
  }
}