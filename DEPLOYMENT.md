# StudentDrive - Vercel Deployment Guide

## Prerequisites
- Vercel account (https://vercel.com)
- GitHub repository with your StudentDrive code
- Neon PostgreSQL database connection string

## Deployment Steps

### 1. Connect to Vercel
```bash
# Login to Vercel CLI
npm i -g vercel
vercel login

# Deploy from project directory
vercel
```

### 2. Configure Environment Variables in Vercel

Add these in your Vercel project settings (Settings → Environment Variables):

**Production:**
```
DATABASE_URL=postgresql://neondb_owner:npg_sGtkezK2r6Xc@ep-ancient-dream-ah872g75-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
SESSION_SECRET=your-secure-session-secret-here
NODE_ENV=production
```

**Preview/Development:**
```
DATABASE_URL=postgresql://neondb_owner:npg_sGtkezK2r6Xc@ep-ancient-dream-ah872g75-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
SESSION_SECRET=dev-session-secret
NODE_ENV=development
```

### 3. Database Setup

**Important:** Run this before your first deployment to ensure all tables exist:

```bash
npm run db:push
```

This syncs your Drizzle schema with Neon PostgreSQL.

### 4. Deploy

The project is configured to auto-deploy when you push to GitHub:

1. Push your code to GitHub:
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. Vercel automatically detects changes and redeploys

## Project Configuration

### vercel.json
- Routes all API requests to Express backend
- Routes all other requests through Express for SSR/static files
- Configured to run `npm run build` during deployment
- Uses Node.js runtime

### Build Process
1. **Frontend**: Vite builds React app to `dist/` folder
2. **Backend**: Express serves the built frontend and API routes
3. **Runtime**: Node.js handles all requests

## Troubleshooting

### Database Connection Issues
- Verify DATABASE_URL is correct in Vercel settings
- Check Neon database status and firewall rules
- Ensure database schema is pushed: `npm run db:push`

### Build Failures
- Check build logs in Vercel dashboard
- Ensure all dependencies are listed in package.json
- Verify TypeScript compilation: `npm run build`

### Environment Variables Not Loading
- Check they're set in Vercel Settings → Environment Variables
- Ensure they're available for your deployment environment
- Restart deployment after updating variables

## Performance Tips
- Vercel automatically optimizes Node.js functions
- Static assets (CSS, JS images) are served from Vercel's CDN
- Database connection pooling is handled by Neon

## Support
For Vercel-specific issues: https://vercel.com/docs
For database issues: https://neon.tech/docs
