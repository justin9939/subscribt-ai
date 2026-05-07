# Getting Started Checklist

Use this checklist to set up the simplified Knowledge Base query system.

## Prerequisites Checklist

- [ ] AWS account with Bedrock access enabled
- [ ] AWS CLI installed and configured
  ```bash
  aws --version
  aws sts get-caller-identity
  ```
- [ ] SAM CLI installed
  ```bash
  sam --version
  ```
- [ ] Node.js 18+ installed
  ```bash
  node --version
  ```
- [ ] Policy documents ready (PDFs or text files)

## Step 1: Create Knowledge Base

- [ ] Create S3 bucket for documents
  ```bash
  aws s3 mb s3://your-kb-documents-bucket
  ```
- [ ] Upload policy documents to S3
  ```bash
  aws s3 cp /path/to/documents/ s3://your-kb-documents-bucket/policies/ --recursive
  ```
- [ ] Create Knowledge Base in Bedrock Console
  - Go to: https://console.aws.amazon.com/bedrock/
  - Navigate to: Knowledge Bases → Create knowledge base
  - Configure data source (S3 bucket)
  - Select embedding model (Titan Embeddings)
  - Wait for sync to complete
- [ ] Note your Knowledge Base ID
  ```bash
  aws bedrock-agent list-knowledge-bases
  ```

## Step 2: Deploy Backend

- [ ] Navigate to Lambda directory
  ```bash
  cd backend/lambdas/retrieve_generate
  ```
- [ ] Set environment variables
  ```bash
  export KNOWLEDGE_BASE_ID="your-kb-id-here"
  ```
- [ ] Deploy Lambda function
  ```bash
  ./deploy.sh
  ```
- [ ] Verify deployment succeeded
  ```bash
  aws cloudformation describe-stacks --stack-name subscribt-kb-query
  ```
- [ ] Get Function URL
  ```bash
  aws cloudformation describe-stacks \
    --stack-name subscribt-kb-query \
    --query 'Stacks[0].Outputs[?OutputKey==`KBQueryFunctionUrl`].OutputValue' \
    --output text
  ```
