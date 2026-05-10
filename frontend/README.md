# Subscribt AI Frontend

Next.js 14 frontend application for the Subscribt AI policy analysis platform.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Component Library**: shadcn/ui
- **Icons**: Lucide React

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

```
frontend/
├── app/                    # Next.js App Router
│   ├── (hr)/              # HR Manager routes
│   ├── (employee)/        # Employee routes
│   ├── api/               # API routes
│   ├── globals.css        # Global styles with Tailwind
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── hr/               # HR-specific components
│   ├── employee/         # Employee-specific components
│   └── ui/               # shadcn/ui components
├── lib/                  # Core business logic
│   ├── ai/              # AI/RAG logic
│   ├── db/              # Database queries
│   ├── opensearch/      # Vector search
│   ├── chat/            # Chat utilities
│   └── utils.ts         # Utility functions
├── hooks/               # Custom React hooks
├── types/               # TypeScript type definitions
└── public/              # Static assets
```

## shadcn/ui Components

The project uses shadcn/ui for UI components. Components are installed in `components/ui/`.

### Installed Components

- Button
- Card
- Input
- Label
- Textarea
- Toast

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

The project uses Tailwind CSS with CSS variables for theming. Color scheme and design tokens are defined in `app/globals.css`.

### Theme Customization

Edit the CSS variables in `app/globals.css` to customize the theme:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  /* ... */
}
```

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

Create a `.env.local` file for local development:

```env
NEXT_PUBLIC_CHAT_LAMBDA_FUNCTION_URL=your-lambda-url
NEXT_PUBLIC_API_ENDPOINT=your-api-endpoint
```

## Deployment

The frontend is deployed to AWS Amplify. Push to the main branch to trigger automatic deployment.

## Contributing

- Follow the project structure conventions
- Maintain persona separation (HR vs Employee)
- Use shadcn/ui components as the base
- All new code must be TypeScript
- Run type checking before committing
