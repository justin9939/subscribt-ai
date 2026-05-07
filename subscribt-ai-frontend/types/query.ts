/**
 * Query and RAG-related type definitions
 */

/**
 * Citation reference to source material
 */
export interface Citation {
  /** Unique identifier for the citation */
  id: string;
  /** Document ID this citation references */
  documentId: string;
  /** Document chunk ID */
  chunkId: string;
  /** Excerpt from the source document */
  snippet: string;
  /** Page number in the original PDF */
  pageNumber: number;
  /** Section heading */
  sectionHeading: string;
  /** Hierarchical path */
  hierarchyPath: string;
  /** Similarity score (0-1) */
  relevanceScore: number;
}

/**
 * Request payload for a query
 */
export interface QueryRequest {
  /** Natural language query text */
  query: string;
  /** Optional document IDs to restrict search to */
  documentIds?: string[];
  /** Maximum number of chunks to retrieve (default: 5) */
  maxChunks?: number;
}

/**
 * Response from a query (non-streaming)
 */
export interface QueryResponse {
  /** Unique query identifier */
  queryId: string;
  /** AI-generated response text */
  response: string;
  /** Citations supporting the response */
  citations: Citation[];
  /** Whether the query was answered or not addressed */
  isAnswered: boolean;
  /** Timestamp (ISO 8601) */
  timestamp: string;
  /** Processing time in milliseconds */
  processingTimeMs: number;
}

/**
 * Streaming chunk from the chat service
 */
export interface StreamChunk {
  /** Type of chunk */
  type: 'token' | 'citation' | 'metadata' | 'error' | 'done';
  /** Token text (for type='token') */
  token?: string;
  /** Citation data (for type='citation') */
  citation?: Citation;
  /** Metadata (for type='metadata') */
  metadata?: {
    queryId: string;
    timestamp: string;
  };
  /** Error message (for type='error') */
  error?: string;
}

/**
 * Query log entry (anonymized for HR access)
 */
export interface QueryLog {
  /** Unique query log identifier */
  id: string;
  /** Query text */
  query: string;
  /** Timestamp (ISO 8601) */
  timestamp: string;
  /** Document IDs queried */
  documentIds: string[];
  /** Anonymized user identifier (hashed) */
  anonymizedUserId: string;
  /** Whether the query was answered */
  isAnswered: boolean;
  /** Extracted topic/category */
  topic?: string;
}

/**
 * Retrieved document chunk with similarity score
 */
export interface RetrievedChunk {
  /** Document chunk */
  chunk: {
    id: string;
    documentId: string;
    content: string;
    pageNumber: number;
    sectionHeading: string;
    hierarchyPath: string;
  };
  /** Similarity score (0-1) */
  score: number;
}

/**
 * RAG context passed to the AI model
 */
export interface RAGContext {
  /** User query */
  query: string;
  /** Retrieved chunks */
  retrievedChunks: RetrievedChunk[];
  /** System instructions */
  systemPrompt: string;
  /** Chain-of-thought prompt template */
  cotPrompt: string;
}
