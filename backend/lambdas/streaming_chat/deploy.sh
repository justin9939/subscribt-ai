#!/bin/bash
set -e

# Streaming Chat Lambda Deployment Script
# Deploys Lambda with Function URL for response streaming

# Configuration
ENVIRONMENT="${1:-dev}"
STACK_NAME="subscribt-ai-streaming-chat-${ENVIRONMENT}"
REGION="${AWS_REGION:-us-east-1}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Streaming Chat Lambda Deployment${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Environment: ${ENVIRONMENT}"
echo "Stack Name: ${STACK_NAME}"
echo "Region: ${REGION}"
echo ""

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
    echo -e "${RED}Error: Invalid environment. Must be dev, staging, or prod${NC}"
    exit 1
fi

# Check required environment variables
REQUIRED_VARS=(
    "OPENSEARCH_ENDPOINT"
    "QUERY_LOG_TABLE_NAME"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}Error: Required environment variable ${var} is not set${NC}"
        exit 1
    fi
done

# Optional parameters with defaults
BEDROCK_MODEL_ID="${BEDROCK_MODEL_ID:-anthropic.claude-4-6-sonnet-20250514-v1:0}"
BEDROCK_EMBEDDING_MODEL_ID="${BEDROCK_EMBEDDING_MODEL_ID:-amazon.titan-embed-text-v2:0}"
SIMILARITY_THRESHOLD="${SIMILARITY_THRESHOLD:-0.7}"
TOP_K_RESULTS="${TOP_K_RESULTS:-5}"

echo -e "${YELLOW}Configuration:${NC}"
echo "  Bedrock Model: ${BEDROCK_MODEL_ID}"
echo "  Embedding Model: ${BEDROCK_EMBEDDING_MODEL_ID}"
echo "  OpenSearch Endpoint: ${OPENSEARCH_ENDPOINT}"
echo "  Query Log Table: ${QUERY_LOG_TABLE_NAME}"
echo "  Similarity Threshold: ${SIMILARITY_THRESHOLD}"
echo "  Top K Results: ${TOP_K_RESULTS}"
echo ""

# Build and deploy
echo -e "${YELLOW}Building Lambda package...${NC}"
sam build --template-file template.yaml

echo ""
echo -e "${YELLOW}Deploying to AWS...${NC}"
sam deploy \
    --stack-name "${STACK_NAME}" \
    --region "${REGION}" \
    --capabilities CAPABILITY_IAM \
    --parameter-overrides \
        Environment="${ENVIRONMENT}" \
        BedrockModelId="${BEDROCK_MODEL_ID}" \
        BedrockEmbeddingModelId="${BEDROCK_EMBEDDING_MODEL_ID}" \
        OpenSearchEndpoint="${OPENSEARCH_ENDPOINT}" \
        QueryLogTableName="${QUERY_LOG_TABLE_NAME}" \
        SimilarityThreshold="${SIMILARITY_THRESHOLD}" \
        TopKResults="${TOP_K_RESULTS}" \
    --no-fail-on-empty-changeset \
    --resolve-s3

# Get outputs
echo ""
echo -e "${GREEN}Deployment complete!${NC}"
echo ""
echo -e "${YELLOW}Stack Outputs:${NC}"
aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}" \
    --region "${REGION}" \
    --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
    --output table

# Get Function URL
FUNCTION_URL=$(aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}" \
    --region "${REGION}" \
    --query 'Stacks[0].Outputs[?OutputKey==`StreamingChatFunctionUrl`].OutputValue' \
    --output text)

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Lambda Function URL:${NC}"
echo -e "${GREEN}${FUNCTION_URL}${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Update frontend environment variable: CHAT_LAMBDA_FUNCTION_URL=${FUNCTION_URL}"
echo "2. Test the endpoint with a sample query"
echo "3. Monitor CloudWatch logs: /aws/lambda/subscribt-ai-streaming-chat-${ENVIRONMENT}"
echo ""
echo -e "${GREEN}Deployment successful!${NC}"
