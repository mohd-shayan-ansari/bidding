import mongoose from 'mongoose'

const bidSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    match: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true },
    selection: { type: String, enum: ['TEAM_A', 'TEAM_B'], required: true },
    amount: { type: Number, required: true, min: 1 },
    status: { type: String, enum: ['PLACED', 'WON', 'LOST', 'REFUNDED'], default: 'PLACED' },
    payoutAmount: { type: Number, default: 0, min: 0 },
}, { timestamps: true }, )

bidSchema.index({ user: 1, match: 1, createdAt: -1 })

export const Bid = mongoose.model('Bid', bidSchema)