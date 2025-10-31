# 🚀 Deployment Setup Guide

## Required GitHub Secrets

Add these secrets to your GitHub repository settings:

### Backend (Render)
```
RENDER_DEPLOY_HOOK_URL=https://api.render.com/deploy/srv-xxxxx?key=yyyyy
```

### Frontend (Netlify)
```
NETLIFY_AUTH_TOKEN=your-netlify-auth-token
NETLIFY_SITE_ID=your-netlify-site-id
```

### Environment Variables
```
VITE_API_URL=https://your-backend-url.onrender.com
```

## Render Setup

1. **Create Web Service** on Render
2. **Connect GitHub repo** 
3. **Set Environment Variables**:
   ```
   DATABASE_URL=your-supabase-connection-string
   JWT_SECRET=your-jwt-secret
   MISTRAL_API_KEY=your-mistral-key
   GEMINI_API_KEY=your-gemini-key
   GOOGLE_API_KEY=your-google-key
   ENVIRONMENT=production
   ```
4. **Get Deploy Hook URL** from Render dashboard
5. **Add to GitHub Secrets** as `RENDER_DEPLOY_HOOK_URL`

## Netlify Setup

1. **Create Site** on Netlify
2. **Get Site ID** from site settings
3. **Generate Personal Access Token**
4. **Add both to GitHub Secrets**

## Supabase Integration

Your backend is already configured for Supabase PostgreSQL. Just ensure:
- `DATABASE_URL` points to your Supabase instance
- Connection pooling is enabled in Supabase
- SSL mode is properly configured

## Workflow Features

✅ **Smart Triggers**: Only builds what changed
✅ **PostgreSQL Testing**: Uses real PostgreSQL for CI
✅ **Unified Deployment**: Both frontend/backend deploy on any change
✅ **Proper Error Handling**: Continues on non-critical failures
✅ **Security Scanning**: Automated vulnerability checks
