# Pre-signed URL Generator Lambda - Deployment Checklist

## Pre-Deployment

### 1. AWS Infrastructure Setup

- [ ] **S3 Bucket Created**
  ```bash
  aws s3 mb s3://subscribt-ai-documents --region us-east-1
  ```
  - [ ] Bucket is private (no public access)
  - [ ] Versioning enabled (recommended)
  - [ ] Encryption enabled (recommended)

- [ ] **DynamoDB Table Created**
  ```bash
  aws dynamodb create-table \
    --table-name subscribt-ai-document-metadata \
    --attribute-definitions AttributeName=document_id,AttributeType=S \
    --key-schema AttributeName=document_id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region us-east-1
  ```
  - [ ] Partition key: `document_id` (String)
  - [ ] Billing mode: PAY_PER_REQUEST or PROVISIONED
  - [ ] Point-in-time recovery enabled (recommended for production)

### 2. AWS CLI Configuration

- [ ] AWS CLI installed
  ```bash
  aws --version
  ```

- [ ] AWS credentials configured
  ```bash
  aws configure
  # or use AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY env vars
  ```

- [ ] Correct AWS region set
  ```bash
  export AWS_REGION=us-east-1
  ```

### 3. SAM CLI Setup

- [ ] SAM CLI installed
  ```bash
  sam --version
  # If not installed: pip install aws-sam-cli
  ```

- [ ] Docker installed (for SAM build with containers)
  ```bash
  docker --version
  ```

### 4. Python Environment

- [ ] Python 3.11 installed
  ```bash
  python3 --version
  ```

- [ ] Dependencies installed
  ```bash
  cd backend/lambdas/presigned_url_generator
  pip install -r requirements.txt
  ```

- [ ] Test dependencies installed
  ```bash
  pip install pytest pytest-mock
  ```

### 5. Environment Variables

- [ ] Set required environment variables
  ```bash
  export DOCUMENT_BUCKET_NAME=subscribt-ai-documents
  export DOCUMENT_METADATA_TABLE_NAME=subscribt-ai-document-metadata
  export AWS_REGION=us-east-1
  ```

- [ ] Optional: Set custom values
  ```bash
  export PRESIGNED_URL_EXPIRATION=3600  # 1 hour
  export MAX_FILE_SIZE_MB=100           # 100MB
  ```

## Testing

### 1. Unit Tests

- [ ] Run unit tests
  ```bash
  cd backend/lambdas/presigned_url_generator
  python -m pytest test_handler.py -v
  ```

- [ ] All tests pass
- [ ] Code coverage > 80% (optional)
  ```bash
  pip install pytest-cov
  python -m pytest test_handler.py --cov=handler --cov-report=html
  ```

### 2. Local Testing (Optional)

- [ ] Test Lambda locally with SAM
  ```bash
  sam build
  sam local invoke PresignedUrlGeneratorFunction \
    --event test_event.json
  ```

- [ ] Create test event file (`test_event.json`):
  ```json
  {
    "body": "{\"filename\":\"test.pdf\",\"content_type\":\"application/pdf\",\"hr_manager_id\":\"test-hr\",\"file_size_bytes\":1024000}"
  }
  ```

## Deployment

### 1. Build

- [ ] Build SAM application
  ```bash
  cd backend/lambdas/presigned_url_generator
  sam build --use-container
  ```

- [ ] Build succeeds without errors

### 2. Deploy to Development

- [ ] Deploy to dev environment
  ```bash
  ./deploy.sh dev
  ```

- [ ] Deployment succeeds
- [ ] Note the API endpoint URL
- [ ] Note the Lambda function name

### 3. Verify Deployment

- [ ] Check Lambda function exists
  ```bash
  aws lambda get-function \
    --function-name subscribt-ai-presigned-url-generator-dev \
    --region us-east-1
  ```

- [ ] Check API Gateway endpoint
  ```bash
  aws cloudformation describe-stacks \
    --stack-name subscribt-ai-presigned-url-generator-dev \
    --region us-east-1 \
    --query "Stacks[0].Outputs"
  ```

### 4. Integration Testing

