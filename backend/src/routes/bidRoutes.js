import { Router } from 'express'
import { getMyBids, placeBid } from '../controllers/bidController.js'
import { auth } from '../middlewares/auth.js'

const router = Router()

router.post('/bids', auth(), placeBid)
router.get('/bids/me', auth(), getMyBids)

export default router