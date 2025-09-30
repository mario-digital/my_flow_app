# 16. Monitoring and Observability

## Monitoring Stack

**Frontend Monitoring:**

- **Vercel Analytics** - Built-in performance monitoring for Core Web Vitals, page views, and deployment analytics
- **Sentry** - Error tracking with source maps, breadcrumbs, and user context
- **Logging** - Console logs captured by Vercel (production) and browser DevTools (development)

**Backend Monitoring:**

- **Railway Metrics** - Built-in CPU, memory, and network usage monitoring
- **Sentry** - Error tracking with exception context, request details, and stack traces
- **Structured Logging** - JSON logs with request IDs, user IDs, and error context

**Error Tracking:**

- **Sentry (Unified)** - Single Sentry organization with separate projects for frontend and backend
- **Error Grouping** - Automatic grouping by error message, stack trace, and user context
- **Alerting** - Slack notifications for new error types and high error rates (>10 errors/minute)

**Performance Monitoring:**

- **Vercel Web Vitals** - LCP (Largest Contentful Paint), FID (First Input Delay), CLS (Cumulative Layout Shift)
- **Custom Frontend Metrics** - API response times, TanStack Query cache hits, optimistic update latency
- **Backend APM** - Request/response times per endpoint, database query durations, middleware execution time
- **Uptime Monitoring** - Better Uptime or UptimeRobot for health check endpoint monitoring (3-minute intervals)

## Key Metrics

**Frontend Metrics:**

| Metric                  | Target        | Alert Threshold | Collection Method          |
|-------------------------|---------------|-----------------|----------------------------|
| LCP (Largest Contentful Paint) | <2.5s  | >4s             | Vercel Analytics           |
| FID (First Input Delay) | <100ms        | >300ms          | Vercel Analytics           |
| CLS (Cumulative Layout Shift) | <0.1    | >0.25           | Vercel Analytics           |
| JavaScript Errors       | <0.1% sessions| >1% sessions    | Sentry                     |
| API Response Time (P95) | <500ms        | >1s             | Custom instrumentation     |
| Bundle Size (Initial)   | <100KB gzip   | >150KB gzip     | Vercel build logs          |
| Time to Interactive (TTI)| <3.5s        | >5s             | Lighthouse CI              |

**Backend Metrics:**

| Metric                  | Target        | Alert Threshold | Collection Method          |
|-------------------------|---------------|-----------------|----------------------------|
| Request Rate            | Monitor       | >1000 req/min   | Railway metrics            |
| Error Rate              | <1%           | >5%             | Sentry + structured logs   |
| Response Time (P50)     | <100ms        | >300ms          | Custom middleware logging  |
| Response Time (P95)     | <500ms        | >1s             | Custom middleware logging  |
| Response Time (P99)     | <1s           | >2s             | Custom middleware logging  |
| Database Query Time (P95)| <50ms        | >200ms          | Motor instrumentation      |
| CPU Usage               | <60%          | >80%            | Railway metrics            |
| Memory Usage            | <512MB        | >768MB (80% of 1GB) | Railway metrics        |
| Database Connections    | <20           | >40 (80% of 50 pool) | MongoDB Atlas metrics |

## Instrumentation

**Frontend Performance Tracking:**

```typescript
// src/lib/monitoring.ts
import * as Sentry from '@sentry/nextjs';

// Initialize Sentry
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  beforeSend(event) {
    // Don't send events in development
    if (process.env.NODE_ENV === 'development') return null;
    return event;
  },
});

// Custom API response time tracking
export function trackApiResponse(endpoint: string, duration: number, status: number) {
  Sentry.addBreadcrumb({
    category: 'api',
    message: `${endpoint} - ${status}`,
    level: status >= 400 ? 'error' : 'info',
    data: { duration, endpoint, status },
  });

  // Send to Vercel Analytics
  if (typeof window !== 'undefined' && window.va) {
    window.va('track', 'api_response', {
      endpoint,
      duration,
      status,
    });
  }
}

// Track user interactions
export function trackUserAction(action: string, metadata?: Record<string, any>) {
  Sentry.addBreadcrumb({
    category: 'user',
    message: action,
    level: 'info',
    data: metadata,
  });
}
```

**Backend Request Logging Middleware:**

```python
# src/middleware/request_logging.py
import time
import uuid
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
import logging

logger = logging.getLogger(__name__)

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Generate request ID
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id

        # Start timer
        start_time = time.time()

        # Process request
        try:
            response = await call_next(request)
            duration = (time.time() - start_time) * 1000  # ms

            # Log successful request
            logger.info(
                f"{request.method} {request.url.path} - {response.status_code}",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "status_code": response.status_code,
                    "duration_ms": round(duration, 2),
                    "user_id": getattr(request.state, "user_id", None),
                }
            )

            # Add request ID to response headers
            response.headers["X-Request-ID"] = request_id
            return response

        except Exception as exc:
            duration = (time.time() - start_time) * 1000

            # Log failed request
            logger.error(
                f"{request.method} {request.url.path} - ERROR",
                extra={
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "duration_ms": round(duration, 2),
                    "error": str(exc),
                },
                exc_info=True,
            )
            raise

# Register in main.py
app.add_middleware(RequestLoggingMiddleware)
```