- [ ] Test API endpoint with curl
  ```bash
  curl -X POST https://YOUR-API-ENDPOINT/api/upload/presigned-url \
    -H "Content-Type: application/json" \
    -d '{
      "filename": "test.pdf",
      "content_type": "application/pdf",
      "hr_manager_id": "test-hr-123",
      "file_size_bytes": 1024000
    }'
  ```

- [ ] Response includes:
  - [ ] `document_id`
  - [ ] `upload_url`
  - [ ] `expires_at`
  - [ ] `s3_key`

- [ ] Test file upload to S3 using pre-signed URL
  ```bash
  # Create a test PDF
  echo "%PDF-1.4 test" > test.pdf
  
  # Upload using the pre-signed URL from previous step
  curl -X PUT "PRESIGNED_URL_FROM_RESPONSE" \
    -H "Content-Type: application/pdf" \
    --data-binary @test.pdf
  ```

- [ ] Verify file in S3
  ```bash
  aws s3 ls s3://subscribt-ai-documents/documents/ --recursive
  ```

- [ ] Verify metadata in DynamoDB
  ```bash
  aws dynamodb get-item \
    --table-name subscribt-ai-document-metadata \
    --key '{"document_id":{"S":"DOCUMENT_ID_FROM_RESPONSE"}}' \
    --region us-east-1
  ```

### 5. Error Testing

- [ ] Test validation errors
  ```bash
  # Invalid file type
  curl -X POST https://YOUR-API-ENDPOINT/api/upload/presigned-url \
    -H "Content-Type: application/json" \
    -d '{
      "filename": "test.docx",
      "content_type": "application/msword",
      "hr_manager_id": "test-hr-123",
      "file_size_bytes": 1024000
    }'
  # Should return 400 with ValidationError
  ```

- [ ] Test file size limit
  ```bash
  # File too large
  curl -X POST https://YOUR-API-ENDPOINT/api/upload/presigned-url \
    -H "Content-Type: application/json" \
    -d '{
      "filename": "test.pdf",
      "content_type": "application/pdf",
      "hr_manager_id": "test-hr-123",
      "file_size_bytes": 104857601
    }'
  # Should return 400 with file size error
  ```

## Monitoring Setup

### 1. CloudWatch Logs

- [ ] Verify log group exists
  ```bash
  aws logs describe-log-groups \
    --log-group-name-prefix /aws/lambda/subscribt-ai-presigned-url-generator \
    --region us-east-1
  ```

- [ ] Check recent logs
  ```bash
  aws logs tail /aws/lambda/subscribt-ai-presigned-url-generator-dev \
    --follow \
    --region us-east-1
  ```

### 2. CloudWatch Alarms

- [ ] Verify alarms created
  ```bash
  aws cloudwatch describe-alarms \
    --alarm-name-prefix subscribt-ai-presigned-url-generator \
    --region us-east-1
  ```

- [ ] Alarms exist for:
  - [ ] Error rate
  - [ ] Throttles
  - [ ] Duration (P99)

### 3. SNS Notifications (Optional)

- [ ] Create SNS topic for alarm notifications
  ```bash
  aws sns create-topic \
    --name subscribt-ai-lambda-alarms \
    --region us-east-1
  ```

- [ ] Subscribe email to topic
  ```bash
  aws sns subscribe \
    --topic-arn arn:aws:sns:us-east-1:ACCOUNT_ID:subscribt-ai-lambda-alarms \
    --protocol email \
    --notification-endpoint your-email@example.com \
    --region us-east-1
  ```

- [ ] Update alarms to use SNS topic
  ```bash
  aws cloudwatch put-metric-alarm \
    --alarm-name subscribt-ai-presigned-url-generator-errors-dev \
    --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:subscribt-ai-lambda-alarms \
    --region us-east-1
  ```

### 4. X-Ray Tracing

- [ ] Verify X-Ray tracing enabled
  ```bash
  aws lambda get-function-configuration \
    --function-name subscribt-ai-presigned-url-generator-dev \
    --query "TracingConfig" \
    --region us-east-1
  ```

- [ ] Check X-Ray traces in console
  - [ ] Navigate to AWS X-Ray console
  - [ ] View service map
  - [ ] View traces for recent requests

