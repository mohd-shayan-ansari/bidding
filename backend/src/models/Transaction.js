import mongoose from 'mongoose'

const transactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    type: { type: String, enum: ['BID_PLACED', 'BID_WON', 'BID_LOST', 'TOPUP_APPROVED', 'TOPUP_REJECTED'], required: true },
    amount: { type: Number, required: true },
    matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match' },
    bidId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bid' },
    description: { type: String },
    balanceBefore: { type: Number },
    balanceAfter: { type: Number },
}, { timestamps: true })

export const Transaction = mongoose.model('Transaction', transactionSchema)