import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middlewares/auth.middleware'
import { CategoriaService } from '../services/categoria.service'
import { prisma } from '../server' // ← IMPORTANTE: importar o prisma

const categoriaService = new CategoriaService()

export class CategoriaController {
    // Listar categorias de um restaurante (público)
    async listarPublico(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { restauranteId } = req.params

            if (!restauranteId || Array.isArray(restauranteId)) {
                return res.status(400).json({ error: 'ID do restaurante inválido' })
            }

            const categorias = await categoriaService.listarPorRestaurante(restauranteId)
            res.json(categorias)
        } catch (error) {
            next(error)
        }
    }

    // Listar categorias do meu restaurante (dono)
    async listarMinhas(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { restauranteId } = req.params
            const userId = req.user!.userId

            // Validar parâmetros
            if (!restauranteId || Array.isArray(restauranteId)) {
                return res.status(400).json({ error: 'ID do restaurante inválido' })
            }

            // Verificar se o restaurante pertence ao usuário
            const restaurante = await prisma.restaurante.findFirst({
                where: {
                    id: restauranteId,
                    proprietarioId: userId
                }
            })

            if (!restaurante) {
                return res.status(404).json({ error: 'Restaurante não encontrado' })
            }

            const categorias = await categoriaService.listarPorRestaurante(restauranteId)
            res.json(categorias)
        } catch (error) {
            next(error)
        }
    }

    // Buscar categoria por ID (público)
    async buscarPorIdPublico(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id, restauranteId } = req.params

            if (!id || Array.isArray(id)) {
                return res.status(400).json({ error: 'ID inválido' })
            }

            if (!restauranteId || Array.isArray(restauranteId)) {
                return res.status(400).json({ error: 'ID do restaurante inválido' })
            }

            const categoria = await categoriaService.buscarPorId(id, restauranteId)
            res.json(categoria)
        } catch (error) {
            next(error)
        }
    }

    // Criar categoria (dono do restaurante)
    async criar(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { restauranteId } = req.params
            const userId = req.user!.userId
            const { nome, descricao, ordem } = req.body

            // Validar parâmetros
            if (!restauranteId || Array.isArray(restauranteId)) {
                return res.status(400).json({ error: 'ID do restaurante inválido' })
            }

            if (!nome) {
                return res.status(400).json({ error: 'Nome é obrigatório' })
            }

            // Verificar se o restaurante pertence ao usuário
            const restaurante = await prisma.restaurante.findFirst({
                where: {
                    id: restauranteId,
                    proprietarioId: userId
                }
            })

            if (!restaurante) {
                return res.status(404).json({ error: 'Restaurante não encontrado' })
            }

            const categoria = await categoriaService.criar(restauranteId, {
                nome,
                descricao,
                ordem
            })

            res.status(201).json(categoria)
        } catch (error) {
            next(error)
        }
    }

    // Atualizar categoria (dono do restaurante)
    async atualizar(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id, restauranteId } = req.params
            const userId = req.user!.userId
            const { nome, descricao, ordem } = req.body

            // Validar parâmetros
            if (!id || Array.isArray(id)) {
                return res.status(400).json({ error: 'ID inválido' })
            }

            if (!restauranteId || Array.isArray(restauranteId)) {
                return res.status(400).json({ error: 'ID do restaurante inválido' })
            }

            // Verificar se o restaurante pertence ao usuário
            const restaurante = await prisma.restaurante.findFirst({
                where: {
                    id: restauranteId,
                    proprietarioId: userId
                }
            })

            if (!restaurante) {
                return res.status(404).json({ error: 'Restaurante não encontrado' })
            }

            const categoria = await categoriaService.atualizar(id, restauranteId, {
                nome,
                descricao,
                ordem
            })

            res.json(categoria)
        } catch (error) {
            next(error)
        }
    }

    // Deletar categoria (dono do restaurante)
    async deletar(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id, restauranteId } = req.params
            const userId = req.user!.userId

            // Validar parâmetros
            if (!id || Array.isArray(id)) {
                return res.status(400).json({ error: 'ID inválido' })
            }

            if (!restauranteId || Array.isArray(restauranteId)) {
                return res.status(400).json({ error: 'ID do restaurante inválido' })
            }

            // Verificar se o restaurante pertence ao usuário
            const restaurante = await prisma.restaurante.findFirst({
                where: {
                    id: restauranteId,
                    proprietarioId: userId
                }
            })

            if (!restaurante) {
                return res.status(404).json({ error: 'Restaurante não encontrado' })
            }

            const resultado = await categoriaService.deletar(id, restauranteId)
            res.json(resultado)
        } catch (error) {
            next(error)
        }
    }
}