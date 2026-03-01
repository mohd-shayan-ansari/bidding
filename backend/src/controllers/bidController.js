import { Bid } from '../models/Bid.js'
import { Match } from '../models/Match.js'
import { User } from '../models/User.js'
import { autoLockExpiredMatches } from './matchController.js'

export async function placeBid(req, res) {
    const { matchId, selection, amount } = req.body
    const bidAmount = Number(amount)

    if (!matchId || !['TEAM_A', 'TEAM_B'].includes(selection) || !bidAmount || bidAmount <= 0) {
        return res.status(400).json({ message: 'matchId, valid selection and positive amount are required' })
    }

    await autoLockExpiredMatches()

    const match = await Match.findById(matchId)
    if (!match) {
        return res.status(404).json({ message: 'Match not found' })
    }

    if (match.status !== 'Upcoming') {
        return res.status(400).json({ message: 'Bidding is closed for this match' })
    }

    if (new Date() > new Date(match.biddingDeadline)) {
        match.status = 'Locked'
        await match.save()
        return res.status(400).json({ message: 'Bidding deadline has passed' })
    }

    const user = await User.findById(req.user._id)
    if (!user || user.wallet < bidAmount) {
        return res.status(400).json({ message: 'Insufficient wallet balance' })
    }

    user.wallet -= bidAmount
    await user.save()

    const bid = await Bid.create({
        user: user._id,
        match: match._id,
        selection,
        amount: bidAmount,
        status: 'PLACED',
    })

    return res.status(201).json({
        id: bid._id.toString(),
        matchId,
        selection,
        amount: bidAmount,
        status: bid.status,
        wallet: user.wallet,
        createdAt: bid.createdAt,
    })
}

export async function getMyBids(req, res) {
    const bids = await Bid.find({ user: req.user._id })
        .populate('match')
        .sort({ createdAt: -1 })

    const data = bids.map((bid) => ({
        id: bid._id.toString(),
        matchId: bid.match ? bid.match._id.toString() : null,
        teams: bid.match ? [bid.match.teamA, bid.match.teamB] : [],
        selection: bid.selection,
        amount: bid.amount,
        status: bid.status,
        payoutAmount: bid.payoutAmount,
        createdAt: bid.createdAt,
    }))

    return res.json(data)
}