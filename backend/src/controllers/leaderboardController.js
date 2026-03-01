import { User } from '../models/User.js'

export async function getLeaderboard(_req, res) {
    const users = await User.find({ role: 'user' }).sort({ wallet: -1, createdAt: 1 })
    const leaderboard = users.map((user, index) => ({
        rank: index + 1,
        id: user._id.toString(),
        name: user.name,
        wallet: user.wallet,
    }))

    return res.json(leaderboard)
}