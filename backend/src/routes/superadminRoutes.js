import { Router } from 'express'
import { auth } from '../middlewares/auth.js'
import {
    getAllUsers,
    updateUserRole,
    deleteUser,
    resetUserPassword,
    updateUserWallet,
} from '../controllers/superadminController.js'

const router = Router()

// All routes require superadmin role
router.get('/users', auth('superadmin'), getAllUsers)
router.patch('/users/:userId/role', auth('superadmin'), updateUserRole)
router.delete('/users/:userId', auth('superadmin'), deleteUser)
router.post('/users/password-reset', auth('superadmin'), resetUserPassword)
router.patch('/users/:userId/wallet', auth('superadmin'), updateUserWallet)

export default router