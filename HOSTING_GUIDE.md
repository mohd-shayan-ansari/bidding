# IPL Bidding Platform - Hosting Guide

Complete step-by-step instructions for deploying your application to production.

## Overview

This is a full-stack MERN application requiring:
- **Frontend**: React + Vite (hosted on Vercel/Netlify)
- **Backend**: Node.js + Express + MongoDB (hosted on Railway/Render/Fly.io)
- **Database**: MongoDB Atlas (cloud database)

## Step 1: Setup MongoDB Atlas (Database)

### 1. Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Click "Sign Up Free"
3. Create account with email/password or use Google/GitHub

### 2. Create a Project & Cluster
1. Click "Create Project"
2. Name it "IPL-Bidding" (or your preference)
3. Click "Create Project"
4. Click "Create Deployment"
5. Choose "M0 Free" tier (free forever)
6. Select cloud provider (AWS, Google Cloud, or Azure - any region)
7. Click "Create Deployment"
8. Wait 3-5 minutes for cluster to be created

### 3. Create Database User
1. In the Atlas dashboard, go to "Security" → "Database Access"
2. Click "Create Database User"
3. Set username: `admin` (or your choice)
4. Set password: (auto-generate or create strong one - SAVE THIS!)
5. Set privileges to "Atlas Admin"
6. Click "Create User"

### 4. Allow Network Access
1. Go to "Security" → "Network Access"
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (0.0.0.0/0)
4. Click "Confirm"

### 5. Get Connection String
1. Go to "Databases" and click "Connect"
2. Choose "Drivers"
3. Select "Node.js" and version "5.x"
4. Copy the connection string (looks like):
   ```
   mongodb+srv://admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   ```
5. Replace `<password>` with your actual database password

---

## Step 2: Deploy Backend (Railway.app)

### 1. Create Railway Account
1. Go to [Railway.app](https://railway.app)
2. Sign up with GitHub account (recommended)
3. Create new project

### 2. Connect GitHub Repository
1. Click "New" → "GitHub Repo"
2. Select your repository (misbahclient)
3. Authorize Railway to access GitHub

### 3. Configure Environment Variables
1. In Railway dashboard, click on your project
2. Go to "Variables"
3. Add these variables:
   ```
   MONGODB_URI=mongodb+srv://admin:PASSWORD@cluster0.xxxxx.mongodb.net/sports-market?retryWrites=true&w=majority&appName=Cluster0
   JWT_SECRET=your-super-secret-jwt-key-change-this-12345
   FRONTEND_ORIGIN=https://your-frontend-domain.com
   PORT=4000
   ```
4. Replace values with your actual credentials

### 4. Configure Service Settings
1. Click on the service
2. In "Settings":
   - Root Directory: `backend`
   - Start Command: `npm start`
   - Healthcheck: `/api/health`

### 5. Deploy
1. Railway automatically deploys on every push to main branch
2. Wait for deployment to complete
3. Copy the deployed URL (e.g., `https://sports-market-api.railway.app`)
4. This is your `BACKEND_URL`

---

## Step 3: Deploy Frontend (Vercel)

### 1. Create Vercel Account
1. Go to [Vercel.com](https://vercel.com)
2. Sign up with GitHub (recommended)
3. Import your repository

### 2. Select Repository & Configure
1. Find your `misbahclient` repository
2. Click "Import"
3. Vercel auto-detects it's a Vite project

### 3. Set Environment Variables
1. Go to "Environment Variables"
2. Add:
   ```
   VITE_API_BASE_URL=https://your-backend-url.railway.app
   ```
3. Replace with your actual Railway backend URL

### 4. Deploy
1. Click "Deploy"
2. Wait for deployment (usually 1-2 minutes)
3. You'll get a URL like: `https://misbahclient.vercel.app`
4. This is your frontend URL

### 5. Update Backend CORS
1. Go back to Railway backend settings
2. Update `FRONTEND_ORIGIN` to your Vercel URL
3. Deploy the backend again

---

## Step 4: Verify Deployment

1. Open your frontend URL in browser
2. Try to login with super admin:
   - Email: `shayan@master.com`
   - Password: `87976757`
3. Check if you can access admin panel
4. Test all features (create match, place bid, etc.)

---

## Environment Variables Reference

### Backend (.env)
```
MONGODB_URI=mongodb+srv://admin:password@cluster.mongodb.net/sports-market
JWT_SECRET=your-secret-key-here
FRONTEND_ORIGIN=https://your-frontend.vercel.app
PORT=4000
NODE_ENV=production
```

### Frontend (.env)
```
VITE_API_BASE_URL=https://your-backend.railway.app
```

---

## Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | shayan@master.com | 87976757 |
| Admin | admin@sportsmarket.com | admin123 |
| User | user@sportsmarket.com | user123 |

⚠️ **Change these in production!**

---

## Troubleshooting

### Backend not connecting to database
- Verify MONGODB_URI is correct
- Check IP whitelist in MongoDB Atlas (should be 0.0.0.0/0)
- Ensure database user password is correct

### CORS errors
- Update FRONTEND_ORIGIN in backend to match your frontend URL
- Redeploy backend after changing

### Frontend can't connect to backend
- Verify VITE_API_BASE_URL is correct
- Check backend is deployed and running
- Test with `curl https://your-backend-url/api/health`

### Cold start delays
- Railway/Render may sleep free tier services
- Consider upgrading to paid plan for always-on service

---

## Optional: Custom Domain

### Add Domain to Vercel
1. In Vercel project settings
2. Go to "Domains"
3. Add your domain name
4. Follow DNS setup instructions

### Add Domain to Railway
1. In Railway service settings
2. Go to "Custom Domains"
3. Add your domain
4. Update DNS records

---

## Monitoring & Logs

### Railway Logs
1. Open Railway dashboard
2. Click on service
3. Go to "Logs" to view real-time logs

### Vercel Logs
1. Open Vercel dashboard
2. Click on project
3. Go to "Deployments"
4. Click on deployment to view logs

---

## Production Checklist

- [ ] MongoDB Atlas cluster created and configured
- [ ] Backend deployed on Railway
- [ ] Frontend deployed on Vercel
- [ ] Environment variables configured correctly
- [ ] CORS properly configured
- [ ] All features tested in production
- [ ] Changed default credentials
- [ ] Monitoring/logs checked
- [ ] SSL/HTTPS working (automatic on both platforms)
- [ ] Database backups enabled (MongoDB Atlas auto-backups on free tier)

---

## Next Steps (After Initial Deployment)

1. **Change Super Admin Credentials**
   - Log in with current credentials
   - Add new super admin user
   - Delete old credentials

2. **Enable MongoDB Backups**
   - Go to MongoDB Atlas → Backup
   - Enable automatic backups

3. **Setup Error Monitoring** (Optional)
   - Consider using Sentry for error tracking
   - Setup application performance monitoring

4. **Optimize Performance**
   - Enable caching in frontend
   - Setup CDN for static assets
   - Monitor database query performance

---

## Support & Documentation

- [Railway Docs](https://docs.railway.app)
- [Vercel Docs](https://vercel.com/docs)
- [MongoDB Atlas Docs](https://docs.mongodb.com/atlas)
- [Express.js Guide](https://expressjs.com)
- [React Vite Guide](https://vitejs.dev)

---

**Deployment completed? Congratulations! Your app is now live! 🚀**
