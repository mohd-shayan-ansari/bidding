import { Router } from 'express'
import { getLeaderboard } from '../controllers/leaderboardController.js'
import { auth } from '../middlewares/auth.js'

const router = Router()

router.get('/leaderboard', auth(), getLeaderboard)

export default router