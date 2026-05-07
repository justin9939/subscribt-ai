# Pre-signed URL Generator Lambda

## Overview

This Lambda function generates secure pre-signed S3 upload URLs for HR document uploads. It validates file requirements (PDF only, max 100MB), creates initial metadata records in DynamoDB, and returns a time-limited upload URL.

## Input

```json
{
  "filename": "employee-handbook.pdf",
  "content_type": "application/pdf",
  "hr_manager_id": "hr-manager-123",
  "file_size_bytes": 5242880
}
```

### Input Validation

- **filename**: Must end with `.pdf` extension (1-255 characters)
- **content_type**: Must be `application/pdf`
- **hr_manager_id**: Non-empty string identifying the HR manager
- **file_size_bytes**: Must be > 0 and ≤ 100MB (104,857,600 bytes)

## Output

### Success Response (200)

```json
{
  "document_id": "550e8400-e29b-41d4-a716-446655440000",
  "upload_url": "https://bucket-name.s3.amazonaws.com/...",
  "expires_at": "2026-05-07T15:30:00Z",
  "s3_key": "documents/550e8400-e29b-41d4-a716-446655440000/original.pdf"
}
```

### Error Response (400/500)

```json
{
  "error": "ValidationError",
  "message": "Invalid request parameters",
  "details": {
    "validation_error": "File size exceeds maximum allowed size of 100MB"
  }
}
```

## DynamoDB Metadata

The function stores initial document metadata with status `"uploading"`:

```json
{
  "document_id": "550e8400-e29b-41d4-a716-446655440000",
  "filename": "employee-handbook.pdf",
  "hr_manager_id": "hr-manager-123",
  "s3_key": "documents/550e8400-e29b-41d4-a716-446655440000/original.pdf",
  "s3_bucket": "subscribt-ai-documents",
  "file_size_bytes": 5242880,
  "content_type": "application/pdf",
  "status": "uploading",
  "created_at": "2026-05-07T14:30:00Z",
  "updated_at": "2026-05-07T14:30:00Z"
}
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `S3_BUCKET_NAME` | Yes | - | S3 bucket for document storage |
| `DYNAMODB_TABLE_NAME` | Yes | - | DynamoDB table for document metadata |
| `PRESIGNED_URL_EXPIRATION` | No | 3600 | URL expiration time in seconds (1 hour) |
| `MAX_FILE_SIZE_MB` | No | 100 | Maximum file size in megabytes |

## IAM Permissions

The Lambda execution role requires:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl"
      ],
      "Resource": "arn:aws:s3:::${S3_BUCKET_NAME}/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem"
      ],
      "Resource": "arn:aws:dynamodb:${AWS_REGION}:${ACCOUNT_ID}:table/${DYNAMODB_TABLE_NAME}"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "xray:PutTraceSegments",
        "xray:PutTelemetryRecords"
      ],
      "Resource": "*"
    }
  ]
}
```

## Deployment

### Using AWS SAM

```yaml
# template.yaml
PresignedUrlGeneratorFunction:
  Type: AWS::Serverless::Function
  Properties:
    CodeUri: lambdas/presigned_url_generator/
    Handler: handler.handler
    Runtime: python3.11
    Timeout: 30
    MemorySize: 256
    Environment:
      Variables:
        S3_BUCKET_NAME: !Ref DocumentBucket
        DYNAMODB_TABLE_NAME: !Ref DocumentMetadataTable
        PRESIGNED_URL_EXPIRATION: 3600
        MAX_FILE_SIZE_MB: 100
        POWERTOOLS_SERVICE_NAME: presigned-url-generator
        POWERTOOLS_METRICS_NAMESPACE: SubscribtAI
        LOG_LEVEL: INFO
    Policies:
      - S3CrudPolicy:
          BucketName: !Ref DocumentBucket
      - DynamoDBCrudPolicy:
          TableName: !Ref DocumentMetadataTable
      - AWSXRayDaemonWriteAccess
    Events:
      ApiEvent:
        Type: Api
        Properties:
          Path: /api/upload/presigned-url
          Method: POST
```

Deploy:

```bash
cd backend/lambdas/presigned_url_generator
pip install -r requirements.txt -t .
cd ../../..
sam build
sam deploy --guided
```

