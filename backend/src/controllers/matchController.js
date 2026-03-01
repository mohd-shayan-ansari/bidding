import { Match } from '../models/Match.js'
import { Bid } from '../models/Bid.js'
import { User } from '../models/User.js'
import { Transaction } from '../models/Transaction.js'

export async function autoLockExpiredMatches() {
    await Match.updateMany({
        status: 'Upcoming',
        biddingDeadline: { $lt: new Date() },
    }, {
        $set: { status: 'Locked' },
    }, )
}

function mapMatch(match) {
    return {
        id: match._id.toString(),
        sport: 'Cricket',
        status: match.status,
        teams: [match.teamA, match.teamB],
        teamA: match.teamA,
        teamB: match.teamB,
        matchStartTime: match.matchStartTime,
        biddingDeadline: match.biddingDeadline,
        result: match.result,
        startsAt: new Date(match.matchStartTime).toLocaleString(),
        score: match.status === 'Upcoming' ? 'Match not started' : match.status,
        viewers: 0,
        trend: '+0%',
        marketCap: '₹0',
    }
}

export async function getMatches(_req, res) {
    await autoLockExpiredMatches()
    const matches = await Match.find().sort({ matchStartTime: 1 })
    return res.json(matches.map((match) => mapMatch(match)))
}

export async function adminCreateMatch(req, res) {
    const { teamA, teamB, matchStartTime, biddingDeadline } = req.body

    if (!teamA || !teamB || !matchStartTime || !biddingDeadline) {
        return res.status(400).json({ message: 'teamA, teamB, matchStartTime and biddingDeadline are required' })
    }

    const startDate = new Date(matchStartTime)
    const deadlineDate = new Date(biddingDeadline)

    if (deadlineDate >= startDate) {
        return res.status(400).json({ message: 'Bidding deadline must be before match start time' })
    }

    const match = await Match.create({
        teamA,
        teamB,
        matchStartTime: startDate,
        biddingDeadline: deadlineDate,
        createdBy: req.user._id,
    })

    return res.status(201).json(mapMatch(match))
}

export async function adminGetMatches(_req, res) {
    await autoLockExpiredMatches()
    const matches = await Match.find().sort({ createdAt: -1 })
    return res.json(matches.map((match) => mapMatch(match)))
}

export async function adminDeclareResult(req, res) {
    const { id } = req.params
    const { result } = req.body

    if (!['TEAM_A', 'TEAM_B'].includes(result)) {
        return res.status(400).json({ message: 'Result must be TEAM_A or TEAM_B' })
    }

    const match = await Match.findById(id)
    if (!match) {
        return res.status(404).json({ message: 'Match not found' })
    }

    if (match.status === 'Completed') {
        return res.status(400).json({ message: 'Result already declared' })
    }

    const bids = await Bid.find({ match: match._id })
    const winningMultiplier = 1.25

    const admin = await User.findOne({ role: 'admin' })
    let totalLossesToAdmin = 0
    let totalPayoutsToWinners = 0

    for (const bid of bids) {
        const user = await User.findById(bid.user)

        if (bid.selection === result) {
            // User won - gets 1.25x their bid amount
            const payout = Number((bid.amount * winningMultiplier).toFixed(2))
            totalPayoutsToWinners += payout

            if (user) {
                user.wallet += payout
                await user.save()
            }
            bid.status = 'WON'
            bid.payoutAmount = payout
            await bid.save()

            await Transaction.create({
                userId: bid.user,
                userName: user && user.name || 'Unknown',
                type: 'BID_WON',
                amount: payout,
                matchId: match._id,
                bidId: bid._id,
                description: `Won bid on ${match.teamA} vs ${match.teamB} - Payout: ${payout} (${winningMultiplier}x)`,
                balanceBefore: user && user.wallet ? user.wallet - payout : 0,
                balanceAfter: user && user.wallet || 0,
            })
        } else {
            // User lost - money goes to admin (not refunded)
            bid.status = 'LOST'
            bid.payoutAmount = 0
            await bid.save()

            totalLossesToAdmin += bid.amount

            await Transaction.create({
                userId: bid.user,
                userName: user && user.name || 'Unknown',
                type: 'BID_LOST',
                amount: bid.amount,
                matchId: match._id,
                bidId: bid._id,
                description: `Lost bid on ${match.teamA} vs ${match.teamB} - Amount transferred to admin`,
                balanceBefore: user && user.wallet || 0,
                balanceAfter: user && user.wallet || 0,
            })
        }
    }

    // Transfer all losses to admin wallet
    if (admin) {
        admin.wallet += totalLossesToAdmin
        await admin.save()
    }

    match.result = result
    match.status = 'Completed'
    await match.save()

    return res.json({
        message: 'Result declared and payouts processed',
        totalLossesToAdmin,
        totalPayoutsToWinners,
        winningMultiplier: 1.25,
        result,
    })
}

export async function adminUpdateMatch(req, res) {
    const { id } = req.params
    const { teamA, teamB, matchStartTime, biddingDeadline } = req.body

    const match = await Match.findById(id)
    if (!match) {
        return res.status(404).json({ message: 'Match not found' })
    }

    if (match.status === 'Completed') {
        return res.status(400).json({ message: 'Cannot edit completed match' })
    }

    // Check if there are existing bids
    const bidCount = await Bid.countDocuments({ match: match._id })
    if (bidCount > 0) {
        return res.status(400).json({ message: 'Cannot edit match with existing bids' })
    }

    if (teamA) match.teamA = teamA
    if (teamB) match.teamB = teamB
    if (matchStartTime) match.matchStartTime = new Date(matchStartTime)
    if (biddingDeadline) match.biddingDeadline = new Date(biddingDeadline)

    if (match.biddingDeadline >= match.matchStartTime) {
        return res.status(400).json({ message: 'Bidding deadline must be before match start time' })
    }

    await match.save()
    return res.json({ message: 'Match updated successfully', match: mapMatch(match) })
}

export async function adminDeleteMatch(req, res) {
    const { id } = req.params

    const match = await Match.findById(id)
    if (!match) {
        return res.status(404).json({ message: 'Match not found' })
    }

    // Check if there are existing bids
    const bids = await Bid.find({ match: match._id })
    if (bids.length > 0) {
        // Refund all pending bids before deleting
        for (const bid of bids) {
            if (bid.status === 'PENDING') {
                const user = await User.findById(bid.user)
                if (user) {
                    user.wallet += bid.amount
                    await user.save()

                    await Transaction.create({
                        userId: bid.user,
                        userName: user.name,
                        type: 'BID_REFUND',
                        amount: bid.amount,
                        matchId: match._id,
                        bidId: bid._id,
                        description: `Refund for cancelled match: ${match.teamA} vs ${match.teamB}`,
                        balanceBefore: user.wallet - bid.amount,
                        balanceAfter: user.wallet,
                    })
                }
            }
        }

        // Delete all bids
        await Bid.deleteMany({ match: match._id })
    }

    // Delete all transactions related to this match (except the refund ones we just created)
    await Transaction.deleteMany({ matchId: match._id, type: { $ne: 'BID_REFUND' } })

    // Delete the match
    await Match.findByIdAndDelete(id)

    return res.json({ message: 'Match deleted successfully' })
}