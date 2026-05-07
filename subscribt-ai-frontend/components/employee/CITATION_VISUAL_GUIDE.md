# Citation Component Visual Guide

## Component Appearance

### Collapsed State (Default)

```
┌─────────────────────────────────────────────────────────────┐
│ 📄 3 Sources                                                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ║ [1] Vacation Policy                              [▼]      │
│ ║ Page 12 • Employee Handbook > Benefits > Time Off        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ║ [2] Sick Leave Entitlement                       [▼]      │
│ ║ Page 15 • Employee Handbook > Benefits > Leave           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ║ [3] Holiday Schedule                             [▼]      │
│ ║ Page 8 • Employee Handbook > General > Holidays          │
└─────────────────────────────────────────────────────────────┘
```

### Expanded State

```
┌─────────────────────────────────────────────────────────────┐
│ ║ [1] Vacation Policy                              [▲]      │
│ ║ Page 12 • Employee Handbook > Benefits > Time Off        │
│ ║                                                            │
│ ║ ┌────────────────────────────────────────────────────┐   │
│ ║ │ "Employees are entitled to 15 days of paid         │   │
│ ║ │ vacation per year. Vacation time accrues monthly   │   │
│ ║ │ and must be requested at least 2 weeks in advance."│   │
│ ║ └────────────────────────────────────────────────────┘   │
│ ║                                                            │
│ ║ Relevance: [████████████████░░░░] 92%                     │
│ ║                                    View in document →     │
└─────────────────────────────────────────────────────────────┘
```

## Color Coding

### Relevance Score Colors

- **Green** (≥80%): High relevance - primary source
- **Yellow** (60-79%): Medium relevance - supporting source
- **Orange** (<60%): Lower relevance - tangential reference

### Visual Examples

```
High Relevance (92%)
Relevance: [████████████████████] 92%  ← Green bar

Medium Relevance (68%)
Relevance: [█████████████░░░░░░░] 68%  ← Yellow bar

Lower Relevance (45%)
Relevance: [█████████░░░░░░░░░░░] 45%  ← Orange bar
```

## Layout in Chat Interface

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  👤 User                                                      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ How many vacation days do I get per year?           │    │
│  └─────────────────────────────────────────────────────┘    │
│  10:23 AM                                                     │
│                                                               │
│  🤖 Assistant                                                 │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ According to the Employee Handbook, you are         │    │
│  │ entitled to 15 days of paid vacation per year.      │    │
│  │ Vacation time accrues monthly and must be           │    │
│  │ requested at least 2 weeks in advance.              │    │
│  │                                                       │    │
│  │ Retrieved 1 relevant section                         │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  📄 1 Source                                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ ║ [1] Vacation Policy                      [▼]      │    │
│  │ ║ Page 12 • Employee Handbook > Benefits           │    │
│  └─────────────────────────────────────────────────────┘    │
│  10:23 AM                                                     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Interactive States

### Hover States

```
Normal:
┌─────────────────────────────────────────────────────────────┐
│ ║ [1] Vacation Policy                              [▼]      │
└─────────────────────────────────────────────────────────────┘

Hover on Card:
┌─────────────────────────────────────────────────────────────┐
│ ║ [1] Vacation Policy                              [▼]      │ ← Subtle shadow
└─────────────────────────────────────────────────────────────┘

Hover on Expand Button:
┌─────────────────────────────────────────────────────────────┐
│ ║ [1] Vacation Policy                             [▼]       │ ← Button highlighted
└─────────────────────────────────────────────────────────────┘
```

### Loading State (During Streaming)

```
┌─────────────────────────────────────────────────────────────┐
│  🤖 Assistant                                                 │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ According to the Employee Handbook, you are         │    │
│  │ entitled to 15 days of paid vacation per year...    │    │
│  │                                                       │    │
│  │ ⏳ Generating response...                            │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  📄 1 Source                                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ ║ [1] Vacation Policy                      [▼]      │    │ ← Citation appears
│  │ ║ Page 12 • Employee Handbook > Benefits           │    │    during streaming
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Responsive Behavior

### Desktop (>768px)

```
┌───────────────────────────────────────────────────────────────────┐
│ ║ [1] Vacation Policy                                     [▼]     │
│ ║ Page 12 • Employee Handbook > Benefits > Time Off > Annual     │
└───────────────────────────────────────────────────────────────────┘
```

### Tablet (768px)

```
┌─────────────────────────────────────────────────────────┐
│ ║ [1] Vacation Policy                          [▼]      │
│ ║ Page 12 • Employee Handbook > Benefits > Time Off     │
└─────────────────────────────────────────────────────────┘
```

### Mobile (<640px)

```
┌───────────────────────────────────────┐
│ ║ [1] Vacation Policy        [▼]      │
│ ║ Page 12 • Employee Handbook...      │
└───────────────────────────────────────┘
```

## Edge Cases

### No Citations

```
┌─────────────────────────────────────────────────────────────┐
│  🤖 Assistant                                                 │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Not addressed in the provided policy.               │    │
│  └─────────────────────────────────────────────────────┘    │
│  10:23 AM                                                     │
│                                                               │
│  (No citations displayed)                                     │
└─────────────────────────────────────────────────────────────┘
```

### Single Citation

```
📄 1 Source

