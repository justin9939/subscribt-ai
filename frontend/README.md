# Subscribt AI Frontend

Next.js 15 frontend application for the Subscribt AI policy analysis platform.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + hand-written CSS Modules (`app/page.module.css`)
- **Component Library**: shadcn/ui is configured (`components.json`) but no components have been generated yet; Radix UI and `lucide-react` are installed dependencies but not yet used in code

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Build

```bash
npm run build
npm start
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## Project Structure

The app is currently a single page — there are no `components/`, `lib/`, `hooks/`, `types/`, or `api/` directories yet:

```
frontend/
└── app/
    ├── globals.css        # Design tokens (CSS variables) + Tailwind directives
    ├── layout.tsx         # Root layout (Inter font, page metadata)
    ├── page.tsx           # The entire app: upload widget + query form + results
    └── page.module.css    # CSS Modules styles consumed by page.tsx
```

## shadcn/ui Components

`components.json` configures shadcn/ui (New York style, `slate` base color, CSS variables), but **no components have been generated into `components/ui/` yet**. All current UI (buttons, form, cards) is hand-written in `page.tsx`/`page.module.css`, not shadcn primitives.

### Adding New Components

To add more shadcn/ui components, use the shadcn CLI:

```bash
npx shadcn@latest add [component-name]
```

For example:
```bash
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add table
```

Available components: https://ui.shadcn.com/docs/components

## Configuration Files

- `components.json` - shadcn/ui configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration
- `next.config.ts` - Next.js configuration
- `postcss.config.mjs` - PostCSS configuration

## Styling

Design tokens are defined twice in `app/globals.css`, deliberately kept in sync: plain CSS custom properties (the "Montreaux" palette — e.g. `--color-bg`, `--color-accent`) consumed by `page.module.css`, plus the same colors re-expressed as HSL triples (`--background`, `--primary`, etc.) for shadcn/Tailwind compatibility once shadcn components are added.

### Theme Customization

Edit the CSS variables in `app/globals.css` to customize the theme:

```css
:root {
  --color-bg: #FAFAF8;
  --color-accent: #2E5D47;
  --background: 45 20% 98%;
  --primary: 152 34% 27%;
  /* ... */
}
```

If you change a color, update both the `--color-*` variable and its HSL equivalent — nothing keeps them in sync automatically.

## Type Safety

All code must be TypeScript with strict mode enabled. No `.js` files are allowed in the frontend.

Key TypeScript features enabled:
- `strict: true`
- `noImplicitAny: true`
- `strictNullChecks: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noImplicitReturns: true`
- `noUncheckedIndexedAccess: true`

## Environment Variables

Create a `.env.local` file for local development (see `.env.example`):

```env
AWS_REGION=your-aws-region
NEXT_PUBLIC_KB_FUNCTION_URL=https://your-kb-function-url.lambda-url.your-aws-region.on.aws/
NEXT_PUBLIC_UPLOAD_FUNCTION_URL=https://your-upload-function-url.lambda-url.your-aws-region.on.aws/
```

These are Lambda Function URLs produced by `backend/deploy.sh` (see the top-level [README](../README.md)) — `page.tsx` reads them directly via `process.env` and calls them from the browser.

## Deployment

No CI/CD is configured in this repo. Per the top-level README, the intended path is deploying this Next.js app to Vercel; there is no Amplify configuration present.

## Contributing

- Use shadcn/ui components as the base for any new UI rather than hand-rolled CSS Modules
- All new code must be TypeScript
- Run type checking before committing
