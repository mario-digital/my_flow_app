# 11. Deployment Architecture

**Deployment Strategy:**

The application uses a **multi-platform deployment strategy** optimizing each service for its specific workload characteristics.

## Frontend Deployment

**Platform:** Vercel (Next.js optimized)

**Deployment Configuration:**

- **Build Command:** `bun run build`
- **Output Directory:** `.next/`
- **Framework Preset:** Next.js (auto-detected)
- **Node.js Version:** 20.x (via Bun runtime)
- **Edge Runtime:** Vercel Edge Functions (for Server Components)
- **CDN/Edge:** Automatic global CDN with 100+ edge locations

**Deployment Workflow:**

```bash
# Production deployment (automatic on main branch push)
git push origin main
# → Vercel detects push
# → Runs build in isolated environment
# → Deploys to production URL
# → Invalidates CDN cache

# Preview deployment (automatic on PR creation)
git push origin feature/new-feature
# → Creates unique preview URL
# → Comment added to PR with preview link
```

**Vercel Configuration (`vercel.json`):**

```json
{
  "buildCommand": "cd my_flow_client && bun install && bun run build",
  "devCommand": "cd my_flow_client && bun run dev",
  "installCommand": "bun install",
  "framework": "nextjs",
  "outputDirectory": "my_flow_client/.next",
  "env": {
    "NEXT_PUBLIC_API_URL": "https://api.yourdomain.com",
    "NEXT_PUBLIC_LOGTO_ENDPOINT": "@logto-endpoint",
    "NEXT_PUBLIC_LOGTO_APP_ID": "@logto-app-id"
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

**Frontend Performance Optimization:**

- **Server Components:** Default to SSR at edge for <100ms TTFB
- **Client Components:** Code-split with dynamic imports
- **Static Assets:** Automatic compression (Brotli, Gzip)
- **Image Optimization:** Next.js Image component with WebP/AVIF
- **Font Optimization:** Self-hosted fonts with `font-display: swap`
- **Cache Headers:** Immutable assets cached for 1 year, HTML for 0s (stale-while-revalidate)

## Backend Deployment

**Platform:** Railway (containerized deployment)

**Deployment Configuration:**

- **Build Method:** Dockerfile
- **Container Registry:** Railway internal registry
- **Runtime:** Python 3.12-slim
- **Auto-scaling:** Horizontal scaling based on CPU/memory
- **Health Check:** `GET /health` endpoint (200 OK)
- **Zero-Downtime:** Rolling deployment strategy

**Railway Configuration (`railway.toml`):**

```toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "my_flow_api/Dockerfile"

[deploy]
startCommand = "poetry run uvicorn src.main:app --host 0.0.0.0 --port $PORT"
healthcheckPath = "/health"
healthcheckTimeout = 30
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3

[env]
MONGODB_URL = "${{MONGODB_URL}}"
MONGODB_DB_NAME = "${{MONGODB_DB_NAME}}"
LOGTO_ENDPOINT = "${{LOGTO_ENDPOINT}}"
LOGTO_APP_ID = "${{LOGTO_APP_ID}}"
CORS_ORIGINS = "${{CORS_ORIGINS}}"
```

**Dockerfile (Production-Optimized):**

```dockerfile
FROM python:3.12-slim as builder

WORKDIR /app

# Install Poetry
RUN pip install poetry==1.8.0

# Copy dependency files
COPY pyproject.toml poetry.lock ./

# Install dependencies (no dev dependencies)
RUN poetry config virtualenvs.create false \
    && poetry install --no-dev --no-interaction --no-ansi

# Production stage
FROM python:3.12-slim

WORKDIR /app

# Copy installed dependencies from builder
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code
COPY src/ ./src/

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:8000/api/v1/health')"

# Expose port (Railway assigns $PORT dynamically)
EXPOSE 8000

