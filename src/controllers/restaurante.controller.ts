import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middlewares/auth.middleware'
import { RestauranteService } from '../services/restaurante.service'

const restauranteService = new RestauranteService()

export class RestauranteController {
    // Listar restaurantes públicos (qualquer um pode ver)
    async listarPublico(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { busca } = req.query

            // Garantir que busca é string (se existir)
            const buscaString = Array.isArray(busca) ? busca[0] : busca

            const restaurantes = await restauranteService.listar({
                ativo: true,
                busca: buscaString as string | undefined
            })
            res.json(restaurantes)
        } catch (error) {
            next(error)
        }
    }

    // Buscar restaurante por ID (público)
    async buscarPorId(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params

            // Validar se o ID é uma string e não é array
            if (!id || Array.isArray(id)) {
                return res.status(400).json({ error: 'ID inválido' })
            }

            const restaurante = await restauranteService.buscarPorId(id)
            res.json(restaurante)
        } catch (error) {
            next(error)
        }
    }

    // Listar restaurantes do proprietário logado
    async meusRestaurantes(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const proprietarioId = req.user!.userId
            const restaurantes = await restauranteService.listarPorProprietario(proprietarioId)
            res.json(restaurantes)
        } catch (error) {
            next(error)
        }
    }

    // Criar restaurante (apenas DONO_RESTAURANTE ou ADMIN)
    async criar(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const proprietarioId = req.user!.userId
            const data = req.body

            // Validações básicas
            if (!data.nome || !data.cnpj || !data.telefone || !data.email || !data.enderecoId) {
                return res.status(400).json({
                    error: 'Nome, CNPJ, telefone, email e enderecoId são obrigatórios'
                })
            }

            // Garantir que enderecoId é string
            if (Array.isArray(data.enderecoId)) {
                return res.status(400).json({ error: 'enderecoId inválido' })
            }

            const restaurante = await restauranteService.criar(proprietarioId, data)
            res.status(201).json(restaurante)
        } catch (error) {
            next(error)
        }
    }

    // Atualizar restaurante (apenas dono ou admin)
    async atualizar(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params
            const proprietarioId = req.user!.userId
            const data = req.body

            // Validar ID
            if (!id || Array.isArray(id)) {
                return res.status(400).json({ error: 'ID inválido' })
            }

            const restaurante = await restauranteService.atualizar(id, proprietarioId, data)
            res.json(restaurante)
        } catch (error) {
            next(error)
        }
    }

    // Deletar/Desativar restaurante (apenas dono ou admin)
    async deletar(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params
            const proprietarioId = req.user!.userId

            // Validar ID
            if (!id || Array.isArray(id)) {
                return res.status(400).json({ error: 'ID inválido' })
            }

            await restauranteService.deletar(id, proprietarioId)
            res.json({ message: 'Restaurante desativado com sucesso' })
        } catch (error) {
            next(error)
        }
    }
}