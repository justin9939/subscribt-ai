# Quick Start: Knowledge Base Query Lambda

## 1. Prerequisites

- AWS account with Bedrock access
- Knowledge Base already created and populated
- AWS CLI configured
- SAM CLI installed

## 2. Get Your Knowledge Base ID

```bash
# List all knowledge bases
aws bedrock-agent list-knowledge-bases

# Note the knowledgeBaseId from the output
```

## 3. Deploy

```bash
# Set environment variable
export KNOWLEDGE_BASE_ID="your-kb-id-here"

# Deploy
./deploy.sh
```

## 4. Get Function URL

```bash
aws cloudformation describe-stacks \
  --stack-name subscribt-kb-query \
  --query 'Stacks[0].Outputs[?OutputKey==`KBQueryFunctionUrl`].OutputValue' \
  --output text
```

## 5. Test

```bash
# Replace with your actual Function URL
FUNCTION_URL="https://your-url.lambda-url.us-east-1.on.aws/"

curl -X POST $FUNCTION_URL \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is the remote work policy?"
  }'
```

## 6. Configure Frontend

Add the Function URL to your frontend `.env.local`:

```bash
NEXT_PUBLIC_KB_FUNCTION_URL=https://your-url.lambda-url.us-east-1.on.aws/
```

## Common Issues

**"Knowledge base not found"**
- Double-check your `KNOWLEDGE_BASE_ID`
- Verify the knowledge base exists: `aws bedrock-agent get-knowledge-base --knowledge-base-id YOUR_ID`

**"Access denied"**
- Ensure your AWS credentials have Bedrock permissions
- Check the Lambda execution role has the correct policies

**Empty responses**
- Verify your knowledge base has documents
- Check document sync status: `aws bedrock-agent list-data-sources --knowledge-base-id YOUR_ID`

## Model Options

Default model: `anthropic.claude-3-5-sonnet-20241022-v2:0`

To use a different model:

```bash
export BEDROCK_MODEL_ARN="arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-haiku-20240307-v1:0"
./deploy.sh
```

Available models:
- Claude 3.5 Sonnet (recommended): `anthropic.claude-3-5-sonnet-20241022-v2:0`
- Claude 3 Haiku (faster/cheaper): `anthropic.claude-3-haiku-20240307-v1:0`
- Claude 3 Opus (most capable): `anthropic.claude-3-opus-20240229-v1:0`

## Cleanup

To remove all resources:

```bash
sam delete --stack-name subscribt-kb-query
```
