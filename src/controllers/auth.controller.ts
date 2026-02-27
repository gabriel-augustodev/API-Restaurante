import { Request, Response, NextFunction } from 'express'
import { AuthService } from '../services/auth.service'
import { AuthRequest } from '../middlewares/auth.middleware'

const authService = new AuthService()

export class AuthController {
    async register(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, senha, nome, telefone } = req.body

            // Validações básicas
            if (!email || !senha || !nome) {
                return res.status(400).json({
                    error: 'Email, senha e nome são obrigatórios'
                })
            }

            const resultado = await authService.register(email, senha, nome, telefone)
            res.status(201).json(resultado)
        } catch (error) {
            next(error)
        }
    }

    async login(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, senha } = req.body

            if (!email || !senha) {
                return res.status(400).json({ error: 'Email e senha são obrigatórios' })
            }

            const resultado = await authService.login(email, senha)
            res.json(resultado)
        } catch (error) {
            next(error)
        }
    }

    async refreshToken(req: Request, res: Response, next: NextFunction) {
        try {
            const { refreshToken } = req.body

            if (!refreshToken) {
                return res.status(400).json({ error: 'Refresh token é obrigatório' })
            }

            const resultado = await authService.refreshToken(refreshToken)
            res.json(resultado)
        } catch (error) {
            next(error)
        }
    }

    async logout(req: Request, res: Response, next: NextFunction) {
        try {
            const { refreshToken } = req.body

            if (!refreshToken) {
                return res.status(400).json({ error: 'Refresh token é obrigatório' })
            }

            await authService.logout(refreshToken)
            res.status(204).send()
        } catch (error) {
            next(error)
        }
    }

    async me(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            res.json({ user: req.user })
        } catch (error) {
            next(error)
        }
    }
}