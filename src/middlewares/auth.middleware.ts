import { Request, Response, NextFunction } from 'express'
import { jwtUtils } from '../utils/jwt.utils'

export interface AuthRequest extends Request {
    user?: {
        userId: string
        email: string
        role: string
    }
}

export const authMiddleware = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers.authorization
    const token = jwtUtils.extractTokenFromHeader(authHeader)

    if (!token) {
        return res.status(401).json({ error: 'Token não fornecido' })
    }

    const payload = jwtUtils.verifyToken(token)
    if (!payload) {
        return res.status(401).json({ error: 'Token inválido ou expirado' })
    }

    req.user = payload
    next()
}

export const roleMiddleware = (allowedRoles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Não autenticado' })
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Acesso negado' })
        }

        next()
    }
}