# Run application
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
```

**Backend Performance Optimization:**

- **Async I/O:** Motor async MongoDB driver (non-blocking DB queries)
- **Connection Pooling:** MongoDB connection pool (min: 10, max: 100)
- **Response Compression:** Gzip middleware for responses >1KB
- **Database Indexes:** Automatically created on startup (see Backend Architecture)
- **Query Optimization:** Use projections to limit returned fields
- **Horizontal Scaling:** Run 2+ instances behind Railway load balancer

## Database Deployment

**Platform:** MongoDB Atlas (Managed Database)

**Configuration:**

- **Cluster Tier:** M10 (Production) / M0 (Free tier for staging)
- **Region:** US-East (Virginia) - closest to Railway + Vercel edge
- **Replication:** 3-node replica set (automatic failover)
- **Backup:** Daily snapshots with 7-day retention
- **Network:** IP whitelist + VPC peering (optional)

**Connection String:**

```bash
# Production
MONGODB_URL=mongodb+srv://myflow-prod:PASSWORD@prod-cluster.mongodb.net/?retryWrites=true&w=majority

# Staging
MONGODB_URL=mongodb+srv://myflow-staging:PASSWORD@staging-cluster.mongodb.net/?retryWrites=true&w=majority
```

**Atlas Configuration:**

- **Database Access:** Create dedicated user per environment (myflow-prod, myflow-staging)
- **Network Access:** Allow Railway IP ranges + developer IPs (for migrations)
- **Database Rules:** Enable schema validation (optional, Pydantic already validates)
- **Performance Advisor:** Enable query performance insights
- **Alerts:** Configure alerts for high connections, slow queries, low disk space

## CI/CD Pipeline

**GitHub Actions Workflow (`.github/workflows/deploy.yml`):**

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  frontend-deploy:
    name: Deploy Frontend to Vercel
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: cd my_flow_client && bun install

      - name: Build frontend
        run: cd my_flow_client && bun run build
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.PROD_API_URL }}
          NEXT_PUBLIC_LOGTO_ENDPOINT: ${{ secrets.LOGTO_ENDPOINT }}
          NEXT_PUBLIC_LOGTO_APP_ID: ${{ secrets.LOGTO_APP_ID }}

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: my_flow_client

  backend-deploy:
    name: Deploy Backend to Railway
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Railway CLI
        run: npm i -g @railway/cli

      - name: Deploy to Railway
        run: railway up --service backend
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

  smoke-tests:
    name: Run Smoke Tests
    needs: [frontend-deploy, backend-deploy]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Health check backend
        run: |
          curl --fail https://api.yourdomain.com/health || exit 1

      - name: Health check frontend
        run: |
          curl --fail https://yourdomain.com || exit 1

      - name: Test API endpoint
        run: |
          curl --fail https://api.yourdomain.com/api/v1/contexts \
            -H "Authorization: Bearer ${{ secrets.TEST_TOKEN }}" || exit 1
```

## Environments

| Environment | Frontend URL | Backend URL | Database | Purpose |
|------------|--------------|-------------|----------|---------|
| **Development** | `http://localhost:3000` | `http://localhost:8000` | Local MongoDB / Atlas Free | Local development and testing |
| **Staging** | `https://staging.yourdomain.com` | `https://api-staging.yourdomain.com` | MongoDB Atlas M0 (Free) | Pre-production testing, QA validation |
| **Production** | `https://yourdomain.com` | `https://api.yourdomain.com` | MongoDB Atlas M10 (Dedicated) | Live environment serving users |

**Environment Variable Management:**

```bash
# Development (local .env files)
my_flow_client/.env.local  # Frontend env vars
my_flow_api/.env           # Backend env vars

# Staging
# - Frontend: Vercel Environment Variables (Preview)
# - Backend: Railway Environment Variables (staging service)

# Production
# - Frontend: Vercel Environment Variables (Production)
# - Backend: Railway Environment Variables (production service)
# - Secrets: GitHub Secrets (for CI/CD)
```

## Rollback Strategy

**Frontend Rollback (Vercel):**

```bash
# Via Vercel dashboard
# 1. Go to Deployments tab
# 2. Find previous successful deployment
# 3. Click "Promote to Production"

# Via CLI
vercel rollback
```

**Backend Rollback (Railway):**

```bash
# Via Railway dashboard
# 1. Go to Deployments tab
# 2. Click "Redeploy" on previous deployment

# Via CLI (if git-based deployment)
git revert <commit-hash>
git push origin main
```