## Frontend Integration

### 1. Environment Configuration

- [ ] Add API endpoint to frontend `.env.local`
  ```bash
  NEXT_PUBLIC_API_BASE_URL=https://YOUR-API-ENDPOINT
  ```

- [ ] Restart Next.js dev server
  ```bash
  cd subscribt-ai-frontend
  npm run dev
  ```

### 2. Test Frontend Integration

- [ ] Import upload functions in component
  ```typescript
  import { uploadDocument } from '@/lib/api/upload';
  ```

- [ ] Test file upload from UI
- [ ] Verify progress tracking works
- [ ] Verify error handling works
- [ ] Check browser console for errors

### 3. CORS Configuration

- [ ] Update CORS settings in `template.yaml` for production
  ```yaml
  Cors:
    AllowOrigin: "'https://your-frontend-domain.com'"
  ```

- [ ] Redeploy after CORS changes
  ```bash
  ./deploy.sh dev
  ```

## Production Deployment

### 1. Pre-Production Checklist

- [ ] All dev/staging tests pass
- [ ] Load testing completed (optional)
- [ ] Security review completed
- [ ] CORS configured for production domain
- [ ] Monitoring and alarms configured
- [ ] SNS notifications set up
- [ ] Backup and recovery plan documented

### 2. Deploy to Production

- [ ] Deploy to production
  ```bash
  ./deploy.sh prod
  # Will prompt for confirmation
  ```

- [ ] Verify production deployment
- [ ] Run smoke tests on production endpoint
- [ ] Monitor CloudWatch logs for errors

### 3. Post-Deployment

- [ ] Update frontend production environment
  ```bash
  # In Amplify console or .env.production
  NEXT_PUBLIC_API_BASE_URL=https://prod-api-endpoint
  ```

- [ ] Test production upload flow
- [ ] Monitor for 24 hours
- [ ] Document production endpoint and configuration

## Rollback Plan

### If Deployment Fails

- [ ] Check CloudFormation stack events
  ```bash
  aws cloudformation describe-stack-events \
    --stack-name subscribt-ai-presigned-url-generator-dev \
    --region us-east-1
  ```

- [ ] Delete failed stack
  ```bash
  aws cloudformation delete-stack \
    --stack-name subscribt-ai-presigned-url-generator-dev \
    --region us-east-1
  ```

- [ ] Fix issues and redeploy

### If Production Issues Occur

- [ ] Rollback to previous version
  ```bash
  aws lambda update-function-code \
    --function-name subscribt-ai-presigned-url-generator-prod \
    --s3-bucket YOUR-DEPLOYMENT-BUCKET \
    --s3-key previous-version.zip \
    --region us-east-1
  ```

- [ ] Or delete stack and redeploy previous version
  ```bash
  aws cloudformation delete-stack \
    --stack-name subscribt-ai-presigned-url-generator-prod
  
  # Redeploy previous version
  git checkout previous-tag
  ./deploy.sh prod
  ```

## Maintenance

### Regular Tasks

- [ ] Review CloudWatch logs weekly
- [ ] Check alarm history monthly
- [ ] Update dependencies quarterly
  ```bash
  pip list --outdated
  pip install --upgrade boto3 pydantic aws-lambda-powertools
  ```

- [ ] Review and optimize costs monthly
- [ ] Test disaster recovery procedures quarterly

### Security Updates

- [ ] Subscribe to AWS security bulletins
- [ ] Monitor CVE databases for Python dependencies
- [ ] Update Lambda runtime when new versions available
- [ ] Rotate IAM credentials regularly

## Documentation

- [ ] Document API endpoint URLs
- [ ] Document environment variables
- [ ] Document IAM roles and permissions
- [ ] Document monitoring and alerting setup
- [ ] Document rollback procedures
- [ ] Share with team

## Sign-Off

- [ ] Development deployment verified
- [ ] Integration tests pass
- [ ] Monitoring configured
- [ ] Frontend integration complete
- [ ] Production deployment approved
- [ ] Team trained on monitoring and troubleshooting

**Deployed by:** _______________  
**Date:** _______________  
**Environment:** _______________  
**API Endpoint:** _______________  
**Notes:** _______________
