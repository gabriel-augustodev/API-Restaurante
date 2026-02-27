import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middlewares/auth.middleware'
import { EnderecoService } from '../services/endereco.service'

const enderecoService = new EnderecoService()

export class EnderecoController {
    async listar(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.userId
            const enderecos = await enderecoService.listarPorUsuario(userId)
            res.json(enderecos)
        } catch (error) {
            next(error)
        }
    }

    async buscarPorId(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params

            // Validar se o ID é uma string e não é array
            if (!id || Array.isArray(id)) {
                return res.status(400).json({ error: 'ID inválido' })
            }

            const userId = req.user!.userId
            const endereco = await enderecoService.buscarPorId(id, userId)
            res.json(endereco)
        } catch (error) {
            next(error)
        }
    }

    async criar(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.userId
            const { cep, numero, complemento, isPrincipal } = req.body

            // Validações básicas
            if (!cep || !numero) {
                return res.status(400).json({
                    error: 'CEP e número são obrigatórios'
                })
            }

            // Garantir que cep é string
            if (Array.isArray(cep)) {
                return res.status(400).json({ error: 'CEP inválido' })
            }

            const endereco = await enderecoService.criar(userId, {
                cep,
                numero,
                complemento,
                isPrincipal
            })

            res.status(201).json(endereco)
        } catch (error) {
            next(error)
        }
    }

    async atualizar(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params
            const userId = req.user!.userId
            const { numero, complemento, isPrincipal } = req.body

            // Validar ID
            if (!id || Array.isArray(id)) {
                return res.status(400).json({ error: 'ID inválido' })
            }

            const endereco = await enderecoService.atualizar(id, userId, {
                numero,
                complemento,
                isPrincipal
            })

            res.json(endereco)
        } catch (error) {
            next(error)
        }
    }

    async deletar(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params
            const userId = req.user!.userId

            // Validar ID
            if (!id || Array.isArray(id)) {
                return res.status(400).json({ error: 'ID inválido' })
            }

            const resultado = await enderecoService.deletar(id, userId)
            res.json(resultado)
        } catch (error) {
            next(error)
        }
    }

    async definirComoPrincipal(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params
            const userId = req.user!.userId

            // Validar ID
            if (!id || Array.isArray(id)) {
                return res.status(400).json({ error: 'ID inválido' })
            }

            const endereco = await enderecoService.definirComoPrincipal(id, userId)
            res.json(endereco)
        } catch (error) {
            next(error)
        }
    }
}