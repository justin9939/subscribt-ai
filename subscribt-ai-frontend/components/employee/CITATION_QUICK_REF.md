# Citation Component Quick Reference

## Import

```typescript
import { CitationList } from '@/components/employee';
```

## Basic Usage

```tsx
<CitationList citations={citations} />
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `citations` | `Citation[]` | Yes | Array of citation objects to display |

## Citation Type

```typescript
interface Citation {
  id: string;              // Unique identifier
  documentId: string;      // Source document ID
  chunkId: string;         // Document chunk ID
  snippet: string;         // Text excerpt from source
  pageNumber: number;      // PDF page number
  sectionHeading: string;  // Section title
  hierarchyPath: string;   // Full path (e.g., "Handbook > Benefits")
  relevanceScore: number;  // Similarity score (0-1)
}
```

## Example

```tsx
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
```

## Features

- ✅ Collapsible citation cards
- ✅ Numbered references [1], [2], etc.
- ✅ Color-coded relevance scores
- ✅ Page numbers and hierarchy paths
- ✅ Quoted snippets
- ✅ Responsive design
- ✅ Keyboard accessible
- ✅ Zero citations = no render

## Relevance Score Colors

| Score | Color | Meaning |
|-------|-------|---------|
| ≥80% | Green | High relevance |
| 60-79% | Yellow | Medium relevance |
| <60% | Orange | Lower relevance |

## Integration Points

### With MessageBubble

```tsx
// Already integrated in message-bubble.tsx
{!isUser && message.citations && message.citations.length > 0 && (
  <CitationList citations={message.citations} />
)}
```

### With Custom Components

```tsx
function CustomQueryResult({ response, citations }: Props) {
  return (
    <div>
      <p>{response}</p>
      <CitationList citations={citations} />
    </div>
  );
}
```

## Styling

Uses Tailwind CSS and shadcn/ui components:
- `Card`, `CardHeader`, `CardContent`, `CardTitle`
- `Button` (ghost variant for expand/collapse)
- Icons: `FileText`, `ChevronDown`, `ChevronUp`, `ExternalLink`

## State Management

- Internal state tracks expanded citation IDs
- No external state management required
- Stateless component (no side effects)

## Performance

- Efficient Set-based state for expand/collapse
- Lazy rendering of expanded content
- Minimal re-renders with proper React keys
- Handles 10+ citations without performance issues

## Accessibility

- ✅ Semantic HTML
- ✅ Keyboard navigation
- ✅ ARIA-compliant buttons
- ✅ Screen reader friendly
- ✅ Sufficient color contrast

## Common Patterns

### Empty State

```tsx
// Component handles this automatically
<CitationList citations={[]} />
// Renders: null (nothing displayed)
```

### Single Citation

```tsx
<CitationList citations={[singleCitation]} />
// Displays: "1 Source"
```

### Multiple Citations

```tsx
<CitationList citations={multipleCitations} />
// Displays: "X Sources"
```

### With Loading State

```tsx
{isLoading ? (
  <Skeleton className="h-20 w-full" />
) : (
  <CitationList citations={citations} />
)}
```

### With Error Handling

```tsx
{error ? (
  <Alert variant="destructive">
    <AlertDescription>Failed to load citations</AlertDescription>
  </Alert>
) : (
  <CitationList citations={citations} />
)}
```

## TODO Items

The following features are planned but not yet implemented:

1. **Document Viewer Integration**
   - Location: "View in document" button onClick handler
   - Current: `console.log('View document:', citation.documentId)`
   - Needed: Deep-link to PDF viewer with page/section

2. **Citation Highlighting**
   - Highlight citation when referenced in response text
   - Scroll to citation on inline reference click

3. **Copy Citation**
   - Add button to copy citation in standard format
   - Support multiple formats (APA, MLA, Chicago)

4. **Citation Filtering**
   - Filter by relevance threshold
   - Filter by document or section

5. **Citation Export**
   - Export all citations as JSON
   - Export as formatted text for documentation

## Troubleshooting

### Citations not displaying

```typescript
// Check if citations array is populated
console.log('Citations:', citations);

// Check if citations have required fields
citations.forEach(c => {
  console.log('Citation ID:', c.id);
  console.log('Has snippet:', !!c.snippet);
});
```

### Expand/collapse not working

```typescript
// Check if citation IDs are unique
const ids = citations.map(c => c.id);
const uniqueIds = new Set(ids);
console.log('Unique IDs:', uniqueIds.size === ids.length);
```

### Styling issues

```typescript
// Verify Tailwind classes are being applied
// Check browser DevTools for computed styles
// Ensure shadcn/ui components are properly installed
```

## Related Files

- **Component**: `components/employee/citation-list.tsx`
- **Types**: `types/query.ts`
- **Integration**: `components/employee/message-bubble.tsx`
- **Usage**: `components/employee/query-interface.tsx`
- **Exports**: `components/employee/index.ts`

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

## Testing

```typescript
// Example test cases
describe('CitationList', () => {
  it('renders nothing when citations array is empty', () => {
    // Test implementation
  });

  it('displays correct number of sources', () => {
    // Test implementation
  });

  it('expands and collapses citations', () => {
    // Test implementation
  });

  it('shows correct relevance score color', () => {
    // Test implementation
  });
});
```

## Support

For questions or issues:
1. Check `CITATION_COMPONENT.md` for detailed documentation
2. Check `CITATION_VISUAL_GUIDE.md` for visual examples
3. Review `types/query.ts` for type definitions
4. Check browser console for errors
5. Verify all dependencies are installed

## Version

- **Component Version**: 1.0.0
- **Last Updated**: Current implementation
- **Status**: ✅ Production Ready
