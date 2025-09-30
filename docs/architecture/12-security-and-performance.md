# 12. Security and Performance

## Security Requirements

**Frontend Security:**

**Content Security Policy (CSP):**

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires unsafe-eval/inline
      "style-src 'self' 'unsafe-inline'", // Tailwind requires unsafe-inline
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.yourdomain.com https://your-instance.logto.app",
      "frame-ancestors 'none'",
    ].join('; '),
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
];

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};
```

**XSS Prevention:**

- **React's Default Escaping:** All user input automatically escaped by React
- **DOMPurify for Rich Text:** Sanitize any HTML from external sources (if AI chat returns HTML)
- **No `dangerouslySetInnerHTML`:** Avoid unless absolutely necessary; use DOMPurify if required
- **Input Validation:** Validate all user input on both client and server

```typescript
// Example: Sanitizing AI-generated HTML
import DOMPurify from 'isomorphic-dompurify';

function AIMessage({ content }: { content: string }) {
  const sanitized = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['p', 'strong', 'em', 'code', 'pre'],
    ALLOWED_ATTR: [],
  });
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
}
```

**Secure Token Storage:**

- **Access Token:** Store in memory only (React state/context), never localStorage/cookies
- **Refresh Token:** HttpOnly, Secure, SameSite=Strict cookie (Logto handles this)
- **Session Timeout:** 30 minutes inactivity → re-authenticate

```typescript
// lib/auth/token-storage.ts
class TokenStorage {
  private static accessToken: string | null = null;

  static setToken(token: string) {
    this.accessToken = token; // Memory only
  }

  static getToken(): string | null {
    return this.accessToken;
  }

  static clearToken() {
    this.accessToken = null;
  }
}

// NEVER do this:
// localStorage.setItem('token', token); // ❌ Vulnerable to XSS
```

**HTTPS Enforcement:**

- Vercel automatically redirects HTTP → HTTPS
- `Strict-Transport-Security` header with 1-year max-age

**Backend Security:**

**Input Validation (Pydantic):**

```python
from pydantic import BaseModel, Field, validator

class FlowCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    priority: Priority = Priority.MEDIUM
    due_date: datetime | None = None

    @validator('title')
    def validate_title(cls, v):
        if not v or v.isspace():
            raise ValueError('Title cannot be empty or whitespace')
        # Strip HTML tags
        clean = re.sub(r'<[^>]+>', '', v)
        if len(clean) < 1:
            raise ValueError('Title must contain visible characters')
        return clean

    @validator('due_date')
    def validate_due_date(cls, v):
        if v and v < datetime.utcnow():
            raise ValueError('Due date cannot be in the past')
        return v
```

**Rate Limiting:**

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Apply rate limits per endpoint
@router.post("/contexts")
@limiter.limit("10/minute")  # 10 creates per minute per IP
async def create_context(
    request: Request,
    data: ContextCreate,
    user_id: str = Depends(get_current_user)
):
    # ... implementation
    pass

@router.get("/contexts")
@limiter.limit("100/minute")  # 100 reads per minute per IP
async def list_contexts(
    request: Request,
    user_id: str = Depends(get_current_user)
):
    # ... implementation
    pass
```

**CORS Policy:**

```python
# main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Development
        "https://yourdomain.com",  # Production
        "https://staging.yourdomain.com",  # Staging
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["Authorization", "Content-Type"],
    max_age=3600,  # Cache preflight for 1 hour
)
```

**SQL/NoSQL Injection Prevention:**

- **MongoDB:** Use parameterized queries via Motor (automatic)
- **Never use string concatenation** for queries

```python
# ✅ Safe (parameterized)
await collection.find_one({"user_id": user_id, "title": title})

# ❌ NEVER do this (vulnerable to injection)
query = f"{{user_id: '{user_id}', title: '{title}'}}"  # DON'T
```

**Authentication Security:**

**JWT Token Validation:**

- **Algorithm Whitelist:** Only RS256 (RSA signatures)
- **Issuer Validation:** Must match Logto endpoint
- **Audience Validation:** Must match Logto app ID
- **Expiration Check:** Reject expired tokens
- **JWKS Caching:** Cache public keys for 24 hours

