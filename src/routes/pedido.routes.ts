import { Router } from 'express'
import { PedidoController } from '../controllers/pedido.controller'
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware'

const router = Router()
const pedidoController = new PedidoController()

// Todas as rotas de pedidos exigem autenticação
router.use(authMiddleware)

// Rotas para clientes
router.get('/meus', pedidoController.meusPedidos)
router.post('/', pedidoController.criar)
router.get('/:id', pedidoController.buscarPorId)
router.patch('/:id/cancelar', pedidoController.cancelarPedido)

// Rotas para donos de restaurante
router.get('/restaurante/:restauranteId',
    roleMiddleware(['DONO_RESTAURANTE', 'ADMIN']),
    pedidoController.pedidosDoRestaurante
)
router.patch('/:id/restaurante/:restauranteId/status',
    roleMiddleware(['DONO_RESTAURANTE', 'ADMIN']),
    pedidoController.atualizarStatus
)

export default router