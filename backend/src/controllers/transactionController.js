import { Transaction } from '../models/Transaction.js'

export async function getAdminTransactions(_req, res) {
    const transactions = await Transaction.find().sort({ createdAt: -1 })
    const data = transactions.map((tx) => ({
        id: tx._id.toString(),
        userId: tx.userId.toString(),
        userName: tx.userName,
        type: tx.type,
        amount: tx.amount,
        description: tx.description,
        balanceBefore: tx.balanceBefore,
        balanceAfter: tx.balanceAfter,
        createdAt: tx.createdAt,
    }))

    return res.json(data)
}