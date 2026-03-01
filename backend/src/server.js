import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { promises as fsPromises } from 'fs'
import { fileURLToPath } from 'url'
import { nanoid } from 'nanoid'

const __filename = fileURLToPath(
    import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.join(__dirname, '..')
const dataDir = path.join(rootDir, 'data')
const uploadsDir = path.join(rootDir, 'uploads')
const dbPath = path.join(dataDir, 'db.json')

const app = express()
const PORT = Number(process.env.PORT || 4000)
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me'
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173'

for (const dir of[dataDir, uploadsDir]) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
    }
}

const sampleMatches = [{
        id: 'm1',
        sport: 'Cricket',
        status: 'Ongoing',
        teams: ['Mumbai Indians', 'Delhi Capitals'],
        score: '178/4 (18.2) vs 172/8 (20.0)',
        startsAt: 'Live now',
        viewers: 24500,
        trend: '+8.4%',
        marketCap: '₹15.2M',
    },
    {
        id: 'm2',
        sport: 'Cricket',
        status: 'Ongoing',
        teams: ['Chennai Super Kings', 'Rajasthan Royals'],
        score: '165/6 (19.3) vs 158 all out',
        startsAt: 'Live now',
        viewers: 19800,
        trend: '+5.1%',
        marketCap: '₹12.8M',
    },
    {
        id: 'm3',
        sport: 'Cricket',
        status: 'Upcoming',
        teams: ['Kolkata Knight Riders', 'Gujarat Titans'],
        score: 'Starts in 1h 40m',
        startsAt: 'Today, 7:30 PM',
        viewers: 12340,
        trend: '+3.2%',
        marketCap: '₹9.6M',
    },
    {
        id: 'm4',
        sport: 'Cricket',
        status: 'Upcoming',
        teams: ['Lucknow Super Giants', 'Punjab Kings'],
        score: 'Starts in 3h 20m',
        startsAt: 'Today, 8:30 PM',
        viewers: 8920,
        trend: '+2.7%',
        marketCap: '₹7.4M',
    },
    {
        id: 'm5',
        sport: 'Cricket',
        status: 'Upcoming',
        teams: ['Royal Challengers Bengaluru', 'Sunrisers Hyderabad'],
        score: 'Starts in 4h 15m',
        startsAt: 'Today, 9:30 PM',
        viewers: 11250,
        trend: '+4.3%',
        marketCap: '₹8.9M',
    },
]

function seedDbFile() {
    if (fs.existsSync(dbPath)) {
        return
    }

    const adminPasswordHash = bcrypt.hashSync('admin123', 10)
    const userPasswordHash = bcrypt.hashSync('user123', 10)

    const initialDb = {
        users: [{
                id: 'u_admin',
                name: 'Admin',
                email: 'admin@sportsmarket.com',
                passwordHash: adminPasswordHash,
                role: 'admin',
                wallet: 0,
            },
            {
                id: 'u_demo',
                name: 'Misbah',
                email: 'user@sportsmarket.com',
                passwordHash: userPasswordHash,
                role: 'user',
                wallet: 8200,
            },
        ],
        matches: sampleMatches,
        topupRequests: [],
    }

    fs.writeFileSync(dbPath, JSON.stringify(initialDb, null, 2), 'utf-8')
}

seedDbFile()

async function readDb() {
    const raw = await fsPromises.readFile(dbPath, 'utf-8')
    return JSON.parse(raw)
}

async function writeDb(data) {
    await fsPromises.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf-8')
}

function sanitizeUser(user) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        wallet: user.wallet,
    }
}

function signToken(user) {
    return jwt.sign({ sub: user.id, role: user.role, email: user.email },
        JWT_SECRET, {
            expiresIn: '7d',
        },
    )
}

function auth(requiredRole) {
    return async(req, res, next) => {
        const authHeader = req.headers.authorization

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Unauthorized' })
        }

        const token = authHeader.split(' ')[1]

        try {
            const payload = jwt.verify(token, JWT_SECRET)
            const db = await readDb()
            const user = db.users.find((item) => item.id === payload.sub)

            if (!user) {
                return res.status(401).json({ message: 'Invalid token user' })
            }

            if (requiredRole && user.role !== requiredRole) {
                return res.status(403).json({ message: 'Forbidden' })
            }

            req.user = user
            next()
        } catch {
            return res.status(401).json({ message: 'Invalid token' })
        }
    }
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadsDir)
    },
    filename: (_req, file, cb) => {
        const extension = path.extname(file.originalname)
        cb(null, `${Date.now()}-${nanoid(8)}${extension}`)
    },
})

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
})

