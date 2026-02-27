import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'seu-segredo-super-seguro-aqui'
const JWT_EXPIRES_IN = '15m' // Token curto por segurança
const REFRESH_TOKEN_EXPIRES_IN = '7d' // Refresh token dura 7 dias

export interface TokenPayload {
    userId: string
    email: string
    role: string
}

export const jwtUtils = {
    generateAccessToken(payload: TokenPayload): string {
        return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
    },

    generateRefreshToken(): string {
        return jwt.sign({}, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN })
    },

    verifyToken(token: string): TokenPayload | null {
        try {
            return jwt.verify(token, JWT_SECRET) as TokenPayload
        } catch (error) {
            return null
        }
    },

    extractTokenFromHeader(authHeader?: string): string | null {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null
        }
        return authHeader.substring(7)
    }
}