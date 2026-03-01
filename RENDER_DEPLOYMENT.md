# Deploy Backend to Render

Render.com is perfect for hosting Node.js backends. Follow these steps:

## Step 1: Create Render Account

1. Go to https://render.com
2. Click "Get Started"
3. Sign up with GitHub (recommended)
4. Authorize Render to access your GitHub repositories

## Step 2: Create Web Service on Render

1. Dashboard → **New +** → **Web Service**
2. Connect your GitHub repository (`kbshayan/ipl-bidding`)
3. Fill in the form:
   - **Name:** `ipl-bidding-backend`
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free tier (or Starter)

## Step 3: Set Environment Variables

In Render dashboard, go to your service → **Environment**

Add these variables:

| Key | Value | Notes |
|-----|-------|-------|
| `PORT` | `4000` | Required |
| `NODE_ENV` | `production` | Required |
| `MONGODB_URI` | Your Atlas URI | From MongoDB Atlas |
| `JWT_SECRET` | Long random string | At least 32 chars |
| `FRONTEND_ORIGIN` | Your Netlify URL | e.g., `https://your-site.netlify.app` |

Example `MONGODB_URI`:
```
mongodb+srv://username:password@cluster.mongodb.net/ipl_bidding?retryWrites=true&w=majority
```

## Step 4: Deploy

1. Click **Deploy**
2. Wait for build to complete (2-5 minutes)
3. Once "Live" status shows, your backend URL will be visible (e.g., `https://ipl-bidding-backend.onrender.com`)

## Step 5: Get Backend URL

After deployment:
1. Go to your Render service
2. Copy the URL from the top (looks like: `https://ipl-bidding-backend.onrender.com`)
3. Save this URL

## Step 6: Update Netlify Frontend

1. Go to Netlify dashboard
2. Your frontend site → **Build & deploy** → **Environment**
3. Add/Update variable:
   - Key: `VITE_API_BASE_URL`
   - Value: `https://ipl-bidding-backend.onrender.com` (your Render URL)
4. **Redeploy** site (Deploys → Trigger deploy)

## Step 7: Simplify Netlify Redirects

Your Netlify `netlify.toml` can now be simplified since API isn't being served locally.

Old redirects (for Netlify Functions) can be removed. You can replace netlify.toml with:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

This is much cleaner.

## Step 8: Test

1. Open your Netlify frontend URL
2. Test backend health: `https://ipl-bidding-backend.onrender.com/api/health`
   - Should return: `{ ok: true, time: "..." }`
3. Try login: `admin@sportsmarket.com` / `admin123`
4. Check admin panel

## Important Notes

- **Cold starts:** First request after inactivity takes 30-60 seconds (Render's free tier limitation)
- **Uptime:** Free tier goes to sleep after 15 min inactivity, wakes up on next request
- For 99.9% uptime, upgrade to Starter plan ($12/month)
- Database uploads in `/tmp` are **NOT persistent** on serverless (but Render web service supports persistent storage)

## After Deployment

1. ✅ Rotate MongoDB password (it was exposed earlier)
2. ✅ Change default admin password
3. ✅ Enable backups in MongoDB Atlas
4. ✅ Monitor Render logs for errors

## Troubleshooting

**Error: "Cannot POST /api/auth/login"**
- Check `VITE_API_BASE_URL` is set correctly in Netlify
- Verify backend URL is correct
- Test `https://backend-url/api/health` directly

**Error: "MongooseError: Cannot connect to MongoDB"**
- Check `MONGODB_URI` in Render environment
- Verify Atlas cluster is running
- Check IP whitelist includes Render (0.0.0.0/0)

**Slow requests / timeouts**
- Likely cold start on free tier (first request each day)
- Upgrade to Starter plan for instant response

## Cost

- **Netlify frontend:** Free
- **Render backend (free):** Free but with cold starts
- **Render backend (starter):** $12/month (recommended)
- **MongoDB Atlas:** Free (5GB)

**Total:** $0-12/month
