import { ChromaClient, Collection } from 'chromadb';

export interface VectorEntry {
  query: string;
  response: string;
  state: string;
  timestamp: string;
}

export class VectorStorage {
  private collection: Collection;
  private client: ChromaClient;

  private constructor(client: ChromaClient, collection: Collection) {
    this.client = client;
    this.collection = collection;
  }

  static async create(collectionName: string): Promise<VectorStorage> {
    const client = new ChromaClient();
    const collection = await client.createCollection({
      name: collectionName,
      metadata: { description: "Vector storage for Redux AI" }
    });

    return new VectorStorage(client, collection);
  }

  async addEntry(entry: VectorEntry) {
    const { query, response, state, timestamp } = entry;

    await this.collection.add({
      ids: [timestamp],
      documents: [JSON.stringify({ query, response, state })],
      metadatas: [{ timestamp }],
    });
  }

  async findSimilar(query: string, limit: number) {
    const results = await this.collection.query({
      queryTexts: [query],
      nResults: limit,
    });

    return results.documents[0].map(doc => JSON.parse(doc as string));
  }
}