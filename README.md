# Subscribt AI

Policy analysis platform built for the 2026 UBC CIC GenAI Hackathon. Upload a document containing club guidelines, workplace rules, local laws, etc...
Ask any questions about the uploaded policies for accurate answeres grounded in the document with citations.

## Architecture

- **Frontend**: Next.js 15 (TypeScript) served locally or deployed to Vercel
- **Backend**: Two AWS Lambda functions, packaged with AWS SAM and deployed via a custom AWS CLI script (`backend/deploy.sh`)
  - `subscribt-kb-query` — queries the Bedrock Knowledge Base and returns grounded answers
  - `subscribt-upload-document` — uploads a document to S3 and ingests it into the Knowledge Base
- **AWS Services**: Amazon Bedrock (Knowledge Base + Claude model), S3, Lambda

> **Status:** The Lambda source code these functions depend on (`backend/lambdas/retrieve_generate/`, including `handler.py` and `template.yaml` for both `KBQueryFunction` and `UploadDocumentFunction`) is not currently present in this repository — it was removed in a prior cleanup commit. `backend/deploy.sh` and the "Backend Deployment" steps below describe the intended workflow, but `sam build` has nothing to build until that source is restored or rewritten. Only `frontend/` currently runs end-to-end (against Lambda URLs from a previous deployment).

---

## Prerequisites

Install these before starting:

| Tool | Purpose | Install |
|------|---------|---------|
| Node.js 18+ | Frontend | https://nodejs.org |
| Python 3.12 | Lambda runtime (for local testing) | https://python.org |
| AWS SAM CLI | Deploy Lambda functions | https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html |
| AWS CLI | Configure credentials | https://aws.amazon.com/cli/ |

Configure AWS credentials with a profile that has access to Bedrock, S3, and Lambda:

```bash
aws configure
```

---

## AWS Setup (one-time)

These resources must exist in your AWS account before deploying.

### 1. S3 Bucket

Create a bucket to store uploaded documents:

```bash
aws s3 mb s3://your-bucket-name --region us-west-2
```

### 2. Bedrock Knowledge Base

1. Open the [Amazon Bedrock console](https://console.aws.amazon.com/bedrock)
2. Go to **Knowledge bases** → **Create knowledge base**
3. Choose **Amazon S3** as the data source and point it at the bucket you just created
4. Select an embeddings model (e.g. Amazon Titan Embeddings v2)
5. After creation, note down:
   - **Knowledge Base ID** (e.g. `ABCDE12345`)
   - **Data Source ID** (found under the Knowledge Base → Data sources tab, e.g. `FGHIJ67890`)
   - **S3 Bucket Name**

---

## Backend Deployment

### 1. Build

SAM is used to build the Lambda packages:

```bash
cd backend/lambdas/retrieve_generate
sam build
```

### 2. Deploy

From the `backend/` directory, run `deploy.sh` with your four AWS resource identifiers:

```bash
cd backend
./deploy.sh <KB_ID> <DATA_SOURCE_ID> <S3_BUCKET> <BEDROCK_MODEL_ARN>
```

| Argument | Where to find it |
|----------|-----------------|
| `KB_ID` | Bedrock console → Knowledge bases → your KB → Knowledge base ID |
| `DATA_SOURCE_ID` | Same page → Data sources tab → ID column |
| `S3_BUCKET` | The bucket name you created above |
| `BEDROCK_MODEL_ARN` | Bedrock console → Cross-region inference → copy the ARN for Claude |

Example:

```bash
./deploy.sh UFPCUNTCJU 3UIK4CXCOV my-bucket \
  arn:aws:bedrock:us-west-2:123456789012:inference-profile/us.anthropic.claude-sonnet-4-6
```

The script creates or updates both Lambda functions and their IAM roles, and is safe to rerun after code changes.

### 3. Copy the Function URLs

After deployment the script prints:

```
NEXT_PUBLIC_KB_FUNCTION_URL=https://xxxx.lambda-url.us-west-2.on.aws/
NEXT_PUBLIC_UPLOAD_FUNCTION_URL=https://yyyy.lambda-url.us-west-2.on.aws/
```

---

## Frontend Setup

### 1. Install dependencies

```bash
cd frontend
npm install
```

### 2. Configure environment variables

Copy the example file and fill in the Lambda URLs from the deploy step above:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
AWS_REGION=us-west-2
NEXT_PUBLIC_KB_FUNCTION_URL=https://yyyy.lambda-url.us-west-2.on.aws/
NEXT_PUBLIC_UPLOAD_FUNCTION_URL=https://xxxx.lambda-url.us-west-2.on.aws/
```

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Using the App

1. **Upload a document** — Click the green **Upload Document** button and select a `.pdf`, `.docx`, `.txt`, or `.md` file. The document is uploaded to S3 and indexed into the Knowledge Base. Any previously uploaded document is replaced automatically.

2. **Ask a question** — Type a question in the text area and click **Submit**. The app queries the Knowledge Base and returns an answer grounded in the uploaded document, with citations showing the exact source passages.

> Note: After uploading a new document, Bedrock may take 10–30 seconds to finish indexing before queries reflect the new content.

---