- [ ] Save Function URL (you'll need it for frontend)

## Step 3: Test Backend

- [ ] Test Lambda directly with curl
  ```bash
  FUNCTION_URL="your-function-url-here"
  
  curl -X POST $FUNCTION_URL \
    -H "Content-Type: application/json" \
    -d '{
      "query": "What is the remote work policy?"
    }'
  ```
- [ ] Verify response includes:
  - [ ] `answer` field with text
  - [ ] `citations` array with sources
  - [ ] `session_id` for follow-ups
- [ ] Test follow-up query with session_id
  ```bash
  curl -X POST $FUNCTION_URL \
    -H "Content-Type: application/json" \
    -d '{
      "query": "What about hybrid work?",
      "session_id": "session-id-from-previous-response"
    }'
  ```

## Step 4: Configure Frontend

- [ ] Navigate to frontend directory
  ```bash
  cd subscribt-ai-frontend
  ```
- [ ] Copy environment template
  ```bash
  cp .env.example .env.local
  ```
- [ ] Edit `.env.local` and set Function URL
  ```bash
  # Edit this file
  nano .env.local
  
  # Set this value:
  NEXT_PUBLIC_KB_FUNCTION_URL=https://your-function-url.lambda-url.us-east-1.on.aws/
  ```
- [ ] Install dependencies
  ```bash
  npm install
  ```

## Step 5: Test Frontend Locally

- [ ] Start development server
  ```bash
  npm run dev
  ```
- [ ] Open browser to http://localhost:3000
- [ ] Test basic query
  - [ ] Enter a question in the text box
  - [ ] Click Submit
  - [ ] Verify answer appears
  - [ ] Verify citations are displayed
- [ ] Test follow-up query
  - [ ] Ask a related question
  - [ ] Verify context is maintained
- [ ] Test error handling
  - [ ] Submit empty query (should be disabled)
  - [ ] Submit very long query (should work or show error)
- [ ] Test Clear button
  - [ ] Click Clear
  - [ ] Verify form resets

## Step 6: Verify Quality

- [ ] Test with 5-10 sample queries
- [ ] For each query, verify:
  - [ ] Answer is relevant and accurate
  - [ ] Citations match the answer
  - [ ] Source metadata is correct
  - [ ] Response time is acceptable (2-4 seconds)
- [ ] Test edge cases:
  - [ ] Query with no relevant documents
  - [ ] Very specific query
  - [ ] Broad/general query
  - [ ] Query with special characters

## Step 7: Production Preparation (Optional)

- [ ] Add authentication
  - [ ] Update Lambda template.yaml
  - [ ] Change `AuthType: NONE` to `AuthType: AWS_IAM`
  - [ ] Implement auth in frontend
- [ ] Restrict CORS
  - [ ] Update `AllowOrigins` in template.yaml
  - [ ] Replace `*` with your domain
- [ ] Set up monitoring
  - [ ] Create CloudWatch alarms for errors
  - [ ] Create CloudWatch alarms for latency
  - [ ] Set up cost alerts
- [ ] Review security
  - [ ] Audit IAM permissions
  - [ ] Enable CloudTrail logging
  - [ ] Review S3 bucket policies
- [ ] Optimize costs
  - [ ] Review Lambda memory allocation
  - [ ] Consider caching common queries
  - [ ] Monitor Bedrock API usage

## Step 8: Deploy to Production

- [ ] Build frontend for production
  ```bash
  npm run build
  ```
- [ ] Deploy frontend (choose one):
  - [ ] AWS Amplify
  - [ ] Vercel
  - [ ] Netlify
  - [ ] S3 + CloudFront
- [ ] Update production environment variables
- [ ] Test production deployment
- [ ] Monitor for errors

## Troubleshooting Checklist

If something doesn't work:

### Backend Issues
- [ ] Check CloudWatch logs
  ```bash
  sam logs --stack-name subscribt-kb-query --tail
  ```
- [ ] Verify Knowledge Base ID is correct
- [ ] Check Lambda has correct IAM permissions
- [ ] Verify Knowledge Base sync completed
- [ ] Test with AWS CLI directly

### Frontend Issues
- [ ] Check browser console for errors
- [ ] Verify `NEXT_PUBLIC_KB_FUNCTION_URL` is set correctly
- [ ] Check CORS configuration in Lambda
- [ ] Test Function URL directly with curl
- [ ] Clear browser cache and reload

### Quality Issues
- [ ] Verify documents are in Knowledge Base
- [ ] Check document sync status
- [ ] Try adjusting `numberOfResults` in Lambda
- [ ] Consider using a more capable model
- [ ] Review source document quality

## Success Criteria

You're ready to go when:
- [ ] Backend Lambda is deployed and responding
- [ ] Frontend loads without errors
- [ ] Test queries return accurate answers
- [ ] Citations are displayed correctly
- [ ] Follow-up queries maintain context
- [ ] Response times are acceptable
- [ ] Error handling works properly

## Next Steps

After completing this checklist:
1. **Document your setup** for your team
2. **Train users** on how to use the system
3. **Gather feedback** on response quality
4. **Monitor usage** and costs
5. **Iterate** based on feedback

## Resources

- **Setup Guide**: [SIMPLIFIED_SETUP.md](SIMPLIFIED_SETUP.md)
- **Architecture**: [ARCHITECTURE_COMPARISON.md](ARCHITECTURE_COMPARISON.md)
- **Lambda Docs**: [backend/lambdas/retrieve_generate/README.md](backend/lambdas/retrieve_generate/README.md)
- **Quick Start**: [backend/lambdas/retrieve_generate/QUICK_START.md](backend/lambdas/retrieve_generate/QUICK_START.md)

## Support

If you get stuck:
1. Review the documentation files listed above
2. Check CloudWatch logs for errors
3. Verify all prerequisites are met
4. Test each component independently
5. Review AWS Bedrock documentation

---

**Estimated Time**: 30-60 minutes for initial setup, plus Knowledge Base sync time (10-30 minutes depending on document count)
