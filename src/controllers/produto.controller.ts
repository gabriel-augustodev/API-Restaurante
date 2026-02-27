import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middlewares/auth.middleware'
import { ProdutoService } from '../services/produto.service'
import { prisma } from '../server'

const produtoService = new ProdutoService()

export class ProdutoController {
    // Listar produtos de um restaurante (público)
    async listarPublico(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { restauranteId } = req.params
            const { categoriaId, destaques } = req.query

            // Validar restauranteId
            if (!restauranteId || Array.isArray(restauranteId)) {
                return res.status(400).json({ error: 'ID do restaurante inválido' })
            }

            // Tratar query params
            let categoriaIdFilter: string | undefined = undefined
            if (categoriaId && !Array.isArray(categoriaId)) {
                categoriaIdFilter = categoriaId as string
            }

            const produtos = await produtoService.listarPorRestaurante(restauranteId, {
                categoriaId: categoriaIdFilter,
                apenasDestaques: destaques === 'true',
                disponivel: true
            })

            res.json(produtos)
        } catch (error) {
            next(error)
        }
    }

    // Listar produtos do meu restaurante (dono)
    async listarMeus(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { restauranteId } = req.params
            const userId = req.user!.userId
            const { categoriaId, apenasDestaques, disponivel } = req.query

            // Validar restauranteId
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

            // Tratar query params
            let categoriaIdFilter: string | undefined = undefined
            if (categoriaId && !Array.isArray(categoriaId)) {
                categoriaIdFilter = categoriaId as string
            }

            let disponivelFilter: boolean | undefined = undefined
            if (disponivel === 'true') {
                disponivelFilter = true
            } else if (disponivel === 'false') {
                disponivelFilter = false
            }

            const produtos = await produtoService.listarPorRestaurante(restauranteId, {
                categoriaId: categoriaIdFilter,
                apenasDestaques: apenasDestaques === 'true',
                disponivel: disponivelFilter
            })

            res.json(produtos)
        } catch (error) {
            next(error)
        }
    }

    // Buscar produto por ID (público)
    async buscarPorIdPublico(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id, restauranteId } = req.params

            // Validar parâmetros
            if (!id || Array.isArray(id)) {
                return res.status(400).json({ error: 'ID inválido' })
            }

            if (!restauranteId || Array.isArray(restauranteId)) {
                return res.status(400).json({ error: 'ID do restaurante inválido' })
            }

            const produto = await produtoService.buscarPorId(id, restauranteId)
            res.json(produto)
        } catch (error) {
            next(error)
        }
    }

    // Criar produto (dono do restaurante)
    async criar(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { restauranteId } = req.params
            const userId = req.user!.userId
            const { nome, descricao, preco, categoriaId, disponivel, destaque, imagemUrl, tempoPreparo, ingredientes } = req.body

            // Validar restauranteId
            if (!restauranteId || Array.isArray(restauranteId)) {
                return res.status(400).json({ error: 'ID do restaurante inválido' })
            }

            // Validar campos obrigatórios
            if (!nome || !preco) {
                return res.status(400).json({ error: 'Nome e preço são obrigatórios' })
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

            const produto = await produtoService.criar(restauranteId, {
                nome,
                descricao,
                preco: Number(preco),
                categoriaId,
                disponivel,
                destaque,
                imagemUrl,
                tempoPreparo: tempoPreparo ? Number(tempoPreparo) : undefined,
                ingredientes
            })

            res.status(201).json(produto)
        } catch (error) {
            next(error)
        }
    }

    // Atualizar produto (dono do restaurante)
    async atualizar(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id, restauranteId } = req.params
            const userId = req.user!.userId
            const { nome, descricao, preco, categoriaId, disponivel, destaque, imagemUrl, tempoPreparo, ingredientes } = req.body

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

            const produto = await produtoService.atualizar(id, restauranteId, {
                nome,
                descricao,
                preco: preco ? Number(preco) : undefined,
                categoriaId: categoriaId === null ? null : categoriaId,
                disponivel,
                destaque,
                imagemUrl,
                tempoPreparo: tempoPreparo ? Number(tempoPreparo) : undefined,
                ingredientes
            })

            res.json(produto)
        } catch (error) {
            next(error)
        }
    }

    // Deletar produto (dono do restaurante)
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

            const resultado = await produtoService.deletar(id, restauranteId)
            res.json(resultado)
        } catch (error) {
            next(error)
        }
    }

    // Alternar disponibilidade
    async toggleDisponibilidade(req: AuthRequest, res: Response, next: NextFunction) {
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

            const produto = await produtoService.toggleDisponibilidade(id, restauranteId)
            res.json(produto)
        } catch (error) {
            next(error)
        }
    }

    // Alternar destaque
    async toggleDestaque(req: AuthRequest, res: Response, next: NextFunction) {
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

            const produto = await produtoService.toggleDestaque(id, restauranteId)
            res.json(produto)
        } catch (error) {
            next(error)
        }
    }
}