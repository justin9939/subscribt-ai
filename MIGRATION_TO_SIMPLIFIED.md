# Migration Guide: Custom RAG to RetrieveAndGenerate

This guide helps you migrate from the custom RAG implementation to the simplified RetrieveAndGenerate approach.

## Overview

The migration involves:
1. Creating a Bedrock Knowledge Base
2. Migrating documents from OpenSearch to the Knowledge Base
3. Deploying the new Lambda function
4. Updating the frontend
5. Testing and validation
6. Deprecating old infrastructure

## Prerequisites

- Access to your current OpenSearch Serverless collection
- AWS CLI configured
- SAM CLI installed
- Bedrock Knowledge Base permissions

## Step 1: Create Bedrock Knowledge Base

### 1.1 Create S3 Bucket for Documents

```bash
# Create bucket for source documents
aws s3 mb s3://your-kb-documents-bucket

# Enable versioning (recommended)
aws s3api put-bucket-versioning \
  --bucket your-kb-documents-bucket \
  --versioning-configuration Status=Enabled
```

### 1.2 Upload Documents to S3

If you have original PDFs:
```bash
# Upload your policy documents
aws s3 cp /path/to/documents/ s3://your-kb-documents-bucket/policies/ --recursive
```

If you only have OpenSearch data, you'll need to reconstruct documents or use the original sources.

### 1.3 Create Knowledge Base via Console

1. Go to Amazon Bedrock Console → Knowledge Bases
2. Click "Create knowledge base"
3. Configure:
   - **Name**: `policy-knowledge-base`
   - **IAM Role**: Create new or use existing
   - **Data Source**: S3
   - **S3 URI**: `s3://your-kb-documents-bucket/policies/`
   - **Embedding Model**: Amazon Titan Embeddings G1 - Text
   - **Vector Store**: Choose OpenSearch Serverless or let AWS create one

4. Click "Create"
5. Wait for sync to complete (can take 10-30 minutes depending on document count)

### 1.4 Get Knowledge Base ID

```bash
# List knowledge bases
aws bedrock-agent list-knowledge-bases

# Note the knowledgeBaseId from output
```

## Step 2: Deploy New Lambda Function

### 2.1 Deploy

```bash
cd backend/lambdas/retrieve_generate

# Set your knowledge base ID
export KNOWLEDGE_BASE_ID="your-kb-id-here"

# Optional: Specify model (defaults to Claude 3.5 Sonnet)
export BEDROCK_MODEL_ARN="arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0"

# Deploy
./deploy.sh
```

### 2.2 Get Function URL

```bash
aws cloudformation describe-stacks \
  --stack-name subscribt-kb-query \
  --query 'Stacks[0].Outputs[?OutputKey==`KBQueryFunctionUrl`].OutputValue' \
  --output text
```

Save this URL for the next step.

## Step 3: Update Frontend

### 3.1 Update Environment Variables

```bash
cd subscribt-ai-frontend

# Backup old .env.local
cp .env.local .env.local.backup

# Update with new Function URL
cat > .env.local << EOF
NEXT_PUBLIC_KB_FUNCTION_URL=https://your-new-function-url.lambda-url.us-east-1.on.aws/
EOF
```

### 3.2 Update Frontend Code

The new barebones interface is already in `app/page.tsx`. If you want to keep the old interface temporarily:

```bash
# Rename old page
mv app/page.tsx app/page.old.tsx

# The new simplified page is already in place
# Or copy from simple-query if needed
cp app/simple-query/page.tsx app/page.tsx
```

### 3.3 Test Locally

```bash
npm run dev
```

Visit http://localhost:3000 and test queries.

## Step 4: Testing and Validation

### 4.1 Functional Testing

Test key scenarios:
- [ ] Simple policy queries
- [ ] Complex multi-part questions
- [ ] Follow-up questions (session continuity)
- [ ] Queries with no relevant documents
- [ ] Edge cases (very long queries, special characters)

### 4.2 Quality Comparison

Compare responses between old and new systems:

```bash
# Test with old system
curl -X POST $OLD_FUNCTION_URL \
  -H "Content-Type: application/json" \
  -d '{"query": "What is the remote work policy?", "user_id": "test"}' \
  > old_response.json

# Test with new system
curl -X POST $NEW_FUNCTION_URL \
  -H "Content-Type: application/json" \
  -d '{"query": "What is the remote work policy?"}' \
  > new_response.json

# Compare
diff old_response.json new_response.json
```

### 4.3 Performance Testing

```bash
# Simple load test
for i in {1..10}; do
  time curl -X POST $NEW_FUNCTION_URL \
    -H "Content-Type: application/json" \
    -d '{"query": "What is the remote work policy?"}'
done
```

Expected latency: 2-4 seconds per query

### 4.4 Citation Verification

Verify that citations are accurate:
1. Pick 5-10 test queries
2. Check that cited text matches source documents
3. Verify location metadata is correct

## Step 5: Gradual Rollout (Optional)

If you want to roll out gradually:

### 5.1 Feature Flag Approach

```typescript
// In your frontend
const useNewSystem = process.env.NEXT_PUBLIC_USE_NEW_KB === 'true';

const functionUrl = useNewSystem 
  ? process.env.NEXT_PUBLIC_KB_FUNCTION_URL
  : process.env.NEXT_PUBLIC_CHAT_LAMBDA_FUNCTION_URL;
```

### 5.2 A/B Testing

Route a percentage of traffic to the new system:

```typescript
const useNewSystem = Math.random() < 0.1; // 10% of traffic
```

### 5.3 User-Based Rollout

Enable for specific users first:

