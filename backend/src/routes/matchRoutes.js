import { Router } from 'express'
import { adminCreateMatch, adminDeclareResult, adminGetMatches, adminUpdateMatch, adminDeleteMatch, getMatches } from '../controllers/matchController.js'
import { auth } from '../middlewares/auth.js'

const router = Router()

router.get('/matches', auth(), getMatches)
router.get('/admin/matches', auth('admin'), adminGetMatches)
router.post('/admin/matches', auth('admin'), adminCreateMatch)
router.put('/admin/matches/:id', auth('admin'), adminUpdateMatch)
router.delete('/admin/matches/:id', auth('admin'), adminDeleteMatch)
router.patch('/admin/matches/:id/result', auth('admin'), adminDeclareResult)

export default router