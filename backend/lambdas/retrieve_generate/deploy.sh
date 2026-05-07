#!/bin/bash
set -e

# Deploy script for Knowledge Base Query Lambda

echo "Deploying Knowledge Base Query Lambda..."

# Check required environment variables
if [ -z "$KNOWLEDGE_BASE_ID" ]; then
    echo "Error: KNOWLEDGE_BASE_ID environment variable is required"
    exit 1
fi

# Optional: Override default model ARN
BEDROCK_MODEL_ARN=${BEDROCK_MODEL_ARN:-"arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-5-sonnet-20241022-v2:0"}

# Build and deploy using SAM
sam build

sam deploy \
    --stack-name subscribt-kb-query \
    --parameter-overrides \
        KnowledgeBaseId="$KNOWLEDGE_BASE_ID" \
        BedrockModelArn="$BEDROCK_MODEL_ARN" \
    --capabilities CAPABILITY_IAM \
    --resolve-s3 \
    --no-confirm-changeset

echo "Deployment complete!"
echo ""
echo "To get the Function URL, run:"
echo "aws cloudformation describe-stacks --stack-name subscribt-kb-query --query 'Stacks[0].Outputs[?OutputKey==\`KBQueryFunctionUrl\`].OutputValue' --output text"