app.use(
    cors({
        origin: FRONTEND_ORIGIN,
    }),
)
app.use(express.json())
app.use('/uploads', express.static(uploadsDir))

app.get('/api/health', (_req, res) => {
    res.json({ ok: true, time: new Date().toISOString() })
})

app.post('/api/auth/register', async(req, res) => {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email and password are required' })
    }

    const normalizedEmail = String(email).trim().toLowerCase()

    const db = await readDb()
    const alreadyExists = db.users.some((user) => user.email === normalizedEmail)

    if (alreadyExists) {
        return res.status(409).json({ message: 'Email already exists' })
    }

    const user = {
        id: `u_${nanoid(10)}`,
        name: String(name).trim(),
        email: normalizedEmail,
        passwordHash: await bcrypt.hash(password, 10),
        role: 'user',
        wallet: 0,
    }

    db.users.push(user)
    await writeDb(db)

    const token = signToken(user)
    return res.status(201).json({ token, user: sanitizeUser(user) })
})

app.post('/api/auth/login', async(req, res) => {
    const { email, password } = req.body

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' })
    }

    const normalizedEmail = String(email).trim().toLowerCase()

    const db = await readDb()
    const user = db.users.find((item) => item.email === normalizedEmail)

    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' })
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
    if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' })
    }

    const token = signToken(user)
    return res.json({ token, user: sanitizeUser(user) })
})

app.get('/api/matches', auth(), async(_req, res) => {
    const db = await readDb()
    return res.json(db.matches)
})

app.get('/api/wallet/me', auth(), async(req, res) => {
    const db = await readDb()
    const user = db.users.find((item) => item.id === req.user.id)
    return res.json({ wallet: user ? user.wallet : 0 })
})

app.get('/api/topup-requests/me', auth(), async(req, res) => {
    const db = await readDb()
    const data = db.topupRequests.filter((request) => request.userId === req.user.id)
    return res.json(data)
})

app.post('/api/wallet/topup-request', auth(), upload.single('screenshot'), async(req, res) => {
    const { amount, upiRef, phone } = req.body

    if (!amount || !upiRef || !phone) {
        return res.status(400).json({ message: 'Amount, UPI ref and phone are required' })
    }

    if (!req.file) {
        return res.status(400).json({ message: 'Payment screenshot is required' })
    }

    const db = await readDb()

    const request = {
        id: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
        userId: req.user.id,
        userName: req.user.name,
        amount: Number(amount),
        upiRef,
        phone,
        screenshotName: req.file.originalname,
        screenshotUrl: `/uploads/${req.file.filename}`,
        status: 'Pending',
        createdAt: new Date().toISOString(),
    }

    db.topupRequests.unshift(request)
    await writeDb(db)

    return res.status(201).json(request)
})

app.get('/api/admin/topup-requests', auth('admin'), async(_req, res) => {
    const db = await readDb()
    return res.json(db.topupRequests)
})

app.get('/api/admin/users', auth('admin'), async(_req, res) => {
    const db = await readDb()
    const users = db.users.map((user) => sanitizeUser(user))
    return res.json(users)
})

app.patch('/api/admin/topup-requests/:id/approve', auth('admin'), async(req, res) => {
    const { id } = req.params
    const db = await readDb()

    const request = db.topupRequests.find((item) => item.id === id)
    if (!request) {
        return res.status(404).json({ message: 'Request not found' })
    }

    if (request.status !== 'Pending') {
        return res.status(400).json({ message: 'Request already processed' })
    }

    const user = db.users.find((item) => item.id === request.userId)
    if (!user) {
        return res.status(404).json({ message: 'User not found' })
    }

    user.wallet += Number(request.amount)
    request.status = 'Approved'
    request.processedAt = new Date().toISOString()

    await writeDb(db)
    return res.json({ request, user: sanitizeUser(user) })
})

app.patch('/api/admin/topup-requests/:id/reject', auth('admin'), async(req, res) => {
    const { id } = req.params
    const db = await readDb()

    const request = db.topupRequests.find((item) => item.id === id)
    if (!request) {
        return res.status(404).json({ message: 'Request not found' })
    }

    if (request.status !== 'Pending') {
        return res.status(400).json({ message: 'Request already processed' })
    }

    request.status = 'Rejected'
    request.processedAt = new Date().toISOString()

    await writeDb(db)
    return res.json({ request })
})

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`)
})