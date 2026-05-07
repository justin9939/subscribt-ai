# Upload API Quick Reference

## Overview

The upload API provides a secure two-step process for uploading PDF documents:
1. Get a pre-signed URL from the Lambda function
2. Upload the file directly to S3 using the pre-signed URL

## Quick Start

```typescript
import { uploadDocument, validateFile } from '@/lib/api/upload';

// In your component
const handleUpload = async (file: File) => {
  // 1. Validate file
  const validation = validateFile(file);
  if (!validation.valid) {
    alert(validation.error);
    return;
  }

  // 2. Upload with progress tracking
  try {
    const { documentId, s3Key } = await uploadDocument(
      file,
      'hr-manager-123', // Replace with actual HR manager ID
      (progress) => {
        console.log(`Upload: ${progress}%`);
        // Update your progress bar here
      }
    );
    
    console.log('Success!', documentId);
  } catch (error) {
    console.error('Upload failed:', error.message);
  }
};
```

## API Functions

### `validateFile(file: File)`

Validates a file before upload.

**Parameters:**
- `file`: File object to validate

**Returns:**
```typescript
{
  valid: boolean;
  error?: string;
}
```

**Example:**
```typescript
const validation = validateFile(file);
if (!validation.valid) {
  alert(validation.error);
  return;
}
```

---

### `getPresignedUrl(filename, contentType, hrManagerId, fileSizeBytes)`

Gets a pre-signed URL for uploading to S3.

**Parameters:**
- `filename`: Original filename (must end with .pdf)
- `contentType`: MIME type (must be "application/pdf")
- `hrManagerId`: HR manager identifier
- `fileSizeBytes`: File size in bytes

**Returns:**
```typescript
{
  document_id: string;
  upload_url: string;
  expires_at: string;
  s3_key: string;
}
```

**Throws:** `UploadApiError` on validation or API errors

**Example:**
```typescript
try {
  const response = await getPresignedUrl(
    'handbook.pdf',
    'application/pdf',
    'hr-123',
    1024000
  );
  console.log('Document ID:', response.document_id);
  console.log('Upload URL:', response.upload_url);
} catch (error) {
  if (error instanceof UploadApiError) {
    console.error(error.message);
  }
}
```

---

### `uploadToS3(uploadUrl, file, onProgress?)`

Uploads a file to S3 using a pre-signed URL.

**Parameters:**
- `uploadUrl`: Pre-signed S3 upload URL
- `file`: File object to upload
- `onProgress`: Optional callback for progress updates (0-100)

**Returns:** `Promise<void>`

**Throws:** `UploadApiError` on upload failure

**Example:**
```typescript
await uploadToS3(
  presignedUrl,
  file,
  (progress) => {
    setUploadProgress(progress);
  }
);
```

---

### `uploadDocument(file, hrManagerId, onProgress?)`

Complete upload flow: get pre-signed URL and upload to S3.

**Parameters:**
- `file`: File object to upload
- `hrManagerId`: HR manager identifier
- `onProgress`: Optional callback for progress updates (0-100)

**Returns:**
```typescript
{
  documentId: string;
  s3Key: string;
}
```

**Throws:** `UploadApiError` on any failure

**Example:**
```typescript
const { documentId, s3Key } = await uploadDocument(
  file,
  'hr-123',
  (progress) => {
    console.log(`${progress}%`);
  }
);
```

---

### `formatFileSize(bytes)`

Formats file size for display.

**Parameters:**
- `bytes`: File size in bytes

**Returns:** Formatted string (e.g., "5.2 MB")

**Example:**
```typescript
const size = formatFileSize(5242880);
console.log(size); // "5 MB"
```

## Error Handling

All functions throw `UploadApiError` with the following properties:

```typescript
class UploadApiError extends Error {
  message: string;      // Human-readable error message
  statusCode: number;   // HTTP status code
  errorType: string;    // Error type identifier
  details?: object;     // Additional error details
}
```

**Error Types:**
- `ValidationError`: Invalid input (wrong file type, size exceeded, etc.)
- `NetworkError`: Network or connection error
- `S3UploadError`: S3 upload failed
- `UploadCancelled`: Upload was cancelled by user
- `ServiceError`: Backend service error

