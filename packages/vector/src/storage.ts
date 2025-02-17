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
  private vectors: number[][] = [];

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
    // Ensure state is stringified
    const processedEntry = {
      ...entry,
      state: typeof entry.state === 'string' ? entry.state : JSON.stringify(entry.state, null, 2)
    };

    // Generate embedding for the query
    const embedding = await this.embeddings.embedQuery(entry.query);

    // Store entry and its embedding
    this.entries.push(processedEntry);
    this.vectors.push(embedding);
  }

  async findSimilar(query: string, limit: number = 5): Promise<VectorEntry[]> {
    if (this.entries.length === 0) {
      return [];
    }

    // Generate embedding for the search query
    const queryEmbedding = await this.embeddings.embedQuery(query);

    // Calculate cosine similarity with all stored vectors
    const similarities = this.vectors.map((vector, index) => ({
      index,
      similarity: this.cosineSimilarity(queryEmbedding, vector)
    }));

    // Sort by similarity and get top results
    const topResults = similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(result => this.entries[result.index]);

    return topResults;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, value, i) => sum + value * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, value) => sum + value * value, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, value) => sum + value * value, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }
}