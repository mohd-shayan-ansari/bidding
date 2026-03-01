import { User } from '../models/User.js'
import bcrypt from 'bcryptjs'

function sanitizeUser(user) {
    return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        wallet: user.wallet,
        createdAt: user.createdAt,
    }
}

export async function getAllUsers(req, res) {
    try {
        const users = await User.find().select('-passwordHash').sort({ createdAt: -1 })
        return res.json(users.map(sanitizeUser))
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}

export async function updateUserRole(req, res) {
    try {
        const { userId } = req.params
        const { role } = req.body

        if (!['user', 'admin', 'superadmin'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' })
        }

        const user = await User.findByIdAndUpdate(
            userId, { role }, { new: true }
        ).select('-passwordHash')

        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }

        return res.json({ message: 'User role updated', user: sanitizeUser(user) })
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}

export async function deleteUser(req, res) {
    try {
        const { userId } = req.params

        // Prevent deleting the last superadmin
        const user = await User.findById(userId)
        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }

        if (user.role === 'superadmin') {
            const superadminCount = await User.countDocuments({ role: 'superadmin' })
            if (superadminCount <= 1) {
                return res.status(400).json({ message: 'Cannot delete the last super admin' })
            }
        }

        await User.findByIdAndDelete(userId)
        return res.json({ message: 'User deleted successfully' })
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}

export async function resetUserPassword(req, res) {
    try {
        const { userId, newPassword } = req.body

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' })
        }

        const passwordHash = await bcrypt.hash(newPassword, 10)
        const user = await User.findByIdAndUpdate(
            userId, { passwordHash }, { new: true }
        ).select('-passwordHash')

        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }

        return res.json({ message: 'User password reset successfully', user: sanitizeUser(user) })
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}

export async function updateUserWallet(req, res) {
    try {
        const { userId } = req.params
        const { amount, operation } = req.body

        if (!['add', 'subtract', 'set'].includes(operation)) {
            return res.status(400).json({ message: 'Invalid operation' })
        }

        let updateObj = {}
        if (operation === 'add') {
            updateObj = { $inc: { wallet: Number(amount) } }
        } else if (operation === 'subtract') {
            updateObj = { $inc: { wallet: -Number(amount) } }
        } else if (operation === 'set') {
            updateObj = { wallet: Number(amount) }
        }

        const user = await User.findByIdAndUpdate(
            userId,
            operation === 'set' ? { wallet: Number(amount) } : updateObj, { new: true }
        ).select('-passwordHash')

        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }

        return res.json({ message: 'User wallet updated', user: sanitizeUser(user) })
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}