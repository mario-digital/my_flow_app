# MyFlow Frontend

Next.js 15 frontend application for MyFlow - Context-based flow management system.

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **React**: React 19
- **Language**: TypeScript 5.6+
- **Styling**: Tailwind CSS 4.x
- **UI Components**: shadcn/ui (Radix UI primitives)
- **State Management**: TanStack Query (server state), React Context (local state)
- **Package Manager**: Bun 1.x

## Setup

### Prerequisites

- Bun 1.x or later
- 1Password CLI (`op`) for secrets

### Installation

```bash
# From root directory
cd my_flow_client

# Install dependencies
bun install
```

### Environment Variables

Create a `.env.local` file or use 1Password CLI to inject secrets:

```bash
# Required variables (see ../.env.template for 1Password references)
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_LOGTO_ENDPOINT=<your-logto-endpoint>
NEXT_PUBLIC_LOGTO_APP_ID=<your-logto-app-id>
LOGTO_APP_SECRET=<your-logto-secret>
LOGTO_COOKIE_SECRET=<your-cookie-secret>
```

**With 1Password:**
```bash
op run --env-file=../.env.template -- bun dev
```

## Available Scripts

### Development
```bash
bun dev              # Start development server (http://localhost:3000)
```

### Building
```bash
bun build            # Build for production
bun start            # Start production server
```

### Testing
```bash
bun test             # Run tests with Vitest
bun test:watch       # Run tests in watch mode
bun test:coverage    # Run tests with coverage report
```

### Code Quality
```bash
bun lint             # Lint with ESLint
bun format           # Format with Prettier
bun format:check     # Check formatting
bun typecheck        # Type check with TypeScript
```

## Project Structure

```
my_flow_client/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── layout.tsx    # Root layout
│   │   ├── page.tsx      # Home page
│   │   └── globals.css   # Global styles
│   ├── components/       # React components
│   │   └── ui/           # shadcn/ui components
│   ├── lib/              # Utilities
│   │   ├── api-client.ts # Centralized API client
│   │   ├── config.ts     # Environment config
│   │   └── utils.ts      # Helper functions
│   ├── hooks/            # Custom React hooks
│   │   └── useFlows.ts   # Example: Flow data hook
│   └── types/            # TypeScript types
│       └── api.ts        # API types (generated from OpenAPI)
├── public/               # Static assets
├── components.json       # shadcn/ui configuration
├── next.config.ts        # Next.js configuration
├── tailwind.config.ts    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Dependencies and scripts
```

## shadcn/ui Components

Add components using the shadcn CLI:

```bash
# Add a component
bunx shadcn@latest add button

# Add multiple components
bunx shadcn@latest add button card dialog
```

## Support

Refer to the [root README](../README.md) for overall project documentation.