```python
# middleware/auth.py (already defined in Backend Architecture)
from jose import jwt, JWTError
from functools import lru_cache

@lru_cache(maxsize=1)
def get_logto_jwks() -> dict:
    """Cache JWKS for 24 hours (until process restart)"""
    response = httpx.get(f"{settings.LOGTO_ENDPOINT}/oidc/jwks")
    return response.json()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    try:
        payload = jwt.decode(
            credentials.credentials,
            key=get_logto_jwks(),
            algorithms=["RS256"],  # Only RSA
            audience=settings.LOGTO_APP_ID,
            issuer=f"{settings.LOGTO_ENDPOINT}/oidc"
        )
        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")
```

**Session Management:**

- **Stateless Sessions:** JWT tokens contain all necessary info (user_id)
- **Token Expiration:** 30 minutes (configurable in Logto)
- **Refresh Token Rotation:** Logto automatically rotates refresh tokens
- **Logout:** Frontend clears token from memory; backend doesn't need to track

**Password Policy:**

- **Delegated to Logto:** Logto enforces password requirements (min 8 chars, complexity rules)
- **No password storage:** Passwords never touch our backend

## Performance Optimization

**Frontend Performance:**

**Bundle Size Target:**

- **Initial Bundle:** <100KB gzipped (Core Web Vitals threshold)
- **Route Bundles:** <50KB gzipped per page
- **Total JS (FCP):** <200KB gzipped

**Bundle Analysis:**

```bash
# Analyze bundle size
cd my_flow_client
bun run build
npx @next/bundle-analyzer
```

**Code Splitting Strategy:**

```typescript
// Dynamic imports for heavy components
const AIChat = dynamic(() => import('@/components/ai-chat'), {
  loading: () => <Skeleton className="h-96" />,
  ssr: false, // Client-only component
});

// Lazy load heavy libraries
const { default: DOMPurify } = await import('isomorphic-dompurify');
```

**Loading Strategy:**

- **Server Components First:** Render as much as possible on server
- **Streaming SSR:** Use `loading.tsx` for progressive loading
- **Prefetching:** `<Link>` automatically prefetches on hover (intersection observer)
- **Priority Hints:** `<Image priority />` for LCP images

```typescript
// app/contexts/[id]/loading.tsx
export default function Loading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-64" /> {/* Page title */}
      <Skeleton className="h-64 w-full" /> {/* Flow list */}
    </div>
  );
}
```

**Caching Strategy:**

- **Static Assets:** Immutable caching (1 year) with hash-based filenames
- **API Responses:** Cache with `staleTime` in TanStack Query (see Frontend Architecture)
- **CDN Caching:** Vercel Edge caches Server Component renders
- **Service Worker:** Optional for offline support (PWA)

```typescript
// TanStack Query cache config
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  },
});
```

**Image Optimization:**

```typescript
// Use Next.js Image component
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="My Flow Logo"
  width={200}
  height={50}
  priority // For LCP images
  quality={85} // Balance quality/size
/>

// Automatic formats: WebP/AVIF
// Automatic responsive sizing
// Lazy loading by default
```

**Backend Performance:**

**Response Time Target:**

- **P50 (median):** <100ms
- **P95:** <500ms
- **P99:** <1s
- **Database queries:** <50ms

**Database Optimization:**

**Indexes (already defined in Backend Architecture):**

```python
# database.py:create_indexes()
await db.contexts.create_index("user_id")
await db.contexts.create_index([("user_id", 1), ("name", 1)])
await db.flows.create_index([("context_id", 1), ("is_completed", 1), ("priority", 1)])
await db.flows.create_index([("user_id", 1), ("due_date", 1)])
await db.user_preferences.create_index("user_id", unique=True)
```

**Query Projections (reduce payload size):**

```python
# Only fetch needed fields
async def list_flows_summary(self, context_id: str) -> list[FlowSummary]:
    cursor = self.collection.find(
        {"context_id": context_id},
        projection={"title": 1, "is_completed": 1, "priority": 1, "due_date": 1}
        # Exclude large fields like description, steps, etc.
    )
    docs = await cursor.to_list(length=100)
    return [FlowSummary(**doc) for doc in docs]
```

**Connection Pooling:**

