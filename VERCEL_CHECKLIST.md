# Vercel Deployment Checklist ✓

## Pre-Deployment (Complete These)

- [ ] **Create GitHub Repository**
  - Push code to GitHub (if not already done)
  - ```bash
    git remote add origin https://github.com/your-username/studentdrive
    git push -u origin main
    ```

- [ ] **Database is Ready**
  - Neon PostgreSQL created: ✅
  - Schema pushed: `npm run db:push` ✅
  - All tables exist in database ✅

- [ ] **Environment Variables Prepared**
  - DATABASE_URL: `postgresql://neondb_owner:npg_sGtkezK2r6Xc@ep-ancient-dream-ah872g75-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
  - SESSION_SECRET: Generate a strong secret
  - NODE_ENV: `production`

- [ ] **Build Verified**
  - Production build tested: `npm run build` ✅
  - No errors in build output ✅
  - Frontend assets generated ✅

## Deployment Steps

### Step 1: Create Vercel Account & Project
1. Go to https://vercel.com
2. Sign up or log in
3. Click "Add New..." → "Project"
4. Import your GitHub repository
5. Select your StudentDrive repository

### Step 2: Configure Build Settings
- **Framework Preset**: Select "Node.js"
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Step 3: Add Environment Variables
In Vercel Dashboard → Your Project → Settings → Environment Variables

**For Production:**
```
DATABASE_URL = postgresql://neondb_owner:npg_sGtkezK2r6Xc@ep-ancient-dream-ah872g75-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

SESSION_SECRET = (generate a secure random string)

NODE_ENV = production
```

Click "Save" after each variable

### Step 4: Deploy
- Click "Deploy"
- Wait for build to complete (usually 2-3 minutes)
- Preview URL will be provided

### Step 5: Test the Deployment
- Click on your preview URL
- Verify landing page loads
- Check that database connection works
- Test login functionality

## Files Already Configured

✅ **vercel.json** - Routes configuration
✅ **DEPLOYMENT.md** - Detailed deployment guide  
✅ **vercel-env-template.txt** - Environment variable template
✅ **.vercelignore** - Files to exclude from deployment
✅ **package.json** - Build and start scripts
✅ **server/index.ts** - dotenv configured

## After Deployment

### Connect Custom Domain (Optional)
1. In Vercel → Settings → Domains
2. Add your custom domain
3. Configure DNS records

### Monitor Your App
- Vercel Dashboard shows logs and analytics
- Database monitoring at neon.tech/app

### Production Checklist
- [ ] Domain is working
- [ ] Database connection stable
- [ ] Error logging configured
- [ ] Backups enabled for database

## Quick Reference

**View Logs:**
```
vercel logs [project-name]
```

**Redeploy:**
- Push to GitHub → Auto-deploys
- Or click "Redeploy" in Vercel Dashboard

**Rollback:**
- Vercel → Deployments → Select previous → "Promote to Production"

## Support Resources
- Vercel Docs: https://vercel.com/docs
- Node.js Guide: https://vercel.com/docs/platforms/serverless-functions
- Neon Database: https://neon.tech/docs
- StudentDrive Deployment: See DEPLOYMENT.md