┌─────────────────────────────────────────────────────────────┐
│ ║ [1] Vacation Policy                              [▼]      │
│ ║ Page 12 • Employee Handbook > Benefits > Time Off        │
└─────────────────────────────────────────────────────────────┘
```

### Multiple Citations (5+)

```
📄 5 Sources

┌─────────────────────────────────────────────────────────────┐
│ ║ [1] Vacation Policy                              [▼]      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ║ [2] Sick Leave Entitlement                       [▼]      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ║ [3] Holiday Schedule                             [▼]      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ║ [4] Personal Days                                [▼]      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ║ [5] Leave Request Process                        [▼]      │
└─────────────────────────────────────────────────────────────┘
```

### Long Snippet Text

```
┌─────────────────────────────────────────────────────────────┐
│ ║ [1] Vacation Policy                              [▲]      │
│ ║ Page 12 • Employee Handbook > Benefits > Time Off        │
│ ║                                                            │
│ ║ ┌────────────────────────────────────────────────────┐   │
│ ║ │ "Employees are entitled to 15 days of paid         │   │
│ ║ │ vacation per year. Vacation time accrues monthly   │   │
│ ║ │ at a rate of 1.25 days per month. All vacation     │   │
│ ║ │ requests must be submitted at least 2 weeks in     │   │
│ ║ │ advance through the HR portal. Vacation days may   │   │
│ ║ │ be carried over to the next year up to a maximum   │   │
│ ║ │ of 5 days. Any unused vacation days beyond this    │   │
│ ║ │ limit will be forfeited at the end of the fiscal   │   │
│ ║ │ year."                                              │   │
│ ║ └────────────────────────────────────────────────────┘   │
│ ║                                                            │
│ ║ Relevance: [████████████████░░░░] 92%                     │
│ ║                                    View in document →     │
└─────────────────────────────────────────────────────────────┘
```

## Accessibility Features

### Keyboard Navigation

```
Tab Order:
1. First citation expand button
2. Second citation expand button
3. Third citation expand button
...

When expanded:
1. Citation expand button
2. "View in document" link
3. Next citation expand button
```

### Screen Reader Announcements

```
"3 Sources"
"Citation 1 of 3: Vacation Policy, Page 12, Employee Handbook, Benefits, Time Off"
"Button: Expand citation"

(After expanding)
"Citation expanded"
"Quote: Employees are entitled to 15 days of paid vacation per year..."
"Relevance: 92 percent"
"Link: View in document"
```

## Animation & Transitions

### Expand/Collapse Animation

```
Collapsed → Expanded:
- Content fades in (200ms)
- Height animates smoothly
- Chevron rotates 180° (200ms)

Expanded → Collapsed:
- Content fades out (200ms)
- Height animates smoothly
- Chevron rotates back (200ms)
```

### Hover Transitions

```
- Shadow intensity: 150ms ease
- Background color: 150ms ease
- Button background: 150ms ease
```

## Component Hierarchy

```
CitationList
├── Header ("X Sources")
│   ├── FileText icon
│   └── Count text
└── Citation Cards (map)
    └── Card
        ├── CardHeader
        │   ├── Section heading
        │   ├── Metadata (page, path)
        │   └── Expand button
        └── CardContent (if expanded)
            ├── Snippet (quoted)
            ├── Relevance score bar
            └── View document link
```

## Styling Details

### Colors (Tailwind Classes)

- **Card border**: `border-l-4 border-l-primary/50`
- **Card background**: `bg-card`
- **Snippet background**: `bg-muted/50`
- **Text colors**:
  - Primary: `text-foreground`
  - Secondary: `text-muted-foreground`
  - Snippet: `text-muted-foreground italic`

### Spacing

- **Card gap**: `space-y-2` (0.5rem)
- **Card padding**: `p-3` (0.75rem)
- **Snippet padding**: `p-3` (0.75rem)
- **Metadata gap**: `gap-2` (0.5rem)

### Typography

- **Section heading**: `text-sm font-medium`
- **Metadata**: `text-xs text-muted-foreground`
- **Snippet**: `text-sm italic`
- **Count**: `text-sm font-medium`

## Best Practices

### When to Show Citations

✅ **Always show** when:
- AI response contains factual claims
- Response references specific policy sections
- User asks for source verification

❌ **Don't show** when:
- No relevant documents found
- Response is "Not addressed in the provided policy"
- Error occurred during retrieval

### Citation Ordering

Citations should be ordered by:
1. **Relevance score** (highest first)
2. **Document hierarchy** (main sections before subsections)
3. **Page number** (earlier pages first)

### Performance Considerations

- Render only visible citations initially
- Lazy load expanded content
- Debounce expand/collapse animations
- Use React.memo for citation cards if list is large (10+)

## Summary

The citation component provides a clean, accessible, and user-friendly way to display source references. It balances information density with usability through progressive disclosure, visual hierarchy, and clear relevance indicators.
