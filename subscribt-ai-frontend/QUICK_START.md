# Employee Query Interface - Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Configure Environment

Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_CHAT_LAMBDA_FUNCTION_URL=https://your-function-url.lambda-url.us-east-1.on.aws/
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

Visit: **http://localhost:3000** → Redirects to `/query`

---

## 📂 Key Files

| File | Purpose |
|------|---------|
| `components/employee/query-interface.tsx` | Main chat interface |
| `lib/chat/use-chat-stream.ts` | Streaming hook |
| `lib/chat/client.ts` | Fetch utilities |
| `types/chat.ts` | TypeScript types |
| `.env.local` | Configuration (create this) |

---

## 🎯 Usage

### Basic Query Flow

1. User types: "What is the PTO policy?"
2. Clicks **Send** (or presses **Enter**)
3. Response streams in real-time
4. Citations appear below the response
5. User can expand citations to see snippets

### Suggested Queries

On first load, 6 example queries are shown:
- PTO entitlement
- Harassment reporting
- Remote work policy
- Discrimination complaints
- Health insurance benefits
- Termination grounds

Click any to populate the input.

---

## 🔧 Commands

```bash
# Development
npm run dev              # Start dev server (http://localhost:3000)

# Production
npm run build            # Build for production
npm start                # Start production server

# Quality
npm run lint             # Run ESLint
npm run type-check       # TypeScript type checking
```

---

## 🧪 Testing Locally

### Without Backend

The interface will show an error when trying to send a message:
```
NEXT_PUBLIC_CHAT_LAMBDA_FUNCTION_URL is not configured
```

This is expected. You need a real Lambda Function URL.

### With Backend

1. Deploy the Lambda function with Response Streaming enabled
2. Get the Function URL from AWS Console
3. Add to `.env.local`
4. Restart dev server
5. Send a test query

---

## 📊 Expected Stream Format

Your Lambda should return Server-Sent Events:

```
data: {"type":"content","content":"The policy"}
data: {"type":"content","content":" states that"}
data: {"type":"citation","citation":{"id":"...","snippet":"...","pageNumber":5,...}}
data: {"type":"metadata","metadata":{"query_id":"...","conversation_id":"...","retrieval_count":3}}
data: [DONE]
```

---

## 🎨 Customization

### Change Suggested Queries

Edit: `components/employee/suggested-queries.tsx`

```tsx
const SUGGESTED_QUERIES: SuggestedQuery[] = [
  {
    id: 'custom',
    text: 'Your custom query here',
    category: 'Custom Category',
    icon: <YourIcon className="h-4 w-4" />,
  },
  // ...
];
```

### Change Theme Colors

Edit: `app/globals.css`

```css
:root {
  --primary: 221.2 83.2% 53.3%;  /* Change this */
  /* ... */
}
```

### Add More Metadata

Edit: `components/employee/message-bubble.tsx`

```tsx
{message.metadata?.your_custom_field && (
  <div>Your custom field: {message.metadata.your_custom_field}</div>
)}
```

---

## 🐛 Troubleshooting

### "Function URL not configured"

**Solution**: Create `.env.local` with `NEXT_PUBLIC_CHAT_LAMBDA_FUNCTION_URL`

### Streaming not working

**Check**:
1. Lambda has `InvokeMode: RESPONSE_STREAM`
2. CORS headers are set on Lambda response
3. Browser console for network errors

### Citations not appearing

**Check**:
1. Backend is sending `citation` chunks
2. Citation format matches `Citation` type in `types/query.ts`

### Auto-scroll not working

**Check**: `messagesEndRef` is rendered after all messages

### Build fails

**Run**:
```bash
npm run type-check  # Check TypeScript errors
npm run lint        # Check ESLint errors
```

---

## 📚 Documentation

- **Full Guide**: `EMPLOYEE_QUERY_INTERFACE.md`
- **Architecture**: `ARCHITECTURE_DIAGRAM.md`
- **Component Docs**: `components/employee/README.md`
- **Implementation Summary**: `IMPLEMENTATION_SUMMARY.md`

---

## 🔗 Routes

| Route | Description |
|-------|-------------|
| `/` | Redirects to `/query` |
| `/query` | Employee query interface |

---

## 🎯 Next Steps

1. ✅ Set up `.env.local`
2. ✅ Run `npm run dev`
3. ✅ Test with real Lambda Function URL
4. ✅ Customize suggested queries (optional)
5. ✅ Deploy to AWS Amplify

---

## 💡 Tips

- **Keyboard Shortcuts**: Enter to send, Shift+Enter for new line
- **Cancel Streaming**: Click the stop button while generating
- **Clear Chat**: Click "Clear" button in header (with confirmation)
- **Expand Citations**: Click the chevron on any citation card
- **Dark Mode**: Automatically follows system preference

---

## 🚨 Important Notes

1. **Environment Variables**: Must start with `NEXT_PUBLIC_` to be accessible in browser
2. **Lambda Function URL**: Must have Response Streaming enabled (`InvokeMode: RESPONSE_STREAM`)
3. **CORS**: Lambda must return proper CORS headers for browser access
4. **HTTPS Only**: Lambda Function URL must use HTTPS (enforced by AWS)

---

## 📞 Support

For issues:
1. Check browser console for errors
2. Check Lambda CloudWatch logs
3. Verify environment variables
4. Review documentation files

---

**Status**: ✅ Ready to use  
**Build**: ✅ Passing  
**Type Check**: ✅ Passing  
**Lint**: ✅ Passing  