```python
# database.py
from motor.motor_asyncio import AsyncIOMotorClient

client = AsyncIOMotorClient(
    settings.MONGODB_URL,
    maxPoolSize=100,  # Max concurrent connections
    minPoolSize=10,   # Keep 10 connections warm
    maxIdleTimeMS=30000,  # Close idle connections after 30s
)
```

**Response Compression:**

```python
# main.py
from fastapi.middleware.gzip import GZipMiddleware

app.add_middleware(GZipMiddleware, minimum_size=1000)  # Compress responses >1KB
```

**Caching Strategy:**

**No caching layer initially** (Redis, Memcached) - reasons:

1. **MongoDB is fast enough:** With proper indexes, queries <50ms
2. **Complexity vs benefit:** Caching adds cache invalidation complexity
3. **Premature optimization:** Add caching only if profiling shows bottlenecks

**Future caching (if needed):**

```python
# Example: Redis caching for hot paths
from redis.asyncio import Redis
from functools import wraps

redis = Redis(host='localhost', port=6379, decode_responses=True)

def cache_result(ttl: int = 60):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            cache_key = f"{func.__name__}:{args}:{kwargs}"
            cached = await redis.get(cache_key)
            if cached:
                return json.loads(cached)
            result = await func(*args, **kwargs)
            await redis.setex(cache_key, ttl, json.dumps(result))
            return result
        return wrapper
    return decorator

@cache_result(ttl=300)  # Cache for 5 minutes
async def get_user_contexts(user_id: str):
    # ... implementation
    pass
```

**Async I/O (already implemented):**

- **Motor async driver:** Non-blocking MongoDB queries
- **HTTPX async client:** Non-blocking external API calls (Logto JWKS)
- **Uvicorn ASGI server:** Handles concurrent requests efficiently

**Horizontal Scaling:**

```python
# Run multiple workers (Railway auto-scaling)
# Dockerfile CMD:
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]

# Each worker handles ~500 concurrent connections
# 2 workers = ~1000 concurrent connections
```

## Design Rationale

1. **Why No Redis Cache Initially?**
   - **Trade-off:** Redis adds complexity (cache invalidation, another service to manage) vs performance gains
   - **Decision:** MongoDB with indexes is fast enough (<50ms queries); add Redis only if profiling shows bottlenecks
   - **Assumption:** Application will have <10k users initially; cache not critical at this scale

2. **Why In-Memory Token Storage (not localStorage)?**
   - **Trade-off:** In-memory = re-auth on page refresh vs localStorage = XSS vulnerability
   - **Decision:** Security > convenience; XSS attacks can steal localStorage tokens
   - **Assumption:** Users can tolerate 30-second re-auth on page refresh

3. **Why Pydantic Validation (not FastAPI's built-in)?**
   - **Trade-off:** Pydantic provides more control vs FastAPI's automatic validation
   - **Decision:** Custom validators needed for business logic (due date in past, HTML stripping)
   - **Assumption:** Pydantic's flexibility justifies slightly more verbose code

4. **Why Rate Limiting by IP (not by user_id)?**
   - **Trade-off:** IP-based = shared limits for NAT'd users vs user-based = more fair
   - **Decision:** IP-based simpler to implement; prevents brute-force attacks before auth
   - **Questionable:** Consider user-based rate limiting for authenticated endpoints

5. **Why Server Components for Performance (not Client Components)?**
   - **Trade-off:** Server Components reduce JS bundle but increase server load
   - **Decision:** JS bundle size is limiting factor for mobile users (<100KB target)
   - **Assumption:** Server capacity cheaper than sacrificing mobile performance

6. **Why Aggressive Bundle Size Targets (<100KB)?**
   - **Trade-off:** Smaller bundles = more code splitting complexity vs larger bundles = simpler
   - **Decision:** Mobile users on slow 3G are primary audience; <100KB = <3s load on 3G
   - **Assumption:** User retention correlates strongly with load time (<3s = 2x retention)

7. **Why No Service Worker/PWA Initially?**
   - **Trade-off:** PWA enables offline support vs adds complexity
   - **Decision:** Application requires backend for all operations; offline support has limited value
   - **Questionable:** Consider PWA for caching static assets (faster load on repeat visits)

---
