# Docker Deployment Guide

## Production Architecture

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────┐
│   Vercel    │         │     Railway      │         │  Upstash    │
│  (Frontend) │────────>│    (Backend)     │────────>│  (Redis)    │
└─────────────┘         └──────────────────┘         └─────────────┘
       │                         │                          │
       │                         └──────────────────────────┘
       │                         MongoDB Atlas (Database)
       └─────────────────────────────────────────────────────>
```

## Railway Backend Deployment

1. **Create new project in Railway**
2. **Connect GitHub repository**
3. **Configure environment variables** (from 1Password):
   - MONGODB_URI
   - REDIS_URL (from Upstash)
   - LOGTO_ENDPOINT
   - LOGTO_APP_ID
   - LOGTO_APP_SECRET
4. **Railway auto-detects Dockerfile and deploys**
5. **Health check**: `https://your-app.railway.app/health`

## Vercel Frontend Deployment

1. **Import GitHub repository to Vercel**
2. **Configure environment variables**:
   - NEXT_PUBLIC_API_URL (Railway backend URL)
   - NEXT_PUBLIC_LOGTO_ENDPOINT
   - NEXT_PUBLIC_LOGTO_APP_ID
   - LOGTO_APP_SECRET
   - LOGTO_COOKIE_SECRET
   - NEXT_PUBLIC_BASE_URL
   - NEXT_PUBLIC_LOGTO_RESOURCE
3. **Vercel auto-detects Next.js and deploys**
4. **Configure custom domain** (optional)

## Upstash Redis Setup

1. **Create free Upstash account**: https://upstash.com
2. **Create new Redis database** (free tier)
3. **Copy REST URL** to `REDIS_URL` environment variable
4. **Use in Railway backend deployment**

## MongoDB Atlas Configuration

1. **Whitelist Railway IP addresses** (or use 0.0.0.0/0)
2. **Enable backups** (automatic in free tier)
3. **Monitor database size** (stay within 512MB free tier)

## Rollback Strategy

- **Railway**: Redeploy previous version via Railway dashboard
- **Vercel**: Revert deployment via Vercel dashboard
- **Database**: Use Atlas automatic backups (restore to specific time)

## Monitoring

- **Railway**: Built-in logs and metrics dashboard
- **Vercel**: Analytics and deployment logs
- **Health checks**: Monitor `/health` endpoints
- **Uptime monitoring**: Use UptimeRobot or similar (free tier)
