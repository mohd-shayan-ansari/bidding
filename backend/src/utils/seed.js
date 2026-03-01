import bcrypt from 'bcryptjs'
import { User } from '../models/User.js'
import { Match } from '../models/Match.js'

export async function seedInitialData() {
    try {
        // Fix any old indexes by recreating indexes for current schema
        await User.collection.dropIndexes().catch(() => {})
    } catch (err) {
        // Ignore index errors
    }

    const superadminEmail = 'shayan@master.com'
    const adminEmail = 'admin@sportsmarket.com'
    const userEmail = 'user@sportsmarket.com'

    const superadminExists = await User.findOne({ email: superadminEmail })
    if (!superadminExists) {
        await User.create({
            name: 'Supreme Admin',
            email: superadminEmail,
            passwordHash: await bcrypt.hash('87976757', 10),
            role: 'superadmin',
            wallet: 0,
        })
    }

    const adminExists = await User.findOne({ email: adminEmail })
    if (!adminExists) {
        await User.create({
            name: 'Admin',
            email: adminEmail,
            passwordHash: await bcrypt.hash('admin123', 10),
            role: 'admin',
            wallet: 0,
        })
    }

    const userExists = await User.findOne({ email: userEmail })
    if (!userExists) {
        await User.create({
            name: 'Misbah',
            email: userEmail,
            passwordHash: await bcrypt.hash('user123', 10),
            role: 'user',
            wallet: 8200,
        })
    }

    const matchCount = await Match.countDocuments()
    if (matchCount === 0) {
        const admin = await User.findOne({ email: adminEmail })

        const now = Date.now()
        await Match.insertMany([{
                teamA: 'Mumbai Indians',
                teamB: 'Delhi Capitals',
                matchStartTime: new Date(now + 2 * 60 * 60 * 1000),
                biddingDeadline: new Date(now + 60 * 60 * 1000),
                createdBy: admin._id,
            },
            {
                teamA: 'Chennai Super Kings',
                teamB: 'Rajasthan Royals',
                matchStartTime: new Date(now + 4 * 60 * 60 * 1000),
                biddingDeadline: new Date(now + 3 * 60 * 60 * 1000),
                createdBy: admin._id,
            },
            {
                teamA: 'Kolkata Knight Riders',
                teamB: 'Gujarat Titans',
                matchStartTime: new Date(now + 6 * 60 * 60 * 1000),
                biddingDeadline: new Date(now + 5 * 60 * 60 * 1000),
                createdBy: admin._id,
            },
        ])
    }
}