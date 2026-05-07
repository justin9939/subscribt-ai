/**
 * Document-related type definitions
 */

/**
 * Status of a policy document in the ingestion pipeline
 */
export type DocumentStatus = 'uploading' | 'processing' | 'ready' | 'failed';

/**
 * Metadata for an uploaded policy document
 */
export interface Document {
  /** Unique identifier for the document */
  id: string;
  /** Original filename */
  filename: string;
  /** Upload timestamp (ISO 8601) */
  uploadedAt: string;
  /** HR Manager identifier who uploaded the document */
  uploadedBy: string;
  /** Current processing status */
  status: DocumentStatus;
  /** S3 object key */
  s3Key: string;
  /** File size in bytes */
  fileSize: number;
  /** Error message if status is 'failed' */
  errorMessage?: string;
  /** Number of chunks created from this document */
  chunkCount?: number;
  /** Last updated timestamp (ISO 8601) */
  updatedAt: string;
}

/**
 * A semantically coherent section of a policy document
 */
export interface DocumentChunk {
  /** Unique identifier for the chunk */
  id: string;
  /** Parent document ID */
  documentId: string;
  /** Chunk text content */
  content: string;
  /** Vector embedding (array of floats) */
  embedding: number[];
  /** Page number in the original PDF */
  pageNumber: number;
  /** Section heading (H1/H2/H3) */
  sectionHeading: string;
  /** Hierarchical path (e.g., "Chapter 1 > Section 1.2 > Subsection 1.2.3") */
  hierarchyPath: string;
  /** Character position in the original document */
  startPosition: number;
  /** Character position in the original document */
  endPosition: number;
}

/**
 * Request payload for document upload
 */
export interface DocumentUploadRequest {
  /** Original filename */
  filename: string;
  /** MIME type */
  contentType: string;
  /** File size in bytes */
  fileSize: number;
}

/**
 * Response from document upload endpoint
 */
export interface DocumentUploadResponse {
  /** Unique document identifier */
  documentId: string;
  /** Pre-signed URL for uploading the file to S3 */
  uploadUrl: string;
  /** Expiration time for the pre-signed URL (ISO 8601) */
  expiresAt: string;
}

/**
 * Request to delete a document
 */
export interface DocumentDeleteRequest {
  /** Document ID to delete */
  documentId: string;
}

/**
 * Response from document deletion
 */
export interface DocumentDeleteResponse {
  /** Whether deletion was successful */
  success: boolean;
  /** Optional message */
  message?: string;
}

/**
 * Filter options for listing documents
 */
export interface DocumentListFilter {
  /** Filter by status */
  status?: DocumentStatus;
  /** Filter by uploader */
  uploadedBy?: string;
  /** Filter by date range (ISO 8601) */
  uploadedAfter?: string;
  /** Filter by date range (ISO 8601) */
  uploadedBefore?: string;
}

/**
 * Response from listing documents
 */
export interface DocumentListResponse {
  /** Array of documents */
  documents: Document[];
  /** Total count (for pagination) */
  totalCount: number;
  /** Next page token (if applicable) */
  nextToken?: string;
}
