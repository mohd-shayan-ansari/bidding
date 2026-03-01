import mongoose from 'mongoose'

const matchSchema = new mongoose.Schema({
    teamA: { type: String, required: true, trim: true },
    teamB: { type: String, required: true, trim: true },
    matchStartTime: { type: Date, required: true },
    biddingDeadline: { type: Date, required: true },
    status: { type: String, enum: ['Upcoming', 'Locked', 'Completed'], default: 'Upcoming' },
    result: { type: String, enum: ['TEAM_A', 'TEAM_B', null], default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true }, )

matchSchema.index({ biddingDeadline: 1 })

export const Match = mongoose.model('Match', matchSchema)