### Using AWS CDK

```python
from aws_cdk import (
    aws_lambda as lambda_,
    aws_apigateway as apigw,
    Duration,
)

presigned_url_function = lambda_.Function(
    self, "PresignedUrlGenerator",
    runtime=lambda_.Runtime.PYTHON_3_11,
    handler="handler.handler",
    code=lambda_.Code.from_asset("backend/lambdas/presigned_url_generator"),
    timeout=Duration.seconds(30),
    memory_size=256,
    environment={
        "S3_BUCKET_NAME": document_bucket.bucket_name,
        "DYNAMODB_TABLE_NAME": metadata_table.table_name,
        "PRESIGNED_URL_EXPIRATION": "3600",
        "MAX_FILE_SIZE_MB": "100",
        "POWERTOOLS_SERVICE_NAME": "presigned-url-generator",
        "POWERTOOLS_METRICS_NAMESPACE": "SubscribtAI",
        "LOG_LEVEL": "INFO",
    },
    tracing=lambda_.Tracing.ACTIVE,
)

# Grant permissions
document_bucket.grant_put(presigned_url_function)
metadata_table.grant_write_data(presigned_url_function)

# Add API Gateway integration
api = apigw.RestApi(self, "SubscribtApi")
upload_resource = api.root.add_resource("api").add_resource("upload")
presigned_url_resource = upload_resource.add_resource("presigned-url")
presigned_url_resource.add_method(
    "POST",
    apigw.LambdaIntegration(presigned_url_function),
)
```

## Testing

### Local Testing

```python
# test_handler.py
import json
from handler import handler

event = {
    "body": json.dumps({
        "filename": "test-document.pdf",
        "content_type": "application/pdf",
        "hr_manager_id": "test-hr-123",
        "file_size_bytes": 1024000,
    })
}

response = handler(event, None)
print(json.dumps(json.loads(response["body"]), indent=2))
```

### Integration Testing

```bash
# Using curl
curl -X POST https://api.subscribt-ai.com/api/upload/presigned-url \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "employee-handbook.pdf",
    "content_type": "application/pdf",
    "hr_manager_id": "hr-manager-123",
    "file_size_bytes": 5242880
  }'
```

## Monitoring

### CloudWatch Metrics

The function emits structured logs with the following fields:
- `document_id`: Generated document identifier
- `hr_manager_id`: HR manager who initiated the upload
- `filename`: Original filename
- `s3_key`: Generated S3 object key
- `status`: Operation status

### CloudWatch Alarms

Recommended alarms:
- Error rate > 5% over 5 minutes
- Duration > 5 seconds (p99)
- Throttles > 0

### X-Ray Tracing

The function is instrumented with AWS X-Ray for distributed tracing. View traces in the X-Ray console to debug latency issues.

## Error Handling

| Error Type | Status Code | Description |
|------------|-------------|-------------|
| `ValidationError` | 400 | Invalid input parameters (wrong file type, size exceeded, etc.) |
| `ServiceError` | 500 | AWS service error (S3, DynamoDB unavailable) |
| `InternalError` | 500 | Unexpected error |

## Security Considerations

1. **Pre-signed URL Expiration**: URLs expire after 1 hour by default. Adjust `PRESIGNED_URL_EXPIRATION` as needed.
2. **Content-Type Enforcement**: The pre-signed URL enforces the specified content type. Uploads with different content types will fail.
3. **File Size Validation**: The pre-signed URL includes content-length-range conditions to prevent oversized uploads.
4. **Private S3 Bucket**: Ensure the S3 bucket has no public access. All access should be via pre-signed URLs or IAM roles.
5. **CORS Configuration**: Update `Access-Control-Allow-Origin` header for production to match your frontend domain.

## Frontend Integration

See the frontend upload component for integration example:

```typescript
// lib/api/upload.ts
import { PresignedUrlResponse } from '@/types/upload';

export async function getPresignedUrl(
  filename: string,
  contentType: string,
  hrManagerId: string,
  fileSizeBytes: number
): Promise<PresignedUrlResponse> {
  const response = await fetch('/api/upload/presigned-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename,
      content_type: contentType,
      hr_manager_id: hrManagerId,
      file_size_bytes: fileSizeBytes,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return response.json();
}
```
