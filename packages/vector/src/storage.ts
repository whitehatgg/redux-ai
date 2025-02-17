import { ChromaClient, Collection } from 'chromadb';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { Document } from 'langchain/document';
import { OpenAI } from 'langchain/llms/openai';
import { RetrievalQAChain } from 'langchain/chains';
import { ChromaStore } from 'langchain/vectorstores/chroma';

export interface VectorEntry {
  query: string;
  response: string;
  state: string;
  timestamp: string;
}

export class VectorStorage {
  private collection: Collection;
  private client: ChromaClient;
  private embeddings: OpenAIEmbeddings;
  private vectorStore: ChromaStore;
  private model: OpenAI;

  private constructor(
    client: ChromaClient, 
    collection: Collection,
    embeddings: OpenAIEmbeddings,
    vectorStore: ChromaStore,
    model: OpenAI
  ) {
    this.client = client;
    this.collection = collection;
    this.embeddings = embeddings;
    this.vectorStore = vectorStore;
    this.model = model;
  }

  static async create(collectionName: string): Promise<VectorStorage> {
    const client = new ChromaClient();
    const collection = await client.createCollection({
      name: collectionName,
      metadata: { description: "Vector storage for Redux AI" }
    });

    const embeddings = new OpenAIEmbeddings();
    const vectorStore = await ChromaStore.fromExistingCollection(embeddings, {
      collectionName,
      url: client.httpClient.baseUrl,
    });

    const model = new OpenAI({
      modelName: "gpt-4",
      temperature: 0.7,
    });

    return new VectorStorage(client, collection, embeddings, vectorStore, model);
  }

  async addEntry(entry: VectorEntry) {
    const { query, response, state, timestamp } = entry;
    const document = new Document({
      pageContent: JSON.stringify({ query, response }),
      metadata: { 
        state,
        timestamp,
      }
    });

    // Store in ChromaDB
    await this.collection.add({
      ids: [timestamp],
      documents: [JSON.stringify({ query, response, state })],
      metadatas: [{ timestamp }],
    });

    // Store in LangChain vector store
    await this.vectorStore.addDocuments([document]);
  }

  async findSimilar(query: string, limit: number = 5) {
    // Create RAG chain
    const chain = RetrievalQAChain.fromLLM(
      this.model,
      this.vectorStore.asRetriever(limit)
    );

    // Process query through RAG pipeline
    const result = await chain.call({
      query,
    });

    // Also get similar documents from ChromaDB for comparison
    const chromaResults = await this.collection.query({
      queryTexts: [query],
      nResults: limit,
    });

    return {
      ragResponse: result.text,
      similarDocs: chromaResults.documents[0].map(doc => JSON.parse(doc as string))
    };
  }
}