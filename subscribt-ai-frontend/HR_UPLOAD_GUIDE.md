# HR Document Upload - Quick Start Guide

## Access the Upload Interface

Navigate to: **`/hr/upload`**

Or from the HR Dashboard: **`/hr`** → Click "Upload New Document"

## Upload Flow

### 1. Select Files

**Option A: Drag and Drop**
- Drag PDF file(s) from your file system
- Drop onto the upload area
- Multiple files supported

**Option B: Click to Browse**
- Click "Select Files" button
- Choose PDF file(s) from file picker
- Multiple selection supported

### 2. Automatic Validation

Files are validated before upload:
- ✅ **File Type**: PDF only
- ✅ **File Size**: Maximum 50MB per file
- ✅ **File Content**: Non-empty files only

Invalid files are rejected with clear error messages.

### 3. Upload Progress

Each file shows real-time status:

**Uploading** (Blue progress bar)
- File is being uploaded to S3
- Progress percentage shown

**Processing** (Blue spinner)
- Document is being processed by Step Functions
- OCR extraction in progress
- Markdown conversion
- Semantic chunking
- Embedding generation
- Vector indexing

**Complete** (Green checkmark)
- Document is ready for employee queries
- Fully indexed and searchable

**Error** (Red alert)
- Upload or processing failed
- Error message displayed
- Can retry by re-uploading

### 4. Remove Files

Click the **X** button to remove files from the upload queue (only available before upload completes).

## What Happens After Upload?

### Backend Processing Pipeline

```
1. File uploaded to S3
   ↓
2. S3 event triggers EventBridge
   ↓
3. EventBridge triggers Step Functions workflow
   ↓
4. Step Functions orchestrates:
   • Async Textract OCR (StartDocumentAnalysis)
   • Markdown conversion (preserves structure)
   • Semantic chunking (header-based: H1 → H2 → H3)
   • Titan embedding generation
   • OpenSearch vector upsert
   ↓
5. Document status updated in DynamoDB
   ↓
6. Document ready for employee queries
```

### Processing Time

- **Small documents** (< 10 pages): 1-2 minutes
- **Medium documents** (10-50 pages): 2-5 minutes
- **Large documents** (50+ pages): 5-15 minutes

Processing happens asynchronously. You can close the page and check back later.

## Supported Document Types

### ✅ Recommended
- Codes of Conduct
- Employee Handbooks
- Workplace Policies
- Employment Laws
- Rights Documents
- Compliance Guidelines
- Safety Procedures
- Benefits Documentation

### ❌ Not Supported
- Non-PDF formats (Word, Excel, images)
- Scanned documents without text layer (OCR will be applied)
- Password-protected PDFs
- Corrupted files

## Best Practices

### Document Preparation
1. **Use text-based PDFs** when possible (not scanned images)
2. **Include clear headings** (H1, H2, H3) for better chunking
3. **Keep file sizes reasonable** (< 20MB recommended)
4. **Use descriptive filenames** (e.g., "Employee_Handbook_2024.pdf")

### Upload Strategy
1. **Start with core policies** (Code of Conduct, Employee Handbook)
2. **Upload in batches** (5-10 documents at a time)
3. **Wait for processing** before uploading more
4. **Verify documents** in the Manage Documents page

### Quality Assurance
1. **Test queries** after upload to verify accuracy
2. **Check citations** to ensure proper chunking
3. **Review analytics** to identify gaps
4. **Update documents** as policies change

## Troubleshooting

### Upload Fails Immediately
- **Check file type**: Only PDF supported
- **Check file size**: Must be < 50MB
- **Check file integrity**: File may be corrupted
- **Check network**: Ensure stable internet connection

### Processing Takes Too Long
- **Large files**: May take 10-15 minutes
- **Check status**: Refresh the Manage Documents page
- **System load**: Processing may be queued

### Processing Fails
- **Check file content**: May be corrupted or password-protected
- **Check file format**: Must be valid PDF
- **Retry**: Re-upload the document
- **Contact support**: If issue persists

### Document Not Appearing in Queries
- **Wait for processing**: Must show "Complete" status
- **Check indexing**: May take a few minutes after processing
- **Verify content**: Document may not contain relevant information
- **Check query**: Try different search terms

## Security & Privacy

### Upload Security
- ✅ Pre-signed URLs with 15-minute expiration
- ✅ No S3 credentials exposed to client
- ✅ All uploads logged to CloudWatch
- ✅ Document metadata includes uploader identity

### Data Privacy
- ✅ Documents stored in private S3 bucket
- ✅ Access controlled via IAM roles
- ✅ Employee queries are anonymized
- ✅ HR cannot see individual employee queries

### Compliance
- ✅ All operations logged for audit trail
- ✅ Document versioning supported (TODO)
- ✅ Document deletion tracked
- ✅ GDPR/CCPA compliant (TODO: verify)

## Next Steps

After uploading documents:

1. **Manage Documents** (`/hr/documents`)
   - View all uploaded documents
   - Check processing status
   - Delete outdated documents

2. **View Analytics** (`/hr/analytics`)
   - See query trends
   - Identify policy gaps
   - Monitor employee concerns

3. **Share with Employees**
   - Employees can query at `/query`
   - No special access needed
   - Queries are anonymous

## API Reference

### POST `/api/upload`

Request:
```json
{
  "filename": "Employee_Handbook_2024.pdf",
  "contentType": "application/pdf",
  "fileSize": 1048576
}
```

Response:
```json
{
  "documentId": "doc_1234567890_abc123",
  "uploadUrl": "https://bucket.s3.region.amazonaws.com/...",
  "expiresAt": "2024-01-01T12:15:00Z"
}
```

## Component Usage

```tsx
import { DocumentUploadInterface } from '@/components/hr';

export default function UploadPage() {
  return <DocumentUploadInterface />;
}
```

## Environment Variables

```bash
# Required for upload functionality
AWS_REGION=us-east-1
S3_BUCKET_NAME=subscribt-ai-documents
DYNAMODB_TABLE_NAME=subscribt-documents
```

## Support

For issues or questions:
- Check the [Implementation Guide](./DOCUMENT_UPLOAD_IMPLEMENTATION.md)
- Review [Component Documentation](./components/hr/README.md)
- Check [Type Definitions](./types/document.ts)
