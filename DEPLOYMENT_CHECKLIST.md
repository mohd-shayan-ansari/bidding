# Hosting Deployment Checklist

Quick reference checklist for hosting your IPL Bidding application.

## Quick Start (5 Steps)

### Step 1: MongoDB Atlas Setup (10 minutes)
- [ ] Create account at mongodb.com/cloud/atlas
- [ ] Create Free M0 cluster
- [ ] Create database user (save password!)
- [ ] Whitelist 0.0.0.0/0 in Network Access
- [ ] Copy connection string: `mongodb+srv://...`

### Step 2: Railway Backend Deployment (15 minutes)
- [ ] Create account at railway.app
- [ ] Connect GitHub repository
- [ ] Set root directory to `backend`
- [ ] Add environment variables:
  - `MONGODB_URI` = (from MongoDB Atlas)
  - `JWT_SECRET` = (long random string)
  - `FRONTEND_ORIGIN` = (will update later)
  - `PORT` = 4000
- [ ] Deploy
- [ ] Copy backend URL

### Step 3: Vercel Frontend Deployment (10 minutes)
- [ ] Create account at vercel.com
- [ ] Import your GitHub repository
- [ ] Add environment variable:
  - `VITE_API_BASE_URL` = (Railway backend URL)
- [ ] Deploy
- [ ] Copy frontend URL

### Step 4: Update Backend CORS (2 minutes)
- [ ] Go back to Railway backend settings
- [ ] Update `FRONTEND_ORIGIN` to Vercel URL
- [ ] Redeploy backend

### Step 5: Test Production (5 minutes)
- [ ] Open frontend URL
- [ ] Login as super admin
- [ ] Test creating match
- [ ] Test placing bid
- [ ] Check admin panel

---

## Detailed Platform Instructions

### MongoDB Atlas
```
Sign Up → Create Project → Create Cluster (M0) → 
Security (DB User + IP Whitelist) → Connect → 
Copy Connection String
```

**Connection String Format:**
```
mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

### Railway
```
Sign Up with GitHub → Select Repository → 
Configure (Root Dir: backend) → 
Environment Variables → Deploy
```

**Backend Environment Variables:**
```
MONGODB_URI=mongodb+srv://admin:pass@cluster.mongodb.net/sports-market
JWT_SECRET=your-secret-key-minimum-32-characters
FRONTEND_ORIGIN=https://your-frontend.vercel.app
PORT=4000
NODE_ENV=production
```

### Vercel
```
Sign Up with GitHub → Import Repository → 
Environment Variables → Deploy
```

**Frontend Environment Variables:**
```
VITE_API_BASE_URL=https://your-backend.railway.app
```

---

## Credentials (CHANGE THESE AFTER DEPLOYING!)

| Role | Email | Password | Action |
|------|-------|----------|--------|
| Super Admin | shayan@master.com | 87976757 | ⚠️ Change immediately |
| Admin | admin@sportsmarket.com | admin123 | ⚠️ Change immediately |
| User | user@sportsmarket.com | user123 | ⚠️ Keep for testing or remove |

---

## Links & Resources

| Service | Link | Notes |
|---------|------|-------|
| MongoDB Atlas | https://www.mongodb.com/cloud/atlas | Free M0 tier |
| Railway | https://railway.app | $5 monthly credit, then pay-as-you-go |
| Vercel | https://vercel.com | Free tier with unlimited projects |
| GitHub | https://github.com | Required for deployments |

---

## Cost Breakdown

| Service | Free Tier | Cost |
|---------|-----------|------|
| MongoDB Atlas | 5GB storage, unlimited databases | Free forever |
| Railway | $5 credit/month | $5/month after credit |
| Vercel | Unlimited deployments | Free for hobby projects |
| **Total Monthly** | **$0** | **~$5-10** |

---

## Common Issues & Solutions

### MongoDB Connection Failed
```
❌ "connect ENOTFOUND cluster.mongodb.net"
✅ Check IP whitelist in MongoDB Atlas (should be 0.0.0.0/0)
✅ Verify password doesn't have special characters (URL encode if needed)
✅ Wait for cluster to fully initialize (3-5 minutes)
```

### CORS Errors
```
❌ "Access to XMLHttpRequest blocked by CORS policy"
✅ Check FRONTEND_ORIGIN matches your Vercel URL exactly
✅ Redeploy backend after changing
✅ Wait for Railway deployment to complete
```

### Backend Timeout
```
❌ "Request timeout" or "502 Bad Gateway"
✅ Check MongoDB connection is working
✅ View Railway logs for errors
✅ Increase timeout in Railway settings
```

### Frontend Can't Connect to API
```
❌ "Cannot POST /api/auth/login"
✅ Verify VITE_API_BASE_URL is correct (no trailing slash)
✅ Test with curl: curl https://your-backend-url/api/health
✅ Check backend is actually deployed and running
```

---

## Post-Deployment Tasks

### Immediate (Do First!)
- [ ] Change super admin password
- [ ] Change admin password
- [ ] Remove or change demo user
- [ ] Update FRONTEND_ORIGIN and JWT_SECRET

### Short-term (First Week)
- [ ] Monitor logs for errors
- [ ] Test all features thoroughly
- [ ] Setup error tracking (Sentry)
- [ ] Backup MongoDB data

### Long-term (Ongoing)
- [ ] Regular database backups
- [ ] Monitor application performance
- [ ] Update dependencies monthly
- [ ] Review security logs
- [ ] Scale infrastructure if needed

---

## Performance Tips

1. **Enable Caching**
   - Frontend: Cache static assets in Vercel
   - Backend: Add Redis caching for frequently accessed data

2. **Database Optimization**
   - Create indexes for common queries
   - Monitor slow queries in MongoDB

3. **Monitoring**
   - Setup Vercel Analytics
   - Setup Railway error alerts
   - Monitor database performance

4. **Scaling**
   - Upgrade MongoDB to paid tier if needed
   - Upgrade Railway plan for more performance
   - Consider CDN for static assets

---

## Useful Commands

```bash
# Check backend is running
curl https://your-backend-url/api/health

# Test login
curl -X POST https://your-backend-url/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"shayan@master.com","password":"87976757"}'

# View Railway logs (from CLI)
railway logs

# Deploy frontend (if using Git)
git push origin main  # Auto-deploys on Vercel
```

---

## Support

- **Railway Docs:** https://docs.railway.app
- **Vercel Docs:** https://vercel.com/docs
- **MongoDB Docs:** https://docs.mongodb.com
- **Discord Communities:** 
  - Railway: https://discord.gg/railway
  - Vercel: https://discord.gg/vercel

---

**Need help? Check HOSTING_GUIDE.md for detailed step-by-step instructions.**

*Last Updated: March 2026*
