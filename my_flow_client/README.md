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

## Authentication Setup

This application uses **Logto** for authentication. Follow these steps to configure it:

### 1. Create a Logto Application

1. Go to [Logto Cloud Console](https://cloud.logto.io/)
2. Create a new **Single Page Application (SPA)**
3. Note the following credentials from Logto Console:
   - **App ID** (NEXT_PUBLIC_LOGTO_APP_ID)
   - **App Secret** (LOGTO_APP_SECRET)
   - **Endpoint** (NEXT_PUBLIC_LOGTO_ENDPOINT)
   - **Cookie Secret** (LOGTO_COOKIE_SECRET) - provided by Logto

### 2. Configure Redirect URIs

In your Logto application settings, add these redirect URIs:
- **Sign-in redirect**: `http://localhost:3000/callback`
- **Sign-out redirect**: `http://localhost:3000`
- **Post sign-out redirect**: `http://localhost:3000`

For production, add your production URLs (e.g., `https://yourdomain.com/callback`)

### 3. Environment Variables

**Option A: Using 1Password CLI (Recommended)**

Store secrets in 1Password and use the template:

```bash
bun run dev  # Automatically uses: op run --env-file=../.env.template -- next dev
```

**Option B: Using .env.local**

Create `my_flow_client/.env.local`:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_LOGTO_RESOURCE=https://api.myflow.dev  # Your API identifier

# Logto Authentication (Get these from Logto Console)
NEXT_PUBLIC_LOGTO_ENDPOINT=https://YOUR_TENANT.logto.app
NEXT_PUBLIC_LOGTO_APP_ID=your_app_id_here
LOGTO_APP_SECRET=your_app_secret_here
LOGTO_COOKIE_SECRET=your_cookie_secret_from_logto

# Base URL
NEXTAUTH_URL=http://localhost:3000
```

### 4. Test Authentication

1. Start the dev server: `bun run dev`
2. Visit `http://localhost:3000`
3. Click "Sign In" - should redirect to Logto
4. Sign in with a test account
5. Should redirect back to `/callback` then to `/dashboard`

## Available Scripts

### Development
```bash
bun dev              # Start development server with 1Password secrets
```

### Building
```bash
bun build            # Build for production
bun start            # Start production server
```

### Testing
```bash
# Unit Tests (Vitest)
bun test             # Run all unit tests
bun test:watch       # Run tests in watch mode
bun test:coverage    # Run tests with coverage report (≥80% required)

# E2E Tests (Playwright)
bun test:e2e         # Run E2E tests in headless mode
bun test:e2e:ui      # Run E2E tests with UI mode
bun test:e2e:debug   # Run E2E tests in debug mode
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