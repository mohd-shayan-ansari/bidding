import mongoose from 'mongoose'

const topupRequestSchema = new mongoose.Schema({
    requestId: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    amount: { type: Number, required: true, min: 1 },
    upiRef: { type: String, required: true },
    phone: { type: String, required: true },
    screenshotName: { type: String, required: true },
    screenshotUrl: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    processedAt: { type: Date, default: null },
}, { timestamps: true }, )

export const TopupRequest = mongoose.model('TopupRequest', topupRequestSchema)