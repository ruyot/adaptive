# Deployment Guide for Adaptive

This guide covers deploying Adaptive to production using Vercel for the frontend and various options for the backend.

## Architecture Overview

Adaptive consists of two separate applications:
- **Frontend**: Next.js application (deployed to Vercel)
- **Backend**: Express.js API server (needs separate hosting)

## Frontend Deployment (Vercel)

### Step 1: Prepare the Frontend

The frontend is already configured to use environment variables for the API URL.

**Local Configuration** (`.env.local`):
```bash
NEXT_PUBLIC_API_URL=http://localhost:3002
```

### Step 2: Deploy to Vercel

#### Option A: Using Vercel CLI

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Navigate to the client directory:
```bash
cd client
```

3. Deploy:
```bash
vercel
```

4. Follow the prompts:
   - Set up and deploy? **Yes**
   - Which scope? Select your account
   - Link to existing project? **No** (first time)
   - Project name? **adaptive** (or your choice)
   - Directory? **./  ** (current directory)
   - Override settings? **No**

#### Option B: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your Git repository
4. Configure build settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

### Step 3: Configure Environment Variables on Vercel

1. Go to your project dashboard on Vercel
2. Navigate to **Settings** > **Environment Variables**
3. Add the following variable:

| Name | Value | Environments |
|------|-------|--------------|
| `NEXT_PUBLIC_API_URL` | Your backend URL (see backend deployment) | Production, Preview, Development |

Example:
```
NEXT_PUBLIC_API_URL=https://adaptive-backend.railway.app
```

**Important**: The variable MUST start with `NEXT_PUBLIC_` to be accessible in the browser.

### Step 4: Redeploy

After adding environment variables, redeploy your application:
- Click **Deployments** > **Redeploy** (with cache cleared)

## Backend Deployment

The backend is an Express.js application that needs to be hosted on a Node.js server. Here are the recommended options:

### Option 1: Railway (Recommended)

Railway provides free hosting for Node.js applications with automatic deployments.

1. Go to [railway.app](https://railway.app)
2. Sign up and create a new project
3. Click **Deploy from GitHub repo**
4. Select your repository
5. Configure:
   - **Root Directory**: Leave empty (backend is in root)
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

6. Add environment variables:
   - `GITHUB_TOKEN`: Your GitHub personal access token
   - `GOOGLE_KEY`: Your Google Gemini API key
   - `GEMINI_MODEL`: `gemma-3-27b-it`
   - `PORT`: `3002` (or Railway will assign one)

7. Deploy and get your URL (e.g., `https://adaptive-backend.railway.app`)

8. Update Vercel environment variable `NEXT_PUBLIC_API_URL` with this URL

### Option 2: Render

1. Go to [render.com](https://render.com)
2. Create a new **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Name**: adaptive-backend
   - **Root Directory**: `.`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

5. Add environment variables (same as Railway)

### Option 3: Heroku

1. Install Heroku CLI
2. Create a new app:
```bash
heroku create adaptive-backend
```

3. Set environment variables:
```bash
heroku config:set GITHUB_TOKEN=your_token
heroku config:set GOOGLE_KEY=your_key
heroku config:set GEMINI_MODEL=gemma-3-27b-it
```

4. Deploy:
```bash
git push heroku main
```

### Option 4: Vercel Serverless Functions (Advanced)

You can convert the Express backend to Vercel serverless functions. This requires restructuring the backend code. Not recommended for beginners.

## CORS Configuration

The backend is already configured to accept requests from any origin:

```javascript
app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
```

For production, you may want to restrict this to your Vercel domain:

```javascript
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    // ... rest of config
}));
```

Then add `FRONTEND_URL=https://adaptive-rvw5.vercel.app` to your backend environment variables.

## Testing the Deployment

### 1. Test Backend Health

Visit your backend URL directly:
```
https://your-backend-url.com/healthtest
```

You should see:
```json
{
  "status": "healthy",
  "message": "Backend is running successfully",
  "timestamp": "..."
}
```

### 2. Test Frontend

1. Visit your Vercel URL: `https://adaptive-rvw5.vercel.app`
2. Enter a GitHub repository URL
3. Press Enter
4. Watch the loading animation
5. Interact with the 3D visualization

### 3. Check Browser Console

Open browser DevTools (F12) and check:
- No CORS errors
- API calls are going to your backend URL (not localhost)
- Files are loading correctly

## Environment Variables Summary

### Frontend (Vercel)
```bash
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

### Backend (Railway/Render/Heroku)
```bash
GITHUB_TOKEN=ghp_your_github_token
GOOGLE_KEY=your_google_gemini_key
GEMINI_MODEL=gemma-3-27b-it
GEMINI_MAX_CHARS=2000000000000
GEMINI_MAX_RETRIES=2
GEMINI_RETRY_DELAY_MS=500
PORT=3002
```

## Troubleshooting

### Frontend can't connect to backend

**Problem**: CORS errors or connection refused

**Solution**:
1. Verify `NEXT_PUBLIC_API_URL` is set correctly in Vercel
2. Ensure backend is running (check health endpoint)
3. Check CORS configuration in backend
4. Redeploy frontend with cache cleared

### Backend deployment fails

**Problem**: Build errors or crashes on startup

**Solution**:
1. Check all dependencies are in `package.json`
2. Verify environment variables are set
3. Check logs in your hosting provider dashboard
4. Ensure `npm start` script exists in `package.json`

### GitHub API returns 401

**Problem**: Authentication failed

**Solution**:
1. Verify `GITHUB_TOKEN` is set correctly
2. Check token has `repo` scope
3. Token must not have expired
4. Test token locally first

### Gemini API errors

**Problem**: AI analysis fails

**Solution**:
1. Verify `GOOGLE_KEY` is correct
2. Check API quota/billing status
3. Ensure model name is correct
4. Test with smaller files first

## Production Optimizations

### Backend Performance
- Implement caching for frequently accessed repos
- Add Redis for session storage
- Use connection pooling for GitHub API
- Implement rate limiting

### Frontend Performance
- Enable Next.js image optimization
- Use ISR (Incremental Static Regeneration) where applicable
- Optimize 3D assets and reduce polygon count
- Implement lazy loading for file trees

### Security
- Restrict CORS to specific domains
- Add API key authentication between frontend/backend
- Implement request validation
- Add rate limiting on both frontend and backend

## Monitoring

### Recommended Tools
- **Frontend**: Vercel Analytics (built-in)
- **Backend**: 
  - Railway Metrics
  - Render Metrics
  - External: Sentry, LogRocket
- **Performance**: Lighthouse CI

### Key Metrics to Monitor
- API response times
- GitHub API rate limits
- Gemini API usage and costs
- Error rates
- User sessions

## Scaling Considerations

As usage grows, consider:

1. **Caching Strategy**
   - Cache repository structures for 1 hour
   - Cache AI analysis results
   - Use CDN for static assets

2. **Background Jobs**
   - Process large repositories asynchronously
   - Queue system for AI analysis
   - Webhook updates for repository changes

3. **Database**
   - Store processed repositories
   - Cache analysis results
   - User favorites/history

## Support

For issues during deployment:
1. Check the logs in your hosting provider
2. Verify all environment variables are set
3. Test each component separately
4. Review the CORS configuration

## Current Deployment

Your current Vercel deployment: https://adaptive-rvw5.vercel.app

To complete the setup:
1. Deploy your backend to Railway/Render/Heroku
2. Get the backend URL
3. Add `NEXT_PUBLIC_API_URL` to Vercel with your backend URL
4. Redeploy on Vercel
5. Test the complete flow