**Database Query Instrumentation:**

```python
# src/repositories/base.py
import time
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class BaseRepository:
    async def _execute_query(self, operation: str, query_fn):
        """Wrapper for database queries with timing"""
        start_time = time.time()

        try:
            result = await query_fn()
            duration = (time.time() - start_time) * 1000

            # Log slow queries (>50ms)
            if duration > 50:
                logger.warning(
                    f"Slow query: {operation}",
                    extra={
                        "operation": operation,
                        "duration_ms": round(duration, 2),
                        "collection": self.collection.name,
                    }
                )

            return result

        except Exception as exc:
            duration = (time.time() - start_time) * 1000
            logger.error(
                f"Query failed: {operation}",
                extra={
                    "operation": operation,
                    "duration_ms": round(duration, 2),
                    "error": str(exc),
                },
                exc_info=True,
            )
            raise

    async def find_by_id(self, doc_id: str):
        return await self._execute_query(
            f"find_by_id({doc_id})",
            lambda: self.collection.find_one({"_id": ObjectId(doc_id)})
        )
```

## Health Check Endpoint

**Backend health check for uptime monitoring:**

```python
# src/routers/health.py
from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

router = APIRouter(tags=["Health"])

@router.get("/health")
async def health_check(db: AsyncIOMotorDatabase = Depends(get_database)):
    """Health check endpoint with database connectivity test"""
    try:
        # Test database connection
        await db.command("ping")

        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(
            status_code=503,
            detail="Service unavailable: database connection failed"
        )

@router.get("/health/ready")
async def readiness_check():
    """Readiness check (can accept traffic)"""
    return {"status": "ready"}

@router.get("/health/live")
async def liveness_check():
    """Liveness check (application is running)"""
    return {"status": "alive"}
```

## Alerting Configuration

**Sentry Alert Rules (via Sentry UI):**

1. **High Error Rate Alert**
   - Condition: Error count > 10 in 1 minute
   - Notification: Slack #alerts channel
   - Severity: Critical

2. **New Error Type Alert**
   - Condition: New error fingerprint appears
   - Notification: Slack #alerts channel
   - Severity: Warning

3. **Performance Degradation Alert**
   - Condition: P95 response time > 1s for 5 minutes
   - Notification: Slack #alerts channel
   - Severity: Warning

**Uptime Monitoring Alerts (Better Uptime):**

1. **Backend Health Check Failure**
   - Monitor: GET https://api.yourdomain.com/health (3-minute interval)
   - Condition: 3 consecutive failures OR status code 503
   - Notification: Email + Slack
   - Severity: Critical

2. **Frontend Availability**
   - Monitor: GET https://yourdomain.com (5-minute interval)
   - Condition: 2 consecutive failures OR status code 500
   - Notification: Email + Slack
   - Severity: Critical

## Dashboard Setup

**Railway Dashboard (Built-in):**

- **Metrics:** CPU, memory, network I/O, response times
- **Logs:** Real-time log streaming with search and filtering
- **Deployments:** Deployment history, rollback capability

**Vercel Dashboard (Built-in):**

- **Analytics:** Page views, Core Web Vitals, geographic distribution
- **Logs:** Edge function logs, build logs
- **Deployments:** Preview deployments, production deployments, instant rollback

**MongoDB Atlas Dashboard (Built-in):**

- **Metrics:** Query performance, connection count, storage usage
- **Slow Queries:** Queries taking >100ms with explain plans
- **Alerts:** Connection spikes, high CPU, replication lag

**Custom Observability Dashboard (Optional - Grafana):**

If deeper observability is needed, export logs from Railway and Vercel to Grafana:

- **Data Sources:** Loki (logs), Prometheus (metrics)
- **Panels:** Request rate, error rate, P50/P95/P99 latency, database query performance
- **Alerts:** Integrated with Slack via webhooks

## Design Rationale

1. **Platform-Native Monitoring:** Using Vercel Analytics and Railway Metrics reduces third-party costs and integration complexity. Built-in tools have zero setup overhead.

2. **Sentry for Both Frontend and Backend:** Unified error tracking platform provides consistent error grouping, alerting, and debugging experience. Single source of truth for all errors.

3. **Structured JSON Logging:** JSON logs are machine-parseable, enabling log aggregation, filtering, and alerting. `request_id` field enables tracing requests across frontend/backend.

4. **Health Check Endpoints:** Three endpoints (`/health`, `/health/ready`, `/health/live`) follow Kubernetes conventions, enabling orchestrators to detect unhealthy instances.

5. **Request ID Propagation:** Frontend generates request ID, sends in `X-Request-ID` header, backend logs it. Enables tracing a single user action across both services.

6. **Selective Performance Tracking:** Frontend tracks API response times for all requests; backend logs slow queries (>50ms). Avoids overwhelming logs with normal operations.

7. **Alert Thresholds Above Normal Operations:** Error rate alert (10 errors/minute) and response time alert (P95 > 1s) are set above expected values to avoid alert fatigue.

---
