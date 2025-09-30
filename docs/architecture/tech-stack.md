# Tech Stack

This is the **definitive technology selection** for the entire project. This table serves as the single source of truth - all development must use these exact versions.

## Technology Stack Table

| Category | Technology | Version | Purpose | Rationale |
|----------|-----------|---------|---------|-----------|
| Frontend Language | TypeScript | 5.6+ | Type-safe JavaScript for frontend | Strict mode enabled, catch errors at compile time, better DX with autocomplete |
| Frontend Framework | Next.js | 15.x | React framework with App Router | React Server Components, built-in optimization, Vercel deployment, App Router for file-based routing |
| React | React | 19.x | UI library | Required by Next.js 15, concurrent features, RSC support |
| UI Component Library | shadcn/ui | latest | Accessible component primitives | Radix UI base, full customization, copy-paste not npm install, integrates with Tailwind |
| CSS Framework | Tailwind CSS | 4.x | Utility-first styling | Consumes CSS design tokens, minimal bundle with tree-shaking, rapid prototyping |
| CSS Design Tokens | CSS Custom Properties | native | Foundation for theming | Dynamic context colors, consistent design system, no build tool needed |
| State Management (Server) | TanStack Query | 5.x | Server state caching | Automatic refetching, optimistic updates, request deduplication, cache invalidation |
| State Management (Local) | React Context | native | Minimal global UI state | Current context ID, theme state, lightweight for few use cases |
| Package Manager | Bun | 1.x | Fast package management & runtime | 10x faster than npm, native TypeScript, workspace support, single tool for install + run |
| Backend Language | Python | 3.12+ | Backend programming language | Type hints with mypy, async/await support, rich ecosystem for AI |
| Backend Framework | FastAPI | 0.115.x+ | Modern async Python framework | Auto OpenAPI docs, async/await native, Pydantic validation, high performance |
| API Style | REST (OpenAPI 3.1) | 3.1 | HTTP API standard | FastAPI auto-generates spec, easy frontend codegen, well-understood paradigm |
| Database | MongoDB | 7.x+ | NoSQL document database | Flexible schema for evolving models, free tier (512MB), JSON-like documents map to Pydantic |
| Database Driver | Motor | 3.x | Async MongoDB driver | Native async/await support, required for FastAPI async endpoints |
| Cache | None (MVP) | - | In-memory caching only | Defer to post-MVP; use TanStack Query client-side cache, Python functools.lru_cache |
| File Storage | None (MVP) | - | No file uploads in MVP | Future: Vercel Blob or S3 for user avatars |
| Authentication | Logto | Cloud SaaS | Identity provider | Managed service, OAuth 2.0, JWT tokens, Next.js + Python SDKs, free tier |
| AI Provider | OpenAI or Anthropic | GPT-4 / Claude 3.5 | Conversational AI & flow extraction | Streaming support, function calling for structured output, high quality responses |
| Frontend Testing | Vitest | latest | Unit test runner | Fast, Vite-native, compatible with Jest API, ESM support |
| Frontend Component Tests | React Testing Library | latest | Component testing | Accessibility-focused, user-centric queries, integrates with Vitest |
| Backend Testing | pytest | latest | Python test framework | Async support (pytest-asyncio), fixtures, parametrize, coverage (pytest-cov) |
| E2E Testing | Playwright | latest | End-to-end browser testing | Multi-browser, codegen, trace viewer, fast parallel execution |
| Type Checking (Frontend) | TypeScript Compiler | 5.6+ | Static type checking | Strict mode, catches type errors pre-runtime |
| Type Checking (Backend) | mypy | latest | Python static type checker | Strict mode, validates Pydantic models, enforces type hints |
| Linting (Frontend) | ESLint | latest | JavaScript/TypeScript linter | Next.js config, accessibility rules (jsx-a11y), catch common mistakes |
| Linting (Backend) | Ruff | latest | Fast Python linter | Replaces Flake8 + Black, 100x faster, auto-fix, includes formatter |
| Formatting (Frontend) | Prettier | latest | Code formatter | Consistent code style, integrates with ESLint, auto-format on save |
| Formatting (Backend) | Ruff | latest | Python formatter | Same tool as linter, consistent with Black style |
| Build Tool (Frontend) | Next.js CLI | 15.x | Build orchestrator | Built-in Turbopack, code splitting, image optimization, RSC bundling |
| Dependency Management (Backend) | Poetry or uv | latest | Python dependency resolver | Lock files, virtual env management, deterministic builds |
| IaC Tool | None (MVP) | - | Manual deployment | Defer to post-MVP; use Railway/Vercel CLIs and GitHub Actions for now |
| CI/CD | GitHub Actions | - | Continuous integration | Free for public repos, matrix builds, secrets management via 1Password |
| Secrets Management | 1Password CLI (`op`) | latest | Environment variable injection | No .env files in repo, `op run` for local dev, service accounts for CI |
| Monitoring (Frontend) | Vercel Analytics | built-in | Web vitals tracking | Free tier, Core Web Vitals, page load metrics |
| Monitoring (Backend) | Railway Logs | built-in | Application logging | Free tier, stdout/stderr capture, basic metrics |
| Error Tracking | None (MVP) | - | Error reporting | Defer to post-MVP; consider Sentry when budget allows |
| Logging (Backend) | Python logging | native | Structured logging | JSON logs to stdout, Railway captures automatically |
