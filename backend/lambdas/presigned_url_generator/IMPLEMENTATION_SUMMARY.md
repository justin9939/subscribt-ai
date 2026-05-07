# Pre-signed URL Generator Lambda - Implementation Summary

## Overview

Implemented a production-ready Lambda function that generates secure pre-signed S3 upload URLs for HR document uploads. The function validates file requirements, creates initial metadata records in DynamoDB, and returns time-limited upload URLs.

## What Was Implemented

### 1. Lambda Function (`handler.py`)

**Core Features:**
- ✅ Pre-signed URL generation with S3 client
- ✅ File validation (PDF only, max 100MB)
- ✅ DynamoDB metadata storage with "uploading" status
- ✅ Pydantic models for request/response validation
- ✅ AWS Lambda Powertools for structured logging and tracing
- ✅ Comprehensive error handling with typed error responses
- ✅ CORS headers for frontend integration

**Input Validation:**
- Filename must end with `.pdf`
- Content type must be `application/pdf`
- File size must be > 0 and ≤ 100MB
- HR manager ID required

**Output:**
- Unique document ID (UUID)
- Pre-signed S3 upload URL
- Expiration timestamp (ISO 8601)
- S3 object key

**DynamoDB Metadata:**
```json
{
  "document_id": "uuid",
  "filename": "original-name.pdf",
  "hr_manager_id": "hr-123",
  "s3_key": "documents/{uuid}/original.pdf",
  "s3_bucket": "bucket-name",
  "file_size_bytes": 1024000,
  "content_type": "application/pdf",
  "status": "uploading",
  "created_at": "2026-05-07T14:30:00Z",
  "updated_at": "2026-05-07T14:30:00Z"
}
```

### 2. Frontend Integration

**TypeScript Types (`types/upload.ts`):**
- `PresignedUrlRequest` - Request payload interface
- `PresignedUrlResponse` - Response interface
- `ApiErrorResponse` - Error response interface
- `DocumentMetadata` - DynamoDB metadata interface
- `DocumentStatus` - Status type union
- `UploadProgress` - Upload progress tracking

**API Client (`lib/api/upload.ts`):**
- `getPresignedUrl()` - Get pre-signed URL from Lambda
- `uploadToS3()` - Upload file to S3 with progress tracking
- `uploadDocument()` - Complete upload flow (get URL + upload)
- `validateFile()` - Client-side file validation
- `formatFileSize()` - File size formatting utility
- `UploadApiError` - Custom error class

**Features:**
- Client-side validation before API call
- Progress tracking with callbacks (0-100%)
- XMLHttpRequest for upload progress monitoring
- Comprehensive error handling
- Type-safe API interactions

### 3. Testing (`test_handler.py`)

**Test Coverage:**
- ✅ Request validation (valid/invalid inputs)
- ✅ S3 key generation
- ✅ Pre-signed URL creation
- ✅ DynamoDB metadata storage
- ✅ Lambda handler success/error paths
- ✅ AWS service error handling
- ✅ Edge cases (missing body, invalid JSON, etc.)

**Run Tests:**
```bash
cd backend/lambdas/presigned_url_generator
pip install -r requirements.txt
pip install pytest pytest-mock
python -m pytest test_handler.py -v
```

### 4. Infrastructure as Code

**SAM Template (`template.yaml`):**
- Lambda function with proper IAM policies
- API Gateway with CORS configuration
- CloudWatch Log Group with 30-day retention
- CloudWatch Alarms:
  - Error rate > 5 in 5 minutes
  - Any throttles
  - P99 duration > 5 seconds
- Parameterized for multiple environments (dev/staging/prod)

**Deployment Script (`deploy.sh`):**
- Environment validation
- Dependency installation
- Test execution before deployment
- SAM build and deploy
- Output retrieval and display
- Production confirmation prompt

### 5. Documentation

**README.md:**
- Complete API documentation
- Input/output examples
- Environment variables
- IAM permissions
- Deployment instructions (SAM and CDK)
- Testing guide
- Monitoring setup
- Security considerations
- Frontend integration examples

## Architecture

```
┌─────────────┐
│   Frontend  │
│  (Next.js)  │
└──────┬──────┘
       │ POST /api/upload/presigned-url
       │ {filename, content_type, hr_manager_id, file_size_bytes}
       ↓
┌──────────────────┐
│  API Gateway     │
└──────┬───────────┘
       │
       ↓
┌──────────────────────────────────────┐
│  Lambda: Pre-signed URL Generator    │
│  ┌────────────────────────────────┐  │
│  │ 1. Validate request (Pydantic) │  │
│  │ 2. Generate document ID (UUID) │  │
│  │ 3. Generate S3 key             │  │
│  │ 4. Create pre-signed URL       │  │
│  │ 5. Store metadata in DynamoDB  │  │
│  │ 6. Return response             │  │
│  └────────────────────────────────┘  │
└──────┬───────────────────┬───────────┘
       │                   │
       ↓                   ↓
┌──────────────┐    ┌──────────────┐
│  S3 Bucket   │    │  DynamoDB    │
│  (private)   │    │  (metadata)  │
└──────────────┘    └──────────────┘
       ↑
       │ PUT with pre-signed URL
       │ (from frontend)
┌──────┴──────┐
│   Frontend  │
└─────────────┘
```

## File Structure

```
backend/lambdas/presigned_url_generator/
├── handler.py                    # Lambda function implementation
├── requirements.txt              # Python dependencies
├── test_handler.py              # Unit tests
├── template.yaml                # SAM template
├── deploy.sh                    # Deployment script
├── README.md                    # Complete documentation
└── IMPLEMENTATION_SUMMARY.md    # This file

subscribt-ai-frontend/
├── types/
│   └── upload.ts                # TypeScript type definitions
└── lib/
    └── api/
        └── upload.ts            # Frontend API client
```

