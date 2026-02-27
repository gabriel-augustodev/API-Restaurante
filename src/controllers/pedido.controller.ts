import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middlewares/auth.middleware'
import { PedidoService } from '../services/pedido.service'
import { StatusPedido } from '@prisma/client'

const pedidoService = new PedidoService()

export class PedidoController {
    // Listar pedidos do cliente logado
    async meusPedidos(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const clienteId = req.user!.userId
            const pedidos = await pedidoService.listarPorCliente(clienteId)
            res.json(pedidos)
        } catch (error) {
            next(error)
        }
    }

    // Listar pedidos de um restaurante (dono)
    async pedidosDoRestaurante(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { restauranteId } = req.params
            const { status } = req.query
            const proprietarioId = req.user!.userId

            if (!restauranteId || Array.isArray(restauranteId)) {
                return res.status(400).json({ error: 'ID do restaurante inválido' })
            }

            let statusFilter: StatusPedido | undefined = undefined
            if (status && !Array.isArray(status)) {
                statusFilter = status as StatusPedido
            }

            const pedidos = await pedidoService.listarPorRestaurante(
                restauranteId,
                proprietarioId,
                statusFilter
            )
            res.json(pedidos)
        } catch (error) {
            next(error)
        }
    }

    // Buscar pedido por ID
    async buscarPorId(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params
            const usuarioId = req.user!.userId
            const role = req.user!.role

            if (!id || Array.isArray(id)) {
                return res.status(400).json({ error: 'ID inválido' })
            }

            const pedido = await pedidoService.buscarPorId(id, usuarioId, role)
            res.json(pedido)
        } catch (error) {
            next(error)
        }
    }

    // Criar novo pedido
    async criar(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const clienteId = req.user!.userId
            const { restauranteId, enderecoEntregaId, itens, observacoes } = req.body

            // Validações básicas
            if (!restauranteId || !enderecoEntregaId || !itens || !Array.isArray(itens) || itens.length === 0) {
                return res.status(400).json({
                    error: 'Restaurante, endereço de entrega e itens são obrigatórios'
                })
            }

            // Validar itens
            for (const item of itens) {
                if (!item.produtoId || !item.quantidade || item.quantidade <= 0) {
                    return res.status(400).json({
                        error: 'Cada item deve ter produtoId e quantidade positiva'
                    })
                }
            }

            const pedido = await pedidoService.criar(clienteId, {
                restauranteId,
                enderecoEntregaId,
                itens,
                observacoes
            })

            res.status(201).json(pedido)
        } catch (error) {
            next(error)
        }
    }

    // Atualizar status do pedido (dono do restaurante)
    async atualizarStatus(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id, restauranteId } = req.params
            const { status } = req.body
            const proprietarioId = req.user!.userId

            if (!id || Array.isArray(id)) {
                return res.status(400).json({ error: 'ID do pedido inválido' })
            }

            if (!restauranteId || Array.isArray(restauranteId)) {
                return res.status(400).json({ error: 'ID do restaurante inválido' })
            }

            if (!status || !Object.values(StatusPedido).includes(status)) {
                return res.status(400).json({ error: 'Status inválido' })
            }

            const pedido = await pedidoService.atualizarStatus(
                id,
                restauranteId,
                proprietarioId,
                status
            )
            res.json(pedido)
        } catch (error) {
            next(error)
        }
    }

    // Cancelar pedido (cliente)
    async cancelarPedido(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params
            const clienteId = req.user!.userId

            if (!id || Array.isArray(id)) {
                return res.status(400).json({ error: 'ID inválido' })
            }

            const pedido = await pedidoService.cancelarPedido(id, clienteId)
            res.json(pedido)
        } catch (error) {
            next(error)
        }
    }
}