import { Router } from 'express'
import { AuthController } from '../controllers/auth.controller'
import { authMiddleware } from '../middlewares/auth.middleware'

const router = Router()
const authController = new AuthController()

// Rotas públicas
router.post('/register', authController.register)
router.post('/login', authController.login)
router.post('/refresh-token', authController.refreshToken)
router.post('/logout', authController.logout)

// Rota protegida (exemplo)
router.get('/me', authMiddleware, authController.me)

export default router