**Database Rollback:**

```bash
# MongoDB Atlas snapshots
# 1. Go to Atlas dashboard → Backup
# 2. Select snapshot (daily automatic backups)
# 3. Restore to cluster (creates new cluster)
# 4. Update MONGODB_URL in Railway to point to restored cluster

# For emergency: restore from mongodump backup
mongorestore --uri="mongodb+srv://..." --db myflow_prod ./backups/latest
```

## Monitoring and Alerting

**Frontend Monitoring (Vercel Analytics):**

- **Real User Monitoring (RUM):** Core Web Vitals (LCP, FID, CLS)
- **Error Tracking:** Automatic error capture with stack traces
- **Performance:** P50, P75, P99 response times per route
- **Alerts:** Notify Slack on error rate >5% or LCP >2.5s

**Backend Monitoring (Railway + External):**

- **Railway Metrics:** CPU, memory, request count, response time
- **Health Checks:** `/health` endpoint polled every 30s
- **Logging:** Structured JSON logs (see Backend Architecture)
- **Alerts:** Notify Slack on 5xx errors, high latency (>2s), or health check failure

**Database Monitoring (MongoDB Atlas):**

- **Atlas Monitoring:** Query performance, slow queries, connections, disk I/O
- **Performance Advisor:** Automatic index recommendations
- **Alerts:** Notify email/Slack on high connections (>80), slow queries (>1s), low disk (<10%)

**Recommended External Tools:**

- **Sentry:** Frontend + backend error tracking with source maps
- **Datadog / New Relic:** Application performance monitoring (APM)
- **Better Stack (formerly Logtail):** Centralized log aggregation

## Design Rationale

1. **Why Vercel for Frontend (not Netlify/Cloudflare Pages)?**
   - **Trade-off:** Vercel is more expensive vs alternatives, but provides best Next.js integration
   - **Decision:** Vercel built by Next.js creators; zero-config Server Components, Edge Runtime, ISR
   - **Assumption:** Performance gains and developer experience justify cost (~$20/month Pro plan)

2. **Why Railway for Backend (not Fly.io/Render/AWS ECS)?**
   - **Trade-off:** Railway is simpler but less flexible vs AWS ECS enterprise features
   - **Decision:** Railway provides Heroku-like simplicity with modern containerization
   - **Questionable:** Fly.io has better global distribution; consider if API latency critical in APAC/EU

3. **Why MongoDB Atlas (not self-hosted MongoDB)?**
   - **Trade-off:** Atlas costs ~$57/month (M10) vs self-hosted VPS ~$20/month
   - **Decision:** Atlas provides managed backups, monitoring, scaling, security patches
   - **Assumption:** Team lacks devops expertise; managed service reduces operational burden

4. **Why Separate CI Workflows per Service (not monolithic)?**
   - **Trade-off:** Separate workflows = more YAML vs single unified workflow
   - **Decision:** Independent deployments allow frontend/backend to deploy independently
   - **Assumption:** Services evolve at different rates; backend changes don't require frontend redeploy

5. **Why Git-Based Deployment (not manual Docker pushes)?**
   - **Trade-off:** Git-based requires CI/CD setup vs manual pushes are simpler initially
   - **Decision:** Git-based enables automatic preview deployments, rollbacks, audit trail
   - **Questionable:** Manual pushes acceptable for MVP, but tech debt grows quickly

6. **Why Multi-Stage Dockerfile (not single stage)?**
   - **Trade-off:** Multi-stage adds complexity vs single-stage simplicity
   - **Decision:** Multi-stage reduces final image size by ~60% (Poetry + build tools not in production)
   - **Assumption:** Smaller images = faster cold starts (~2s vs ~5s on Railway)

7. **Why Health Checks (not just process monitoring)?**
   - **Trade-off:** Health checks add overhead (~10ms per request) vs no checks
   - **Decision:** Health checks detect issues (DB connection loss, memory leaks) before user impact
   - **Assumption:** 10ms overhead negligible compared to preventing 5-minute outages

---
