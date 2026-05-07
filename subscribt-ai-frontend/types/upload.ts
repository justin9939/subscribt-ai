/**
 * Type definitions for document upload API
 */

/**
 * Request payload for pre-signed URL generation
 */
export interface PresignedUrlRequest {
  filename: string;
  content_type: string;
  hr_manager_id: string;
  file_size_bytes: number;
}

/**
 * Response from pre-signed URL generation
 */
export interface PresignedUrlResponse {
  document_id: string;
  upload_url: string;
  expires_at: string;
  s3_key: string;
}

/**
 * Error response from API
 */
export interface ApiErrorResponse {
  error: string;
  message: string;
  details?: Record<string, any>;
}

/**
 * Document metadata stored in DynamoDB
 */
export interface DocumentMetadata {
  document_id: string;
  filename: string;
  hr_manager_id: string;
  s3_key: string;
  s3_bucket: string;
  file_size_bytes: number;
  content_type: string;
  status: DocumentStatus;
  created_at: string;
  updated_at: string;
}

/**
 * Document processing status
 */
export type DocumentStatus = 
  | "uploading"
  | "processing"
  | "ready"
  | "failed";

/**
 * Upload progress state
 */
export interface UploadProgress {
  document_id: string;
  filename: string;
  progress: number; // 0-100
  status: "uploading" | "processing" | "complete" | "error";
  error_message?: string;
}
