#!/bin/bash
set -e

# Pre-signed URL Generator Lambda Deployment Script

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-dev}
REGION=${AWS_REGION:-us-east-1}
STACK_NAME="subscribt-ai-presigned-url-generator-${ENVIRONMENT}"

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
    echo -e "${RED}Error: Invalid environment. Must be dev, staging, or prod${NC}"
    exit 1
fi

echo -e "${GREEN}Deploying Pre-signed URL Generator Lambda${NC}"
echo "Environment: $ENVIRONMENT"
echo "Region: $REGION"
echo "Stack: $STACK_NAME"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    exit 1
fi

# Check if SAM CLI is installed
if ! command -v sam &> /dev/null; then
    echo -e "${RED}Error: AWS SAM CLI is not installed${NC}"
    echo "Install with: pip install aws-sam-cli"
    exit 1
fi

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
pip install -r requirements.txt -t . --upgrade

# Run tests
echo -e "${YELLOW}Running tests...${NC}"
python -m pytest test_handler.py -v

if [ $? -ne 0 ]; then
    echo -e "${RED}Tests failed. Aborting deployment.${NC}"
    exit 1
fi

# Build SAM application
echo -e "${YELLOW}Building SAM application...${NC}"
sam build --use-container

# Deploy
echo -e "${YELLOW}Deploying to AWS...${NC}"

if [ "$ENVIRONMENT" == "prod" ]; then
    # Production deployment requires confirmation
    sam deploy \
        --stack-name "$STACK_NAME" \
        --region "$REGION" \
        --capabilities CAPABILITY_IAM \
        --parameter-overrides \
            Environment="$ENVIRONMENT" \
            DocumentBucketName="${DOCUMENT_BUCKET_NAME}" \
            DocumentMetadataTableName="${DOCUMENT_METADATA_TABLE_NAME}" \
            PresignedUrlExpiration="${PRESIGNED_URL_EXPIRATION:-3600}" \
            MaxFileSizeMB="${MAX_FILE_SIZE_MB:-100}" \
        --confirm-changeset
else
    # Dev/staging deployment without confirmation
    sam deploy \
        --stack-name "$STACK_NAME" \
        --region "$REGION" \
        --capabilities CAPABILITY_IAM \
        --parameter-overrides \
            Environment="$ENVIRONMENT" \
            DocumentBucketName="${DOCUMENT_BUCKET_NAME}" \
            DocumentMetadataTableName="${DOCUMENT_METADATA_TABLE_NAME}" \
            PresignedUrlExpiration="${PRESIGNED_URL_EXPIRATION:-3600}" \
            MaxFileSizeMB="${MAX_FILE_SIZE_MB:-100}" \
        --no-confirm-changeset
fi

# Get outputs
echo -e "${YELLOW}Retrieving stack outputs...${NC}"
API_ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query "Stacks[0].Outputs[?OutputKey=='PresignedUrlApiEndpoint'].OutputValue" \
    --output text)

FUNCTION_NAME=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query "Stacks[0].Outputs[?OutputKey=='PresignedUrlApiFunctionName'].OutputValue" \
    --output text)

echo ""
echo -e "${GREEN}Deployment successful!${NC}"
echo ""
echo "API Endpoint: $API_ENDPOINT"
echo "Function Name: $FUNCTION_NAME"
echo ""
echo "Test the endpoint with:"
echo "curl -X POST $API_ENDPOINT \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"filename\":\"test.pdf\",\"content_type\":\"application/pdf\",\"hr_manager_id\":\"test-hr\",\"file_size_bytes\":1024000}'"
echo ""
echo -e "${YELLOW}Add this to your frontend .env:${NC}"
echo "NEXT_PUBLIC_API_BASE_URL=${API_ENDPOINT%/api/upload/presigned-url}"