**Example:**
```typescript
try {
  await uploadDocument(file, hrManagerId);
} catch (error) {
  if (error instanceof UploadApiError) {
    switch (error.errorType) {
      case 'ValidationError':
        alert(`Invalid file: ${error.message}`);
        break;
      case 'NetworkError':
        alert('Network error. Please check your connection.');
        break;
      case 'S3UploadError':
        alert('Upload failed. Please try again.');
        break;
      default:
        alert('An unexpected error occurred.');
    }
  }
}
```

## Validation Rules

### File Type
- ✅ Must be PDF (`application/pdf`)
- ❌ No other file types allowed

### File Size
- ✅ Must be > 0 bytes
- ✅ Must be ≤ 100MB (104,857,600 bytes)
- ❌ Empty files rejected
- ❌ Files over 100MB rejected

### Filename
- ✅ Must end with `.pdf` extension
- ❌ Other extensions rejected

## Complete Example: Upload Component

```typescript
'use client';

import { useState } from 'react';
import { uploadDocument, validateFile, formatFileSize, UploadApiError } from '@/lib/api/upload';

export function DocumentUpload({ hrManagerId }: { hrManagerId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file
    const validation = validateFile(selectedFile);
    if (!validation.valid) {
      setError(validation.error!);
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      const result = await uploadDocument(
        file,
        hrManagerId,
        (p) => setProgress(p)
      );

      setDocumentId(result.documentId);
      console.log('Upload complete:', result);
    } catch (err) {
      if (err instanceof UploadApiError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileChange}
        disabled={uploading}
      />

      {file && (
        <div>
          <p>Selected: {file.name} ({formatFileSize(file.size)})</p>
          <button onClick={handleUpload} disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      )}

      {uploading && (
        <div>
          <progress value={progress} max={100} />
          <span>{progress}%</span>
        </div>
      )}

      {error && <div style={{ color: 'red' }}>{error}</div>}
      {documentId && <div style={{ color: 'green' }}>Success! Document ID: {documentId}</div>}
    </div>
  );
}
```

## Environment Configuration

Add to your `.env.local`:

```bash
# API base URL (without trailing slash)
NEXT_PUBLIC_API_BASE_URL=https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/dev
```

The upload API will call:
```
${NEXT_PUBLIC_API_BASE_URL}/api/upload/presigned-url
```

## Progress Tracking

The `onProgress` callback receives values from 0 to 100:

- **0-10%**: Getting pre-signed URL
- **10-100%**: Uploading to S3

```typescript
await uploadDocument(file, hrManagerId, (progress) => {
  if (progress < 10) {
    console.log('Preparing upload...');
  } else if (progress < 100) {
    console.log(`Uploading: ${progress}%`);
  } else {
    console.log('Upload complete!');
  }
});
```

## TypeScript Types

All types are exported from `@/types/upload`:

```typescript
import type {
  PresignedUrlRequest,
  PresignedUrlResponse,
  ApiErrorResponse,
  DocumentMetadata,
  DocumentStatus,
  UploadProgress,
} from '@/types/upload';
```

## Testing

### Test with a sample file:

```typescript
// Create a test PDF blob
const testBlob = new Blob(['%PDF-1.4 test'], { type: 'application/pdf' });
const testFile = new File([testBlob], 'test.pdf', { type: 'application/pdf' });

// Upload
const result = await uploadDocument(testFile, 'test-hr-123');
console.log('Test upload:', result);
```

## Common Issues

### Issue: "Only PDF files are allowed"
**Solution:** Ensure file has `.pdf` extension and `application/pdf` MIME type

### Issue: "File size exceeds maximum"
**Solution:** File must be ≤ 100MB. Compress or split large files.

### Issue: "Network error"
**Solution:** Check `NEXT_PUBLIC_API_BASE_URL` is set correctly and API is deployed

### Issue: "Failed to upload file to S3"
**Solution:** Pre-signed URL may have expired (1 hour limit). Get a new URL and retry.

## Security Notes

1. **Pre-signed URLs expire after 1 hour** - Don't cache them
2. **Upload directly to S3** - File never passes through your Next.js server
3. **Content-Type is enforced** - S3 will reject non-PDF uploads
4. **File size is validated** - Both client-side and server-side

## Support

For issues or questions:
1. Check CloudWatch logs for the Lambda function
2. Verify API Gateway endpoint is correct
3. Ensure S3 bucket and DynamoDB table exist
4. Check IAM permissions for Lambda execution role
