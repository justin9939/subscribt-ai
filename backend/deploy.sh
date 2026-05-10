#!/usr/bin/env bash
# Deploy both Lambda functions directly via AWS CLI (no CloudFormation).
# Usage: ./deploy.sh <KB_ID> <DATA_SOURCE_ID> <S3_BUCKET> <INFERENCE_PROFILE_ARN>
# Example:
#   ./deploy.sh UFPCUNTCJU 3UIK4CXCOV my-bucket \
#     arn:aws:bedrock:us-west-2:416114855901:inference-profile/us.anthropic.claude-sonnet-4-6

set -euo pipefail

KNOWLEDGE_BASE_ID="${1:?Usage: $0 <KB_ID> <DATA_SOURCE_ID> <S3_BUCKET> <INFERENCE_PROFILE_ARN>}"
DATA_SOURCE_ID="${2:?}"
S3_BUCKET="${3:?}"
BEDROCK_MODEL_ARN="${4:?}"
REGION="${AWS_REGION:-us-west-2}"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
DOCUMENTS_PREFIX="documents/"

BUILD_DIR="$(cd "$(dirname "$0")/lambdas/retrieve_generate/.aws-sam/build" && pwd)"

echo "==> Deploying to account $ACCOUNT_ID in $REGION"

# ── Helper: create or update a Lambda function ──────────────────────────────
deploy_function() {
  local name="$1" zip="$2" handler="$3" role_arn="$4" timeout="$5"
  shift 5
  local env_vars="$*"

  if aws lambda get-function --function-name "$name" --region "$REGION" &>/dev/null; then
    echo "  Updating code: $name"
    aws lambda update-function-code \
      --function-name "$name" \
      --zip-file "fileb://$zip" \
      --region "$REGION" > /dev/null
    aws lambda wait function-updated --function-name "$name" --region "$REGION"
    echo "  Updating config: $name"
    aws lambda update-function-configuration \
      --function-name "$name" \
      --handler "$handler" \
      --timeout "$timeout" \
      --environment "Variables={$env_vars}" \
      --region "$REGION" > /dev/null
  else
    echo "  Creating function: $name"
    aws lambda create-function \
      --function-name "$name" \
      --runtime python3.12 \
      --handler "$handler" \
      --role "$role_arn" \
      --zip-file "fileb://$zip" \
      --timeout "$timeout" \
      --memory-size 512 \
      --environment "Variables={$env_vars}" \
      --region "$REGION" > /dev/null
    aws lambda wait function-active --function-name "$name" --region "$REGION"
  fi
}

# ── Helper: ensure a Function URL exists (AuthType NONE) ─────────────────────
ensure_function_url() {
  local name="$1"
  local existing
  existing=$(aws lambda get-function-url-config --function-name "$name" \
    --region "$REGION" --query FunctionUrl --output text 2>/dev/null || true)
  if [ -z "$existing" ]; then
    echo "  Creating Function URL: $name" >&2
    aws lambda create-function-url-config \
      --function-name "$name" \
      --auth-type NONE \
      --cors '{"AllowOrigins":["*"],"AllowMethods":["POST"],"AllowHeaders":["Content-Type"],"MaxAge":300}' \
      --region "$REGION" > /dev/null
  fi
  # Always ensure the public-access resource policy exists (idempotent)
  aws lambda add-permission \
    --function-name "$name" \
    --statement-id AllowPublicAccess \
    --action lambda:InvokeFunctionUrl \
    --principal "*" \
    --function-url-auth-type NONE \
    --region "$REGION" > /dev/null 2>&1 || true
  aws lambda get-function-url-config --function-name "$name" \
    --region "$REGION" --query FunctionUrl --output text
}

