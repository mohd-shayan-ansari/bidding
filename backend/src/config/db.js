import mongoose from 'mongoose'

export async function connectDb() {
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection
    }

    const uri = process.env.MONGODB_URI
    if (!uri) {
        throw new Error('MONGODB_URI is required')
    }

    await mongoose.connect(uri)
    console.log('MongoDB connected')
}