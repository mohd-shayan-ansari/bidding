import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import { nanoid } from 'nanoid'
import {
    approveTopupRequest,
    createTopupRequest,
    getAdminTopupRequests,
    getAdminUsers,
    getMyTopupRequests,
    getMyWallet,
    rejectTopupRequest,
} from '../controllers/walletController.js'
import { auth } from '../middlewares/auth.js'

const router = Router()

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, 'uploads')
    },
    filename: (_req, file, cb) => {
        const extension = path.extname(file.originalname)
        cb(null, `${Date.now()}-${nanoid(8)}${extension}`)
    },
})

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
})

router.get('/wallet/me', auth(), getMyWallet)
router.get('/topup-requests/me', auth(), getMyTopupRequests)
router.post('/wallet/topup-request', auth(), upload.single('screenshot'), createTopupRequest)

router.get('/admin/topup-requests', auth('admin'), getAdminTopupRequests)
router.get('/admin/users', auth('admin'), getAdminUsers)
router.patch('/admin/topup-requests/:id/approve', auth('admin'), approveTopupRequest)
router.patch('/admin/topup-requests/:id/reject', auth('admin'), rejectTopupRequest)

export default router