# ── Helper: create role if it doesn't exist, then put the inline policy ──────
ensure_role() {
  local role_name="$1" policy_json="$2"
  local trust='{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}]}'

  if ! aws iam get-role --role-name "$role_name" &>/dev/null; then
    echo "  Creating IAM role: $role_name" >&2
    aws iam create-role \
      --role-name "$role_name" \
      --assume-role-policy-document "$trust" > /dev/null
    aws iam attach-role-policy \
      --role-name "$role_name" \
      --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
  fi

  echo "  Putting inline policy on: $role_name" >&2
  aws iam put-role-policy \
    --role-name "$role_name" \
    --policy-name InlinePolicy \
    --policy-document "$policy_json"

  aws iam get-role --role-name "$role_name" --query Role.Arn --output text
}

# ── 1. KB Query function ──────────────────────────────────────────────────────
echo ""
echo "── KB Query function ──"

KB_POLICY=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["bedrock:RetrieveAndGenerate", "bedrock:Retrieve"],
      "Resource": "arn:aws:bedrock:${REGION}:${ACCOUNT_ID}:knowledge-base/${KNOWLEDGE_BASE_ID}"
    },
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": [
        "arn:aws:bedrock:${REGION}::foundation-model/*",
        "arn:aws:bedrock:${REGION}:${ACCOUNT_ID}:inference-profile/*"
      ]
    }
  ]
}
EOF
)

KB_ROLE_ARN=$(ensure_role "subscribt-kb-query-role" "$KB_POLICY")
echo "  Role ARN: $KB_ROLE_ARN"
sleep 10   # allow IAM to propagate

echo "  Zipping KBQueryFunction..."
cd "$BUILD_DIR/KBQueryFunction"
zip -qr /tmp/kb-query.zip .

deploy_function \
  "subscribt-kb-query" \
  "/tmp/kb-query.zip" \
  "handler.handler" \
  "$KB_ROLE_ARN" \
  30 \
  "KNOWLEDGE_BASE_ID=${KNOWLEDGE_BASE_ID},BEDROCK_MODEL_ARN=${BEDROCK_MODEL_ARN},POWERTOOLS_SERVICE_NAME=kb-query,LOG_LEVEL=INFO"

KB_URL=$(ensure_function_url "subscribt-kb-query")
echo "  KB Query URL: $KB_URL"

# ── 2. Upload Document function ───────────────────────────────────────────────
echo ""
echo "── Upload Document function ──"

UPLOAD_POLICY=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:DeleteObject", "s3:GetObject"],
      "Resource": "arn:aws:s3:::${S3_BUCKET}/*"
    },
    {
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::${S3_BUCKET}"
    },
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:IngestKnowledgeBaseDocuments",
        "bedrock:DeleteKnowledgeBaseDocuments"
      ],
      "Resource": "arn:aws:bedrock:${REGION}:${ACCOUNT_ID}:knowledge-base/${KNOWLEDGE_BASE_ID}"
    }
  ]
}
EOF
)

UPLOAD_ROLE_ARN=$(ensure_role "subscribt-upload-document-role" "$UPLOAD_POLICY")
echo "  Role ARN: $UPLOAD_ROLE_ARN"
sleep 10   # allow IAM to propagate

echo "  Zipping UploadDocumentFunction..."
cd "$BUILD_DIR/UploadDocumentFunction"
zip -qr /tmp/upload-document.zip .

deploy_function \
  "subscribt-upload-document" \
  "/tmp/upload-document.zip" \
  "handler.handler" \
  "$UPLOAD_ROLE_ARN" \
  60 \
  "KNOWLEDGE_BASE_ID=${KNOWLEDGE_BASE_ID},DATA_SOURCE_ID=${DATA_SOURCE_ID},S3_BUCKET_NAME=${S3_BUCKET},DOCUMENTS_PREFIX=${DOCUMENTS_PREFIX},POWERTOOLS_SERVICE_NAME=upload-document,LOG_LEVEL=INFO"

UPLOAD_URL=$(ensure_function_url "subscribt-upload-document")
echo "  Upload Document URL: $UPLOAD_URL"

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════"
echo " Deployment complete. Add these to frontend/.env.local:"
echo ""
echo "  NEXT_PUBLIC_KB_FUNCTION_URL=$KB_URL"
echo "  NEXT_PUBLIC_UPLOAD_FUNCTION_URL=$UPLOAD_URL"
echo "════════════════════════════════════════════"
