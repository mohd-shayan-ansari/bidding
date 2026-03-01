import { Router } from 'express'
import { auth } from '../middlewares/auth.js'
import { getAdminTransactions } from '../controllers/transactionController.js'

const router = Router()

router.get('/admin/transactions', auth('admin'), getAdminTransactions)

export default router