```typescript
const testUsers = ['user1@example.com', 'user2@example.com'];
const useNewSystem = testUsers.includes(currentUser.email);
```

## Step 6: Monitor and Validate

### 6.1 Set Up CloudWatch Alarms

```bash
# Create alarm for errors
aws cloudwatch put-metric-alarm \
  --alarm-name kb-query-errors \
  --alarm-description "Alert on KB query errors" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=FunctionName,Value=subscribt-kb-query \
  --evaluation-periods 1

# Create alarm for latency
aws cloudwatch put-metric-alarm \
  --alarm-name kb-query-latency \
  --alarm-description "Alert on high KB query latency" \
  --metric-name Duration \
  --namespace AWS/Lambda \
  --statistic Average \
  --period 300 \
  --threshold 5000 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=FunctionName,Value=subscribt-kb-query \
  --evaluation-periods 2
```

### 6.2 Monitor Costs

```bash
# Check Bedrock costs
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --filter file://bedrock-filter.json

# bedrock-filter.json:
{
  "Dimensions": {
    "Key": "SERVICE",
    "Values": ["Amazon Bedrock"]
  }
}
```

### 6.3 Review Logs

```bash
# Tail Lambda logs
sam logs --stack-name subscribt-kb-query --tail

# Search for errors
aws logs filter-log-events \
  --log-group-name /aws/lambda/subscribt-kb-query \
  --filter-pattern "ERROR"
```

## Step 7: Deprecate Old Infrastructure

Once you're confident in the new system:

### 7.1 Stop Writing to Old System

Update frontend to only use new system:

```bash
# Remove old env var
sed -i '' '/NEXT_PUBLIC_CHAT_LAMBDA_FUNCTION_URL/d' .env.local
```

### 7.2 Delete Old Lambda

```bash
# If deployed with SAM
sam delete --stack-name subscribt-streaming-chat

# Or via CloudFormation
aws cloudformation delete-stack --stack-name subscribt-streaming-chat
```

### 7.3 Delete OpenSearch Collection

**⚠️ WARNING: This is irreversible. Ensure you have backups if needed.**

```bash
# List collections
aws opensearchserverless list-collections

# Delete collection
aws opensearchserverless delete-collection \
  --id your-collection-id
```

### 7.4 Delete DynamoDB Tables

**⚠️ WARNING: This deletes all query logs. Export data first if needed.**

```bash
# Export data (optional)
aws dynamodb scan \
  --table-name your-query-logs-table \
  --output json > query_logs_backup.json

# Delete table
aws dynamodb delete-table \
  --table-name your-query-logs-table
```

### 7.5 Clean Up IAM Roles

```bash
# List roles
aws iam list-roles | grep subscribt

# Delete old Lambda execution role
aws iam delete-role --role-name old-lambda-execution-role
```

## Step 8: Update Documentation

Update your internal documentation:
- [ ] Update API documentation with new endpoint
- [ ] Update deployment guides
- [ ] Update troubleshooting guides
- [ ] Archive old system documentation

## Rollback Plan

If you need to rollback:

### Quick Rollback

```bash
# Restore old .env.local
cp .env.local.backup .env.local

# Restart frontend
npm run dev
```

### Full Rollback

If you've deleted old infrastructure:
1. Redeploy old Lambda from backup
2. Restore OpenSearch collection from snapshot (if available)
3. Restore DynamoDB tables from backup
4. Update frontend to use old endpoints

## Cost Comparison

### Before (Custom RAG)
- OpenSearch Serverless: ~$700/month (fixed)
- Lambda: ~$0.08/1000 queries
- Bedrock (Claude): ~$15/1000 queries
- DynamoDB: ~$0.25/1000 queries
- **Total**: ~$715/month + per-query costs

### After (RetrieveAndGenerate)
- Knowledge Base Storage: ~$0.30/GB/month
- Lambda: ~$0.05/1000 queries
- Bedrock RetrieveAndGenerate: ~$20/1000 queries
- **Total**: ~$20/1000 queries + storage

**Savings**: ~$695/month in fixed costs for low-volume use cases

## Troubleshooting

### Knowledge Base Sync Issues

```bash
# Check sync status
aws bedrock-agent list-data-sources \
  --knowledge-base-id YOUR_KB_ID

# Trigger manual sync
aws bedrock-agent start-ingestion-job \
  --knowledge-base-id YOUR_KB_ID \
  --data-source-id YOUR_DATA_SOURCE_ID
```

### Poor Response Quality

If responses are worse than the old system:
1. Check Knowledge Base has all documents
2. Verify document sync completed successfully
3. Try adjusting `numberOfResults` in Lambda handler
4. Consider using a more capable model (Claude 3 Opus)

### High Latency

If queries are slower than expected:
1. Check Lambda memory allocation (increase if needed)
2. Monitor Bedrock API latency in CloudWatch
3. Consider caching common queries

### Missing Citations

If citations are missing or incomplete:
1. Verify source documents have proper metadata
2. Check Knowledge Base configuration
3. Review Bedrock API response in logs

## Support

For issues during migration:
1. Check CloudWatch logs for errors
2. Review AWS Bedrock documentation
3. Test with simple queries first
4. Verify Knowledge Base is properly configured

## Conclusion

The migration to RetrieveAndGenerate simplifies your architecture significantly while maintaining core functionality. The process should take 2-4 hours for a small deployment, longer for larger knowledge bases.

Key benefits after migration:
- ✅ 60% less code to maintain
- ✅ ~$700/month cost savings (for low-volume)
- ✅ No OpenSearch cluster to manage
- ✅ Simpler deployment process
- ✅ Managed service with AWS SLAs

Take your time with testing and validation before deprecating the old system.
