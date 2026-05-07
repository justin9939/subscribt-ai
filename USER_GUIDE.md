# User Guide: Simplified Knowledge Base Query System

A simple guide for end users of the policy query system.

## What Is This?

This is a tool that lets you ask questions about your organization's policies and get accurate, cited answers. Think of it as a smart search engine for policy documents.

## How to Use It

### 1. Open the Application

Navigate to the application URL (e.g., http://localhost:3000 for local development).

You'll see a simple interface with:
- A text box for your question
- A Submit button
- A Clear button

### 2. Ask a Question

Type your question in the text box. Examples:
- "What is the remote work policy?"
- "How many vacation days do I get?"
- "What's the dress code?"
- "Can I work from home on Fridays?"

### 3. Submit Your Query

Click the **Submit** button or press **Enter**.

The system will:
1. Search the policy documents
2. Find relevant sections
3. Generate an answer based on those sections
4. Show you the answer with citations

This usually takes 2-4 seconds.

### 4. Review the Answer

You'll see:

**Answer Section**
- A clear, plain-language answer to your question
- If the policy doesn't address your question, you'll see: "Not addressed in the provided policy."

**Sources Section**
- Excerpts from the actual policy documents
- Source metadata (document name, location)
- You can expand "Source metadata" to see more details

**Session ID**
- A unique identifier for your conversation
- Used to maintain context for follow-up questions

### 5. Ask Follow-Up Questions

You can ask related follow-up questions without starting over. The system remembers the context of your conversation.

Example conversation:
1. "What is the remote work policy?"
2. "What about hybrid arrangements?" (follow-up)
3. "Do I need manager approval?" (follow-up)

### 6. Start a New Conversation

Click the **Clear** button to:
- Clear your current question
- Remove the previous answer
- Start a fresh conversation

## Tips for Better Results

### Write Clear Questions

✅ **Good questions:**
- "What is the policy on remote work?"
- "How many sick days am I entitled to?"
- "What are the requirements for expense reimbursement?"

❌ **Less effective questions:**
- "remote" (too vague)
- "Can I do whatever I want?" (too broad)
- "Tell me everything about everything" (too general)

### Be Specific

If you get a general answer, ask a more specific follow-up:
1. "What is the vacation policy?"
2. "How do I request vacation time?" (more specific)
3. "What happens if I need to cancel approved vacation?" (even more specific)

### Check the Citations

Always review the source citations to:
- Verify the answer is accurate
- See the full context
- Find the original document if you need more details

### Use Follow-Ups

Instead of repeating context, use follow-up questions:

❌ **Don't do this:**
1. "What is the remote work policy?"
2. "What is the remote work policy for managers?" (repeating context)

✅ **Do this:**
1. "What is the remote work policy?"
2. "What about for managers?" (follow-up)

## Understanding Responses

### Grounded Answers

All answers are based on actual policy documents. The system will:
- ✅ Quote or paraphrase from policies
- ✅ Cite specific sources
- ❌ Never make up information
- ❌ Never use external knowledge

### "Not Addressed" Responses

If you see "Not addressed in the provided policy," it means:
- The policy documents don't cover this topic
- You might need to ask HR directly
- The policy might exist but isn't in the system yet

This is intentional - it's better to say "I don't know" than to guess.

### Citations

Citations show you where the answer came from:
- **Text**: An excerpt from the policy document
- **Location**: Where to find the full document (usually an S3 path)

You can use this to:
- Verify the answer
- Read the full policy
- Share the source with others

## Common Questions

### "Why is it taking so long?"

Typical response time is 2-4 seconds. If it's slower:
- The system might be processing a complex query
- There might be network issues
- Try refreshing and asking again

### "The answer doesn't seem right"

If the answer seems incorrect:
1. Check the citations - do they support the answer?
2. Try rephrasing your question
3. Ask a more specific follow-up
4. Report the issue to your administrator

### "Can I search multiple policies at once?"

Yes! The system searches all uploaded policy documents automatically. You don't need to specify which policy to search.

### "Can I upload my own documents?"

Not in this simplified version. Documents are managed by administrators. Contact your HR or IT team to add new policies.

### "Is my conversation private?"

Check with your organization's privacy policy. The system may log queries for:
- Analytics (what topics are people asking about?)
- Quality improvement
- Compliance

### "Can I export or save answers?"

Currently, you can:
- Copy and paste the answer
- Take a screenshot
- Share the session ID with others (if they have access)

## Troubleshooting

### "I see an error message"

Common errors and solutions:

**"Query cannot be empty"**
- You submitted without typing a question
- Type a question and try again

**"Failed to process query"**
- There might be a temporary issue
- Wait a moment and try again
- If it persists, contact support

**"NEXT_PUBLIC_KB_FUNCTION_URL not configured"**
- This is a configuration issue
- Contact your administrator

### "Nothing happens when I click Submit"

- Check that you've typed a question
- Try refreshing the page
- Check your internet connection
- Try a different browser

### "The page won't load"

- Check the URL is correct
- Check your internet connection
- Try refreshing the page
- Clear your browser cache
- Contact support if the issue persists

## Best Practices

### For Employees

1. **Start broad, then narrow**: Ask a general question first, then follow up with specifics
2. **Check citations**: Always verify the source of the answer
3. **Ask follow-ups**: Use the conversation context for related questions
4. **Report issues**: If you get a wrong answer, report it
5. **Don't share sensitive info**: Don't include personal details in your questions

### For Managers

1. **Verify before acting**: Always check the cited policy before making decisions
2. **Escalate gaps**: If policies are missing, work with HR to add them
3. **Train your team**: Show employees how to use the system effectively
4. **Provide feedback**: Report quality issues to improve the system

### For HR/Administrators

1. **Keep policies updated**: Regularly update documents in the knowledge base
2. **Monitor usage**: Track what topics employees are asking about
3. **Fill gaps**: Add policies for frequently asked topics
4. **Quality check**: Periodically test the system with sample queries
5. **Communicate changes**: Let users know when policies are updated

## Privacy and Security

### What Gets Logged

Depending on your organization's configuration:
- Your questions (for analytics)
- The answers provided
- Timestamps
- Session IDs

### What Doesn't Get Logged

- Your personal identity (unless you include it in your question)
- Your location
- Your device information

### Data Retention

Check with your organization for:
- How long queries are stored
- Who has access to query logs
- How data is used

## Getting Help

If you need assistance:

1. **Check this guide** for common questions
2. **Contact your HR team** for policy-specific questions
3. **Contact IT support** for technical issues
4. **Report bugs** to your administrator

## Feedback

Help improve the system by:
- Reporting incorrect answers
- Suggesting missing policies
- Sharing what works well
- Identifying confusing responses

---

**Remember**: This system is a tool to help you find policy information quickly. For complex situations or official decisions, always consult with HR or your manager directly.
