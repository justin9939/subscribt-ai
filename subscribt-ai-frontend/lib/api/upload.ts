/**
 * Upload API client
 * Handles document upload flow: pre-signed URL generation and S3 upload
 */

import {
  PresignedUrlRequest,
  PresignedUrlResponse,
  ApiErrorResponse,
} from "@/types/upload";

/**
 * API configuration
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";
const PRESIGNED_URL_ENDPOINT = `${API_BASE_URL}/api/upload/presigned-url`;

/**
 * Custom error class for upload API errors
 */
export class UploadApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errorType: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = "UploadApiError";
  }
}

/**
 * Get pre-signed URL for document upload
 *
 * @param filename - Original filename (must end with .pdf)
 * @param contentType - MIME type (must be application/pdf)
 * @param hrManagerId - HR manager identifier
 * @param fileSizeBytes - File size in bytes (max 100MB)
 * @returns Pre-signed URL response with document_id and upload_url
 * @throws UploadApiError if validation fails or API returns error
 */
export async function getPresignedUrl(
  filename: string,
  contentType: string,
  hrManagerId: string,
  fileSizeBytes: number
): Promise<PresignedUrlResponse> {
  // Client-side validation
  if (!filename.toLowerCase().endsWith(".pdf")) {
    throw new UploadApiError(
      "Only PDF files are allowed",
      400,
      "ValidationError"
    );
  }

  if (contentType !== "application/pdf") {
    throw new UploadApiError(
      "Content type must be application/pdf",
      400,
      "ValidationError"
    );
  }

  const maxSizeBytes = 100 * 1024 * 1024; // 100MB
  if (fileSizeBytes > maxSizeBytes) {
    throw new UploadApiError(
      "File size exceeds maximum allowed size of 100MB",
      400,
      "ValidationError"
    );
  }

  if (fileSizeBytes <= 0) {
    throw new UploadApiError(
      "File size must be greater than 0",
      400,
      "ValidationError"
    );
  }

  // Prepare request payload
  const payload: PresignedUrlRequest = {
    filename,
    content_type: contentType,
    hr_manager_id: hrManagerId,
    file_size_bytes: fileSizeBytes,
  };

  try {
    const response = await fetch(PRESIGNED_URL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData: ApiErrorResponse = await response.json();
      throw new UploadApiError(
        errorData.message,
        response.status,
        errorData.error,
        errorData.details
      );
    }

    const data: PresignedUrlResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof UploadApiError) {
      throw error;
    }

    // Network or unexpected errors
    throw new UploadApiError(
      "Failed to get upload URL. Please check your connection and try again.",
      500,
      "NetworkError"
    );
  }
}

/**
 * Upload file to S3 using pre-signed URL
 *
 * @param uploadUrl - Pre-signed S3 upload URL
 * @param file - File to upload
 * @param onProgress - Optional progress callback (0-100)
 * @returns Promise that resolves when upload completes
 * @throws UploadApiError if upload fails
 */
export async function uploadToS3(
  uploadUrl: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Track upload progress
    if (onProgress) {
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });
    }

    // Handle completion
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(
          new UploadApiError(
            "Failed to upload file to S3",
            xhr.status,
            "S3UploadError"
          )
        );
      }
    });

    // Handle errors
    xhr.addEventListener("error", () => {
      reject(
        new UploadApiError(
          "Network error during file upload",
          0,
          "NetworkError"
        )
      );
    });

    xhr.addEventListener("abort", () => {
      reject(
        new UploadApiError("Upload was cancelled", 0, "UploadCancelled")
      );
    });

    // Send PUT request to S3
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.send(file);
  });
}

/**
 * Complete upload flow: get pre-signed URL and upload to S3
 *
 * @param file - File to upload
 * @param hrManagerId - HR manager identifier
 * @param onProgress - Optional progress callback (0-100)
 * @returns Document ID and S3 key
 * @throws UploadApiError if any step fails
 */
export async function uploadDocument(
  file: File,
  hrManagerId: string,
  onProgress?: (progress: number) => void
): Promise<{ documentId: string; s3Key: string }> {
  // Step 1: Get pre-signed URL (0-10% progress)
  if (onProgress) onProgress(5);

  const presignedUrlResponse = await getPresignedUrl(
    file.name,
    file.type,
    hrManagerId,
    file.size
  );

  if (onProgress) onProgress(10);

  // Step 2: Upload to S3 (10-100% progress)
  await uploadToS3(presignedUrlResponse.upload_url, file, (s3Progress) => {
    if (onProgress) {
      // Map S3 progress (0-100) to overall progress (10-100)
      const overallProgress = 10 + Math.round(s3Progress * 0.9);
      onProgress(overallProgress);
    }
  });

  return {
    documentId: presignedUrlResponse.document_id,
    s3Key: presignedUrlResponse.s3_key,
  };
}

/**
 * Format file size for display
 *
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "5.2 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Validate file before upload
 *
 * @param file - File to validate
 * @returns Validation result with error message if invalid
 */
export function validateFile(file: File): {
  valid: boolean;
  error?: string;
} {
  // Check file type
  if (file.type !== "application/pdf") {
    return {
      valid: false,
      error: "Only PDF files are allowed",
    };
  }

  // Check file extension
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return {
      valid: false,
      error: "File must have .pdf extension",
    };
  }

  // Check file size
  const maxSizeBytes = 100 * 1024 * 1024; // 100MB
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of 100MB (current: ${formatFileSize(file.size)})`,
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: "File is empty",
    };
  }

  return { valid: true };
}
