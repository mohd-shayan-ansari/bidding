import jwt from 'jsonwebtoken'
import { User } from '../models/User.js'

export function auth(requiredRole) {
    return async(req, res, next) => {
        try {
            const authHeader = req.headers.authorization
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ message: 'Unauthorized' })
            }

            const token = authHeader.split(' ')[1]
            const payload = jwt.verify(token, process.env.JWT_SECRET)
            const user = await User.findById(payload.sub)

            if (!user) {
                return res.status(401).json({ message: 'Invalid token user' })
            }

            if (requiredRole) {
                // superadmin can access admin routes, admin can't access superadmin routes
                const userRole = user.role
                if (requiredRole === 'superadmin' && userRole !== 'superadmin') {
                    return res.status(403).json({ message: 'Forbidden' })
                }
                if (requiredRole === 'admin' && userRole !== 'admin' && userRole !== 'superadmin') {
                    return res.status(403).json({ message: 'Forbidden' })
                }
            }

            req.user = user
            next()
        } catch {
            return res.status(401).json({ message: 'Invalid token' })
        }
    }
}