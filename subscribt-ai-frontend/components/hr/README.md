# HR Manager Components

Components specific to the HR Manager persona for policy management and analytics.

## Components

### DocumentUploadInterface

Drag-and-drop interface for uploading policy documents (PDFs).

**Features:**
- Drag-and-drop file upload
- File validation (PDF only, max 50MB)
- Multiple file upload support
- Real-time upload progress tracking
- Processing status indicators
- Error handling with user-friendly messages

**Usage:**
```tsx
import { DocumentUploadInterface } from '@/components/hr';

export default function UploadPage() {
  return <DocumentUploadInterface />;
}
```

**Upload Flow:**
1. User selects or drops PDF file(s)
2. Client validates file type and size
3. Client calls `/api/upload` to get pre-signed S3 URL
4. Client uploads directly to S3 using pre-signed URL
5. S3 upload triggers EventBridge event
6. EventBridge triggers Step Functions workflow
7. Step Functions orchestrates:
   - Async Textract OCR (`StartDocumentAnalysis`)
   - Markdown conversion
   - Semantic chunking (header-based)
   - Titan embedding generation
   - OpenSearch vector upsert
8. Document status updates in DynamoDB throughout pipeline

**Status States:**
- `uploading`: File is being uploaded to S3
- `processing`: Step Functions workflow is running (OCR, chunking, embedding)
- `complete`: Document is indexed and ready for queries
- `error`: Upload or processing failed

## Architecture Notes

### Persona Separation
HR components are strictly separated from employee components. No shared UI between personas except base shadcn/ui primitives.

### Event-Driven Pipeline
Document processing is fully event-driven:
- S3 upload event → EventBridge → Step Functions
- No synchronous Lambda calls from the upload endpoint
- Avoids Lambda 15-minute timeout on large PDFs

### Security
- All S3 uploads use pre-signed URLs with 15-minute expiration
- No direct S3 credentials exposed to client
- Document metadata stored in DynamoDB with uploader identity
- CloudWatch structured logging for audit trail

## Related Files

- `/app/(hr)/upload/page.tsx` - Upload page
- `/app/api/upload/route.ts` - Pre-signed URL generation endpoint
- `/types/document.ts` - Document type definitions
- `/lib/db/documents.ts` - DynamoDB document operations (TODO)

## TODO

- [ ] Implement actual AWS SDK integration for pre-signed URLs
- [ ] Add DynamoDB document metadata storage
- [ ] Add WebSocket or polling for real-time processing status updates
- [ ] Add document list/management interface
- [ ] Add document deletion functionality
- [ ] Add bulk upload support
- [ ] Add upload history and analytics
