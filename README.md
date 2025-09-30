# MyFlow - Context-Based Flow Management System

A modern full-stack application for managing flows (tasks, goals, reminders) organized by context with AI-powered assistance.

## Architecture

This is a monorepo containing:
- **Frontend**: Next.js 15 with React 19, TypeScript, and Tailwind CSS (`my_flow_client/`)
- **Backend**: FastAPI with Python 3.12+ and MongoDB (`my_flow_api/`)

For detailed architecture documentation, see [`docs/architecture/`](docs/architecture/).

## Prerequisites

Before you begin, ensure you have the following installed:

- **Bun** 1.x or later - [Install Bun](https://bun.sh/)
- **Python** 3.12+ - [Install Python](https://www.python.org/downloads/)
- **uv** - Fast Python package manager - [Install uv](https://docs.astral.sh/uv/)
- **1Password CLI** (`op`) - For secure secret management - [Install 1Password CLI](https://developer.1password.com/docs/cli/get-started/)
- **MongoDB Atlas** account (free tier) - [Sign up](https://www.mongodb.com/cloud/atlas)

## Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd my_flow_app

# Install all dependencies
bun install

# Install backend dependencies
cd my_flow_api && uv sync && cd ..
```

### 2. Configure Secrets with 1Password

This project uses 1Password CLI for secure secret management. **Never commit `.env` files to Git.**

```bash
# Authenticate with 1Password
op signin

# Create development vault
op vault create "MyFlow Development"

# Create secret items (follow prompts to add values)
op item create --category=login --title="MyFlow MongoDB" --vault="MyFlow Development"
op item create --category=login --title="MyFlow Logto Backend" --vault="MyFlow Development"
op item create --category=login --title="MyFlow Logto Frontend" --vault="MyFlow Development"
op item create --category=login --title="MyFlow AI Keys" --vault="MyFlow Development"
```

See `.env.template` for required environment variables and their 1Password references.

### 3. Run Development Servers

```bash
# Run both frontend and backend
bun run dev

# Or run separately:
bun run dev:frontend  # Frontend on http://localhost:3000
bun run dev:backend   # Backend on http://localhost:8000
```

**With 1Password secret injection:**

```bash
# Run with secrets loaded from 1Password
op run --env-file=.env.template -- bun run dev
```

## Project Structure

```
my_flow_app/
├── my_flow_client/          # Next.js 15 frontend
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   ├── components/      # React components
│   │   ├── lib/             # Utilities and API client
│   │   ├── hooks/           # Custom React hooks
│   │   └── types/           # TypeScript types
│   └── package.json
├── my_flow_api/             # FastAPI backend
│   ├── src/
│   │   ├── main.py          # FastAPI entry point
│   │   ├── config.py        # Pydantic Settings
│   │   ├── models/          # Pydantic schemas
│   │   ├── routers/         # API endpoints
│   │   ├── services/        # Business logic
│   │   └── repositories/    # Data access layer
│   ├── tests/               # Backend tests
│   └── pyproject.toml
├── docs/                    # Project documentation
│   ├── prd/                 # Product requirements
│   ├── architecture/        # Technical specs
│   └── stories/             # User stories
├── scripts/                 # Utility scripts
├── .env.template            # Environment variable template
└── package.json             # Root workspace config
```

## Available Scripts

### Development
```bash
bun run dev            # Run both frontend and backend
bun run dev:frontend   # Run frontend only
bun run dev:backend    # Run backend only
```

### Testing
```bash
bun run test           # Run all tests
bun run test:frontend  # Run frontend tests (Vitest)
bun run test:backend   # Run backend tests (pytest)
```

### Linting & Formatting
```bash
bun run lint           # Lint all code
bun run format         # Format all code
bun run typecheck      # Type check all code
```

### Building
```bash
bun run build          # Build both projects
bun run build:frontend # Build frontend for production
```

## Environment Variables

All secrets are managed via 1Password CLI. See `.env.template` for the complete list of required variables.

**Frontend** (`my_flow_client/.env.local`):
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_LOGTO_ENDPOINT` - Logto auth endpoint
- `NEXT_PUBLIC_LOGTO_APP_ID` - Logto app ID
- `LOGTO_APP_SECRET` - Logto app secret
- `LOGTO_COOKIE_SECRET` - Session cookie secret

**Backend** (`my_flow_api/.env`):
- `MONGODB_URI` - MongoDB connection string
- `LOGTO_ENDPOINT` - Logto auth endpoint
- `LOGTO_APP_ID` - Logto app ID
- `LOGTO_APP_SECRET` - Logto app secret
- `OPENAI_API_KEY` - OpenAI API key
- `ANTHROPIC_API_KEY` - Anthropic API key

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript 5.6+, Tailwind CSS 4.x
- **UI Components**: shadcn/ui (Radix UI)
- **Backend**: Python 3.12+, FastAPI 0.115+, Motor (async MongoDB)
- **Database**: MongoDB 7.x+ (Atlas free tier)
- **Auth**: Logto (OAuth 2.0, JWT)
- **Testing**: Vitest (frontend), pytest (backend), Playwright (E2E)
- **Linting**: ESLint + Prettier (frontend), Ruff (backend)
- **Type Checking**: TypeScript Compiler, mypy

See [`docs/architecture/tech-stack.md`](docs/architecture/tech-stack.md) for complete details.

## API Documentation

When the backend is running, API documentation is available at:
- **Swagger UI**: http://localhost:8000/api/v1/docs
- **ReDoc**: http://localhost:8000/api/v1/redoc
- **OpenAPI JSON**: http://localhost:8000/api/v1/openapi.json

## Contributing

1. Create a feature branch from `main`
2. Follow the coding standards in `docs/architecture/14-coding-standards.md`
3. Write tests for new features
4. Ensure all tests pass: `bun run test`
5. Ensure code is formatted: `bun run format`
6. Submit a pull request

## License

[License TBD]

## Support

For issues and questions, please refer to:
- [Product Requirements Document](docs/prd/)
- [Architecture Documentation](docs/architecture/)
- [User Stories](docs/stories/)