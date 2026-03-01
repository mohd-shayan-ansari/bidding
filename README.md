# IPL Bidding Fullstack App

This project now includes a MongoDB + JWT + Express MVC backend and React frontend for IPL bidding.

Important: existing wallet flow is preserved. Bidding only integrates with wallet balance for bid deduction and winnings credit.

## Project structure

- `src/` → frontend app
- `backend/` → API server

## Database schema (excluding wallet schema)

### Match
- `teamA: String`
- `teamB: String`
- `matchStartTime: Date`
- `biddingDeadline: Date`
- `status: 'Upcoming' | 'Locked' | 'Completed'`
- `result: 'TEAM_A' | 'TEAM_B' | null`
- `createdBy: ObjectId(User)`

### Bid
- `user: ObjectId(User)`
- `match: ObjectId(Match)`
- `selection: 'TEAM_A' | 'TEAM_B'`
- `amount: Number`
- `status: 'PLACED' | 'WON' | 'LOST' | 'REFUNDED'`
- `payoutAmount: Number`

### TopupRequest
- `requestId: String`
- `userId: ObjectId(User)`
- `userName: String`
- `amount: Number`
- `upiRef: String`
- `phone: String`
- `screenshotName: String`
- `screenshotUrl: String`
- `status: 'Pending' | 'Approved' | 'Rejected'`

## Backend API routes

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`

### Wallet (existing flow)
- `GET /api/wallet/me`
- `GET /api/topup-requests/me`
- `POST /api/wallet/topup-request`
- `GET /api/admin/topup-requests` (admin)
- `PATCH /api/admin/topup-requests/:id/approve` (admin)
- `PATCH /api/admin/topup-requests/:id/reject` (admin)
- `GET /api/admin/users` (admin)

### Bidding
- `GET /api/matches`
- `POST /api/bids`
- `GET /api/bids/me`
- `GET /api/leaderboard`
- `GET /api/admin/matches` (admin)
- `POST /api/admin/matches` (admin)
- `PATCH /api/admin/matches/:id/result` (admin)

## Core bidding logic

- User places bid only before `biddingDeadline`.
- On placing bid:
   - validate match is `Upcoming`
   - validate wallet has enough balance
   - deduct bid amount from existing wallet
   - store bid in database
- Deadline auto-lock:
   - all expired `Upcoming` matches become `Locked`
- Admin declares result:
   - mark match as `Completed`
   - compute payouts and update wallet
   - store bid final status (`WON` / `LOST` / `REFUNDED`)

## Result calculation logic

For each winning bid:

$$
	ext{payout} = \left(\frac{\text{total pool}}{\text{winning pool}}\right) \times \text{user bid}
$$

If `winningPool = 0`, all bids are refunded.

## Sample frontend pages

- `Market`: list matches and place bids
- `Bids`: user bid history
- `Leaderboard`: users sorted by wallet balance
- `Wallet`: existing add-money workflow
- `Admin`: create match, declare result, approve/reject top-up requests

## Local setup

### 1) Frontend

1. Install dependencies in project root
   - `npm install`
2. Create `.env` from `.env.example`
   - `VITE_API_BASE_URL=http://localhost:4000`
3. Start frontend
   - `npm run dev`

### 2) Backend (MongoDB required)

Start MongoDB locally first (default URI: `mongodb://127.0.0.1:27017/ipl_bidding`).
Optional: `docker compose up -d mongodb`

1. Go to backend folder
   - `cd backend`
2. Install dependencies
   - `npm install`
3. Create `.env` from `.env.example`
   - include `MONGODB_URI`
4. Start backend
   - `npm run dev`

Backend starts on `http://localhost:4000` by default.

## Admin account setup

On first run, the system will create a default admin account. You can modify the credentials in [`backend/src/server.js`](backend/src/server.js) before deployment.

## Hosting notes

### Frontend (Vercel/Netlify)

- Build command: `npm run build`
- Output folder: `dist`
- Env: `VITE_API_BASE_URL=<your-backend-url>`

### Backend (Render/Railway/Fly)

- Root: `backend`
- Start command: `npm start`
- Env variables:
  - `PORT`
  - `JWT_SECRET`
  - `FRONTEND_ORIGIN`
   - `MONGODB_URI`

## Verification checklist

- Frontend build passes with `npm run build`
- Backend starts with `npm start` (with MongoDB running)
- Login/register works
- User can submit wallet top-up request with screenshot
- Admin can approve/reject and wallet ledger updates
- User can place bids and view bid history
- Admin can create matches and declare results
- Leaderboard is sorted by wallet balance
