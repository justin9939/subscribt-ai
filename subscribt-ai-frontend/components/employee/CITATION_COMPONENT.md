# Citation Display Component

## Overview

The citation display component (`CitationList`) is a fully implemented, production-ready React component that displays source citations with expandable details. It's designed to provide verifiable references for AI-generated responses, ensuring strict grounding to source documents.

## Component Location

```
components/employee/citation-list.tsx
```

## Features

### ✅ Implemented Features

1. **Collapsible Citation Cards**
   - Each citation is displayed as a card with expand/collapse functionality
   - Compact view shows: section heading, page number, and hierarchy path
   - Expanded view reveals: full snippet, relevance score, and document link

2. **Visual Hierarchy**
   - Left border accent (primary color) for visual distinction
   - Numbered citations [1], [2], etc. for easy reference
   - Clean card-based layout using shadcn/ui components

3. **Relevance Score Visualization**
   - Color-coded progress bar (green ≥80%, yellow ≥60%, orange <60%)
   - Percentage display for precise relevance indication
   - Helps users assess citation quality at a glance

4. **Source Metadata Display**
   - Page number for PDF reference
   - Section heading for context
   - Hierarchical path showing document structure
   - Document ID for backend tracking

5. **Snippet Display**
   - Quoted text excerpt from source document
   - Styled with italic formatting and quotation marks
   - Background highlight for readability

6. **Document Viewer Integration**
   - "View in document" link (placeholder for future implementation)
   - Prepared for deep-linking to specific pages/sections

## Type Definitions

The component uses the `Citation` interface from `types/query.ts`:

```typescript
export interface Citation {
  id: string;              // Unique identifier
  documentId: string;      // Source document ID
  chunkId: string;         // Document chunk ID
  snippet: string;         // Text excerpt
  pageNumber: number;      // PDF page number
  sectionHeading: string;  // Section title
  hierarchyPath: string;   // Full document path (e.g., "Policy > Section 3.2")
  relevanceScore: number;  // Similarity score (0-1)
}
```

## Usage

### Basic Usage

```tsx
import { CitationList } from '@/components/employee';

function MyComponent() {
  const citations: Citation[] = [
    {
      id: 'cite-1',
      documentId: 'doc-123',
      chunkId: 'chunk-456',
      snippet: 'Employees are entitled to 15 days of paid vacation per year.',
      pageNumber: 12,
      sectionHeading: 'Vacation Policy',
      hierarchyPath: 'Employee Handbook > Benefits > Time Off',
      relevanceScore: 0.92
    }
  ];

  return <CitationList citations={citations} />;
}
```

### Integration with Message Bubble

The component is already integrated into the `MessageBubble` component:

```tsx
{!isUser && message.citations && message.citations.length > 0 && (
  <CitationList citations={message.citations} />
)}
```

## Component Architecture

### State Management

- Uses React `useState` to track expanded citation IDs
- Maintains a `Set<string>` for efficient lookup and toggle operations

### UI Components Used

- `Card`, `CardContent`, `CardHeader`, `CardTitle` from `@/components/ui/card`
- `Button` from `@/components/ui/button`
- Icons from `lucide-react`: `FileText`, `ChevronDown`, `ChevronUp`, `ExternalLink`

### Styling

- Tailwind CSS for all styling
- Responsive design with proper spacing
- Accessible color contrast
- Smooth transitions for expand/collapse

## Key Design Decisions

### 1. Expandable by Default (Collapsed)
Citations start collapsed to avoid overwhelming users with information. Users can expand individual citations to see full details.

### 2. Visual Relevance Indicators
Color-coded relevance scores help users quickly identify the most relevant sources without reading every citation.

### 3. Numbered References
Citations are numbered [1], [2], etc., allowing the AI response text to reference specific citations (e.g., "According to [1]...").

### 4. Hierarchical Context
The `hierarchyPath` provides document structure context, helping users understand where the information comes from within the policy document.

### 5. Snippet Quotations
Snippets are displayed with quotation marks and italic styling to clearly indicate they are direct quotes from source material.

## Accessibility

- Semantic HTML structure
- Keyboard navigation support via Button components
- ARIA-compliant expand/collapse buttons
- Sufficient color contrast for text and UI elements
- Screen reader friendly with proper heading hierarchy

## Future Enhancements

### Planned Features (TODO)

1. **Document Viewer Integration**
   - Currently shows a placeholder button
   - Will deep-link to specific page/section in PDF viewer
   - Implementation location: `onClick` handler in "View in document" button

2. **Citation Highlighting**
   - Highlight specific citation when referenced in response text
   - Scroll to citation when clicked from inline reference

3. **Copy Citation**
   - Add button to copy citation text in standard format
   - Support multiple citation formats (APA, MLA, etc.)

4. **Citation Filtering**
   - Filter by relevance score threshold
   - Filter by document or section

5. **Citation Export**
   - Export all citations as JSON or formatted text
   - Useful for audit trails and documentation

## Testing Considerations

### Manual Testing Checklist

- [ ] Citations display correctly with all metadata
- [ ] Expand/collapse functionality works smoothly
- [ ] Relevance score colors match thresholds
- [ ] Long snippets don't break layout
- [ ] Multiple citations render without overlap
- [ ] Empty citations array renders nothing (no error)
- [ ] Responsive design works on mobile/tablet
- [ ] Keyboard navigation functions properly

### Edge Cases to Test

1. **No citations**: Component should render nothing
2. **Single citation**: Should display without errors
3. **Many citations** (10+): Should remain performant
4. **Long snippet text**: Should wrap properly
5. **Missing optional fields**: Should handle gracefully
6. **Very high/low relevance scores**: Should display correctly

## Performance

- Efficient state management with Set data structure
- No unnecessary re-renders (proper React key usage)
- Lazy rendering of expanded content
- Minimal DOM manipulation

## Compliance with Product Requirements

### ✅ Strict Grounding
Citations provide verifiable references to source documents, ensuring all AI responses are grounded in actual policy text.

### ✅ Verifiable Citations
Every citation includes:
- Direct snippet from source
- Page number for manual verification
- Section heading for context
- Hierarchical path for document navigation

### ✅ Employee-Focused Design
- Plain language labels ("Sources" not "Citations")
- Clean, uncluttered interface
- Progressive disclosure (expand for details)
- Visual relevance indicators for quick assessment

## Related Components

- **MessageBubble** (`message-bubble.tsx`): Displays citations below assistant messages
- **MessageList** (`message-list.tsx`): Renders multiple messages with citations
- **QueryInterface** (`query-interface.tsx`): Main chat interface that uses MessageList

## Dependencies

```json
{
  "react": "^18.x",
  "lucide-react": "^0.x",
  "@radix-ui/react-slot": "^1.x",
  "class-variance-authority": "^0.x",
  "tailwindcss": "^3.x"
}
```

## Export

The component is properly exported in `components/employee/index.ts`:

```typescript
export { CitationList } from './citation-list';
```

## Summary

The citation display component is **complete and production-ready**. It successfully implements all core requirements for displaying verifiable source citations in the Subscribt AI platform. The component follows React best practices, uses TypeScript for type safety, and integrates seamlessly with the existing employee query interface.

No additional implementation is required for the basic citation display functionality. Future enhancements (document viewer integration, citation export, etc.) can be added incrementally as needed.
