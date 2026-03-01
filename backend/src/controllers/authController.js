import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { User } from '../models/User.js'

function signToken(user) {
    return jwt.sign({ sub: user._id.toString(), role: user.role, email: user.email },
        process.env.JWT_SECRET, { expiresIn: '7d' },
    )
}

function sanitizeUser(user) {
    return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        wallet: user.wallet,
    }
}

export async function register(req, res) {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email and password are required' })
    }

    const normalizedEmail = String(email).trim().toLowerCase()
    const exists = await User.findOne({ email: normalizedEmail })
    if (exists) {
        return res.status(409).json({ message: 'Email already exists' })
    }

    const user = await User.create({
        name: String(name).trim(),
        email: normalizedEmail,
        passwordHash: await bcrypt.hash(password, 10),
        role: 'user',
        wallet: 0,
    })

    const token = signToken(user)
    return res.status(201).json({ token, user: sanitizeUser(user) })
}

export async function login(req, res) {
    const { email, password } = req.body

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' })
    }

    const normalizedEmail = String(email).trim().toLowerCase()
    const user = await User.findOne({ email: normalizedEmail })

    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
        return res.status(401).json({ message: 'Invalid credentials' })
    }

    const token = signToken(user)
    return res.json({ token, user: sanitizeUser(user) })
}