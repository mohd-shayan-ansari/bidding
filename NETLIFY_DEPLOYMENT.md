# Netlify Deployment Guide

Deploy your IPL Bidding app on Netlify for free. This guide covers both frontend and backend deployment.

## Architecture

```
Frontend (React + Vite) → Netlify
Backend (Node.js + Express) → Netlify Functions (Serverless)
Database → MongoDB Atlas
```

---

## Part 1: MongoDB Atlas Setup

### Step 1: Create MongoDB Account
1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Click "Try Free"
3. Sign up with email/password or GitHub

### Step 2: Create Cluster
1. Click "Create a Deployment"
2. Select **Free M0** tier
3. Choose your region (closest to your users)
4. Click "Create Cluster"
5. Wait 2-3 minutes for cluster to initialize

### Step 3: Create Database User
1. Go to "Database Access" in left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Username: `admin`
5. Password: Generate a strong password (save it!)
6. Click "Add User"

### Step 4: Allow Network Access
1. Go to "Network Access" in left sidebar
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (0.0.0.0/0)
4. Click "Confirm"

### Step 5: Get Connection String
1. Go back to "Databases"
2. Click "Connect" on your cluster
3. Choose "Drivers"
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Replace `myFirstDatabase` with `sports-market`

Example:
```
mongodb+srv://admin:YOUR_PASSWORD@cluster0.abc123.mongodb.net/sports-market?retryWrites=true&w=majority
```

---

## Part 2: Deploy Backend (Netlify Functions)

### Step 1: Restructure Backend for Netlify Functions

Create a `netlify/functions/` directory:

```bash
mkdir -p netlify/functions
```

### Step 2: Create Serverless Handler

Create `netlify/functions/api.js`:

```javascript
// netlify/functions/api.js
import serverless from 'serverless-http';
import app from '../../backend/src/app.js';

// Set MongoDB URI from environment
process.env.MONGODB_URI = process.env.MONGODB_URI;
process.env.JWT_SECRET = process.env.JWT_SECRET;

export const handler = serverless(app);
```

### Step 3: Update Backend Configuration

Modify `backend/src/app.js` to handle Netlify:

```javascript
// Add this near the top of app.js
if (process.env.NETLIFY) {
  console.log('Running on Netlify Functions');
}

// Change the listen code at the end (or keep it for local dev)
// Netlify will call the exported handler function
```

### Step 4: Update package.json

In root `package.json`:

```json
{
  "name": "ipl-bidding",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "build": "npm run build --prefix backend && npm run build --prefix frontend",
    "start": "npm start --prefix backend"
  },
  "devDependencies": {
    "serverless-http": "^3.2.0"
  }
}
```

### Step 5: Install Dependencies

```bash
npm install serverless-http
```

### Step 6: Deploy to Netlify