## Environment Variables

### Lambda Function

```bash
# Required
S3_BUCKET_NAME=subscribt-ai-documents
DYNAMODB_TABLE_NAME=subscribt-ai-document-metadata
AWS_REGION=us-east-1

# Optional (with defaults)
PRESIGNED_URL_EXPIRATION=3600    # 1 hour
MAX_FILE_SIZE_MB=100             # 100MB

# AWS Lambda Powertools
POWERTOOLS_SERVICE_NAME=presigned-url-generator
POWERTOOLS_METRICS_NAMESPACE=SubscribtAI
LOG_LEVEL=INFO
```

### Frontend

```bash
# .env.local
NEXT_PUBLIC_API_BASE_URL=https://api.subscribt-ai.com
```

## Deployment

### Prerequisites

1. AWS CLI configured with appropriate credentials
2. AWS SAM CLI installed (`pip install aws-sam-cli`)
3. S3 bucket created for document storage
4. DynamoDB table created for metadata

### Deploy

```bash
cd backend/lambdas/presigned_url_generator

# Set environment variables
export DOCUMENT_BUCKET_NAME=subscribt-ai-documents
export DOCUMENT_METADATA_TABLE_NAME=subscribt-ai-document-metadata
export AWS_REGION=us-east-1

# Deploy to dev
./deploy.sh dev

# Deploy to production (requires confirmation)
./deploy.sh prod
```

### Verify Deployment

```bash
# Test the endpoint
curl -X POST https://your-api-endpoint/api/upload/presigned-url \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "test.pdf",
    "content_type": "application/pdf",
    "hr_manager_id": "test-hr-123",
    "file_size_bytes": 1024000
  }'
```

## Frontend Usage

```typescript
import { uploadDocument } from '@/lib/api/upload';

async function handleFileUpload(file: File, hrManagerId: string) {
  try {
    const { documentId, s3Key } = await uploadDocument(
      file,
      hrManagerId,
      (progress) => {
        console.log(`Upload progress: ${progress}%`);
      }
    );
    
    console.log('Upload complete!', { documentId, s3Key });
  } catch (error) {
    if (error instanceof UploadApiError) {
      console.error('Upload failed:', error.message);
    }
  }
}
```

## Security Features

1. **Private S3 Bucket**: All buckets configured as private, no public access
2. **Pre-signed URL Expiration**: URLs expire after 1 hour (configurable)
3. **Content-Type Enforcement**: Pre-signed URL enforces PDF content type
4. **File Size Validation**: Both client-side and server-side validation
5. **IAM Scoped Roles**: Lambda has minimal required permissions
6. **CORS Configuration**: Configurable allowed origins
7. **Structured Logging**: All operations logged to CloudWatch for audit

## Monitoring

### CloudWatch Logs

Structured JSON logs include:
- Request ID
- Document ID
- HR manager ID
- Operation outcomes
- Error details

### CloudWatch Alarms

- **Error Alarm**: Triggers when error count > 5 in 5 minutes
- **Throttle Alarm**: Triggers on any throttles
- **Duration Alarm**: Triggers when P99 duration > 5 seconds

### X-Ray Tracing

Full distributed tracing enabled for:
- API Gateway → Lambda
- Lambda → S3
- Lambda → DynamoDB

## Next Steps

1. **Create S3 Bucket and DynamoDB Table**
   - S3 bucket with private access
   - DynamoDB table with `document_id` as partition key

2. **Deploy Lambda Function**
   - Run `./deploy.sh dev` to deploy to development
   - Test with sample requests

3. **Update Frontend Environment**
   - Add `NEXT_PUBLIC_API_BASE_URL` to `.env.local`
   - Point to deployed API Gateway endpoint

4. **Integrate with Upload UI**
   - Use `uploadDocument()` function in upload component
   - Add progress indicators
   - Handle errors gracefully

5. **Set Up EventBridge Trigger**
   - Configure S3 event notifications to EventBridge
   - Trigger Step Functions workflow on upload completion

6. **Configure Monitoring**
   - Set up SNS topic for CloudWatch alarms
   - Configure alarm notifications

## Compliance with Requirements

✅ **Requirement 1: Document Upload and Storage**
- Generates pre-signed URLs for secure upload
- Stores metadata in DynamoDB
- Validates file size (100MB limit)
- Validates PDF format only

✅ **Requirement 15: Security and Access Control**
- Private S3 buckets
- Pre-signed URLs with expiration
- Scoped IAM roles
- HTTPS enforcement
- Input validation and sanitization

✅ **Requirement 16: Observability and Tracing**
- Structured JSON logs to CloudWatch
- AWS X-Ray tracing enabled
- Request identifiers in all logs
- Operation outcomes logged

✅ **Requirement 17: Error Handling and User Feedback**
- Specific error messages for validation failures
- User-friendly error responses
- Detailed error logging for debugging

✅ **Requirement 18: Frontend Type Safety**
- TypeScript with strict mode
- Pydantic models for Lambda
- Shared types in /types directory
- Runtime validation

## Tech Stack Compliance

✅ **Backend**
- Python with type hints
- Pydantic models for validation
- AWS Lambda (Serverless)
- Structured logging to CloudWatch
- AWS X-Ray tracing

✅ **Frontend**
- TypeScript (strict mode)
- Type-safe API client
- Proper error handling
- Progress tracking

✅ **AWS Services**
- Lambda for compute
- S3 for storage
- DynamoDB for metadata
- API Gateway for HTTP endpoint
- CloudWatch for logging
- X-Ray for tracing
