import express from 'express'
import cors from 'cors'
import fs from 'fs'
import authRoutes from './routes/authRoutes.js'
import walletRoutes from './routes/walletRoutes.js'
import matchRoutes from './routes/matchRoutes.js'
import bidRoutes from './routes/bidRoutes.js'
import leaderboardRoutes from './routes/leaderboardRoutes.js'
import transactionRoutes from './routes/transactionRoutes.js'
import superadminRoutes from './routes/superadminRoutes.js'
import { errorHandler } from './middlewares/errorHandler.js'

export function createApp() {
    const uploadDir = process.env.UPLOAD_DIR || (process.env.NETLIFY ? '/tmp/uploads' : 'uploads')

    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
    }

    const app = express()
    app.use(
        cors({
            origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
        }),
    )
    app.use(express.json())
    app.use('/uploads', express.static(uploadDir))

    app.get('/', (_req, res) => {
        res.json({ message: 'IPL Bidding API', health: 'ok', frontend: process.env.FRONTEND_ORIGIN })
    })

    app.get('/api/health', (_req, res) => {
        res.json({ ok: true, time: new Date().toISOString() })
    })

    app.use('/api/auth', authRoutes)
    app.use('/api', walletRoutes)
    app.use('/api', matchRoutes)
    app.use('/api', bidRoutes)
    app.use('/api', leaderboardRoutes)
    app.use('/api', transactionRoutes)
    app.use('/api/superadmin', superadminRoutes)

    app.use(errorHandler)
    return app
}