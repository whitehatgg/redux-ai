import { Document } from "@langchain/core/documents";
import { OpenAIEmbeddings } from "@langchain/openai";

export interface VectorEntry {
  query: string;
  response: string;
  state: string;
  timestamp: string;
}

export class VectorStorage {
  private entries: VectorEntry[] = [];
  private embeddings: OpenAIEmbeddings;

  private constructor(embeddings: OpenAIEmbeddings) {
    this.embeddings = embeddings;
  }

  static async create(collectionName: string): Promise<VectorStorage> {
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY
    });

    return new VectorStorage(embeddings);
  }

  async addEntry(entry: VectorEntry) {
    this.entries.push(entry);
  }

  async findSimilar(query: string, limit: number = 5): Promise<VectorEntry[]> {
    // For now, return the most recent entries
    return this.entries
      .slice()
      .reverse()
      .slice(0, limit);
  }
}