import { prisma } from '../server'
import bcrypt from 'bcryptjs'
import { jwtUtils, TokenPayload } from '../utils/jwt.utils'

export class AuthService {
    private readonly SALT_ROUNDS = 10

    async register(email: string, senha: string, nome: string, telefone?: string) {
        // Verificar se usuário já existe
        const usuarioExistente = await prisma.user.findUnique({
            where: { email }
        })

        if (usuarioExistente) {
            throw new Error('Email já cadastrado')
        }

        // Hash da senha
        const senhaHash = await bcrypt.hash(senha, this.SALT_ROUNDS)

        // Criar usuário
        const usuario = await prisma.user.create({
            data: {
                email,
                senhaHash,
                nome,
                telefone
            }
        })

        // Gerar tokens
        const payload: TokenPayload = {
            userId: usuario.id,
            email: usuario.email,
            role: usuario.role
        }

        const accessToken = jwtUtils.generateAccessToken(payload)
        const refreshToken = jwtUtils.generateRefreshToken()

        // Salvar refresh token no banco
        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: usuario.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 dias
            }
        })

        return {
            user: {
                id: usuario.id,
                email: usuario.email,
                nome: usuario.nome,
                role: usuario.role
            },
            accessToken,
            refreshToken
        }
    }

    async login(email: string, senha: string) {
        // Buscar usuário
        const usuario = await prisma.user.findUnique({
            where: { email }
        })

        if (!usuario) {
            throw new Error('Email ou senha inválidos')
        }

        // Verificar senha
        const senhaValida = await bcrypt.compare(senha, usuario.senhaHash)
        if (!senhaValida) {
            throw new Error('Email ou senha inválidos')
        }

        // Gerar tokens
        const payload: TokenPayload = {
            userId: usuario.id,
            email: usuario.email,
            role: usuario.role
        }

        const accessToken = jwtUtils.generateAccessToken(payload)
        const refreshToken = jwtUtils.generateRefreshToken()

        // Salvar refresh token
        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                userId: usuario.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
        })

        return {
            user: {
                id: usuario.id,
                email: usuario.email,
                nome: usuario.nome,
                role: usuario.role
            },
            accessToken,
            refreshToken
        }
    }

    async refreshToken(token: string) {
        // Buscar refresh token válido
        const refreshToken = await prisma.refreshToken.findUnique({
            where: {
                token,
                revokedAt: null,
                expiresAt: { gt: new Date() }
            },
            include: { user: true }
        })

        if (!refreshToken) {
            throw new Error('Refresh token inválido ou expirado')
        }

        // Gerar novo access token
        const payload: TokenPayload = {
            userId: refreshToken.user.id,
            email: refreshToken.user.email,
            role: refreshToken.user.role
        }

        const accessToken = jwtUtils.generateAccessToken(payload)

        return { accessToken }
    }

    async logout(token: string) {
        // Revogar refresh token
        await prisma.refreshToken.updateMany({
            where: { token },
            data: { revokedAt: new Date() }
        })
    }
}