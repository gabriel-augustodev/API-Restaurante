import { Router } from 'express';
import { PedidoController } from '../controllers/pedido.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const pedidoController = new PedidoController();

/**
 * @swagger
 * tags:
 *   name: Pedidos
 *   description: Gerenciamento de pedidos
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ItemPedidoInput:
 *       type: object
 *       required:
 *         - produtoId
 *         - quantidade
 *       properties:
 *         produtoId:
 *           type: string
 *         quantidade:
 *           type: integer
 *           minimum: 1
 *         observacoes:
 *           type: string
 *           example: "Sem cebola"
 *     
 *     PedidoInput:
 *       type: object
 *       required:
 *         - restauranteId
 *         - enderecoEntregaId
 *         - itens
 *       properties:
 *         restauranteId:
 *           type: string
 *         enderecoEntregaId:
 *           type: string
 *         itens:
 *           type: array
 *           minItems: 1
 *           items:
 *             $ref: '#/components/schemas/ItemPedidoInput'
 *         observacoes:
 *           type: string
 *     
 *     ItemPedidoResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         quantidade:
 *           type: integer
 *         precoUnitario:
 *           type: number
 *         observacoes:
 *           type: string
 *         produto:
 *           $ref: '#/components/schemas/ProdutoResponse'
 *     
 *     PedidoResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         cliente:
 *           $ref: '#/components/schemas/User'
 *         restaurante:
 *           $ref: '#/components/schemas/RestauranteResponse'
 *         enderecoEntrega:
 *           $ref: '#/components/schemas/EnderecoResponse'
 *         itens:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ItemPedidoResponse'
 *         subtotal:
 *           type: number
 *         taxaEntrega:
 *           type: number
 *         total:
 *           type: number
 *         status:
 *           type: string
 *           enum: [AGUARDANDO_RESTAURANTE, CONFIRMADO, EM_PREPARO, PRONTO, SAIU_PARA_ENTREGA, ENTREGUE, CANCELADO]
 *         createdAt:
 *           type: string
 *           format: date-time
 */

// Todas as rotas de pedidos exigem autenticação
router.use(authMiddleware);

/**
 * @swagger
 * /api/pedidos/meus:
 *   get:
 *     summary: Listar meus pedidos (cliente)
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de pedidos do cliente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PedidoResponse'
 */
router.get('/meus', pedidoController.meusPedidos);

/**
 * @swagger
 * /api/pedidos:
 *   post:
 *     summary: Criar novo pedido
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PedidoInput'
 *     responses:
 *       201:
 *         description: Pedido criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PedidoResponse'
 *       400:
 *         description: Dados inválidos
 */
router.post('/', pedidoController.criar);

/**
 * @swagger
 * /api/pedidos/{id}:
 *   get:
 *     summary: Buscar pedido por ID
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pedido encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PedidoResponse'
 *       404:
 *         description: Pedido não encontrado
 */
router.get('/:id', pedidoController.buscarPorId);

/**
 * @swagger
 * /api/pedidos/{id}/cancelar:
 *   patch:
 *     summary: Cancelar pedido (cliente)
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pedido cancelado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PedidoResponse'
 *       400:
 *         description: Não é possível cancelar
 *       404:
 *         description: Pedido não encontrado
 */
router.patch('/:id/cancelar', pedidoController.cancelarPedido);

/**
 * @swagger
 * /api/pedidos/restaurante/{restauranteId}:
 *   get:
 *     summary: Listar pedidos do restaurante (dono)
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: restauranteId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [AGUARDANDO_RESTAURANTE, CONFIRMADO, EM_PREPARO, PRONTO, SAIU_PARA_ENTREGA, ENTREGUE, CANCELADO]
 *     responses:
 *       200:
 *         description: Lista de pedidos do restaurante
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PedidoResponse'
 */
router.get('/restaurante/:restauranteId',
    roleMiddleware(['DONO_RESTAURANTE', 'ADMIN']),
    pedidoController.pedidosDoRestaurante
);

/**
 * @swagger
 * /api/pedidos/{id}/restaurante/{restauranteId}/status:
 *   patch:
 *     summary: Atualizar status do pedido (dono)
 *     tags: [Pedidos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: restauranteId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [CONFIRMADO, EM_PREPARO, PRONTO, SAIU_PARA_ENTREGA, ENTREGUE]
 *     responses:
 *       200:
 *         description: Status atualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PedidoResponse'
 *       400:
 *         description: Transição de status inválida
 *       404:
 *         description: Pedido não encontrado
 */
router.patch('/:id/restaurante/:restauranteId/status',
    roleMiddleware(['DONO_RESTAURANTE', 'ADMIN']),
    pedidoController.atualizarStatus
);

export default router;