1. Push code to GitHub
2. Go to [app.netlify.com](https://app.netlify.com)
3. Click "Add new site" → "Import an existing project"
4. Select your GitHub repository
5. Configure build:
   - **Base directory:** (leave empty)
   - **Build command:** `npm run build`
   - **Publish directory:** `frontend/dist`

6. Set environment variables in "Site settings" → "Build & deploy" → "Environment":
   - `MONGODB_URI` = Your MongoDB connection string
   - `JWT_SECRET` = Long random string (32+ characters)
   - `NETLIFY` = true

7. Click "Deploy"

---

## Part 3: Deploy Frontend (Netlify)

**NOTE:** If you followed Part 2, the frontend is already deployed with your backend!

To deploy only the frontend:

1. Go to [app.netlify.com](https://app.netlify.com)
2. Click "Add new site" → "Deploy manually"
3. Or connect GitHub and select your repo
4. Set:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Set environment variables:
   - `VITE_API_BASE_URL` = `https://your-site.netlify.app/.netlify/functions/api`

### Update Frontend API Configuration

In `src/main.jsx` or API config:

```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  window.location.origin + '/.netlify/functions/api';
```

---

## Part 4: Configure Redirect (Important!)

Create `public/_redirects` file:

```
# Redirect API calls to Netlify Functions
/api/* /.netlify/functions/api/:splat 200

# Redirect all other requests to index.html (for React Router)
/* /index.html 200
```

---

## Part 5: Test Deployment

1. Wait for Netlify build to complete (check "Deploys" tab)
2. Once "Published" status shows, click the site URL
3. Login with credentials:
   - Email: `shayan@master.com`
   - Password: `87976757`
4. Test creating a match
5. Test placing a bid
6. Check admin panel

---

## Alternative: Keep Backend Separate

If you prefer to keep backend on a different service:

### Option A: Backend on Railway + Frontend on Netlify

1. Deploy backend to Railway.app (see HOSTING_GUIDE.md)
2. Deploy frontend to Netlify:
   - Build: `npm run build`
   - Publish: `dist`
   - Env var: `VITE_API_BASE_URL=https://your-backend.railway.app`

### Option B: Backend on Render + Frontend on Netlify

1. Deploy backend to Render.com (similar to Railway)
2. Deploy frontend to Netlify
3. Set `VITE_API_BASE_URL` to your Render backend URL

---

## Pricing Comparison

| Service | Free Tier | After Free |
|---------|-----------|-----------|
| **Netlify (All-in-one)** | 125,000 function invocations/month | $0-19/month |
| **Netlify Frontend Only** | Unlimited builds & deploys | Free |
| **MongoDB Atlas** | 5GB storage | Free forever |
| **Total** | **$0** | **$0-19/month** |

---

## Common Issues on Netlify

### Issue: API Calls Return 404
**Solution:**
- Check `_redirects` file exists in `public/`
- Verify `VITE_API_BASE_URL` = `https://your-site.netlify.app/.netlify/functions/api`
- Check Netlify Functions logs in "Functions" tab

### Issue: MongoDB Connection Fails
**Solution:**
- Verify `MONGODB_URI` environment variable is set correctly
- Check IP whitelist includes 0.0.0.0/0 in MongoDB Atlas
- Test connection string locally first

### Issue: CORS Errors
**Solution:**
- API runs on same domain, CORS should work automatically
- If issues persist, add to `backend/src/app.js`:
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
```

### Issue: Build Fails on Netlify
**Solution:**
- Check build logs: "Deploys" → Click failed deploy → "Deploy log"
- Common causes:
  - Missing environment variables
  - Node version mismatch (set in `netlify.toml`)
  - Dependencies not installed

---

## Advanced: Custom Domain

1. Go to Site settings → Domain management
2. Click "Add custom domain"
3. Enter your domain (e.g., ipl-bidding.com)
4. Follow DNS instructions from your domain registrar
5. SSL/TLS certificate auto-generated by Let's Encrypt

---

## Monitoring & Logs

### View Function Logs
1. Site dashboard → "Functions" tab
2. Click function name
3. View real-time logs

### View Build Logs
1. "Deploys" tab
2. Click on any deployment
3. Scroll to "Deploy log"

### Monitor Errors
- Netlify automatically catches errors in Functions
- View in "Functions" → "Logs"
- Set up email notifications in Site settings

---

## Troubleshooting Checklist

- [ ] GitHub repo is public (or connected via OAuth)
- [ ] `netlify.toml` or environment variables configured
- [ ] `MONGODB_URI` and `JWT_SECRET` set
- [ ] `_redirects` file in `public/` directory
- [ ] Build command: `npm run build`
- [ ] Publish directory: `dist` or `frontend/dist`
- [ ] Frontend build succeeds locally (`npm run build`)
- [ ] Backend starts locally (`npm start` in backend/)
- [ ] `.env` file NOT committed to GitHub
- [ ] MongoDB cluster allows 0.0.0.0/0 access

---

## Quick Deploy Checklist

```bash
# 1. Build locally first
npm run build

# 2. Push to GitHub
git add .
git commit -m "Ready for Netlify deployment"
git push origin main

# 3. Connect to Netlify
# - Go to app.netlify.com
# - Connect GitHub
# - Select your repo
# - Configure build settings
# - Add environment variables
# - Deploy!

# 4. Test
# - Open your Netlify domain
# - Login with super admin credentials
# - Test features
# - Check Functions logs if issues
```

---

## Support & Resources

- **Netlify Docs:** https://docs.netlify.com
- **Netlify Functions:** https://docs.netlify.com/functions/overview
- **MongoDB Atlas:** https://docs.mongodb.com/atlas
- **Netlify Support:** support@netlify.com
- **Community:** https://discord.gg/netlify

---

**Ready to deploy? Follow the 3-part setup above and your app will be live in 10 minutes!**
