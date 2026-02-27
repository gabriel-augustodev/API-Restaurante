import { Router } from 'express';
import { ProdutoController } from '../controllers/produto.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';

const router = Router({ mergeParams: true });
const produtoController = new ProdutoController();

/**
 * @swagger
 * tags:
 *   name: Produtos
 *   description: Gerenciamento de produtos do cardápio
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ProdutoInput:
 *       type: object
 *       required:
 *         - nome
 *         - preco
 *       properties:
 *         nome:
 *           type: string
 *           example: "Pizza Calabresa"
 *         descricao:
 *           type: string
 *           example: "Molho, mussarela, calabresa, cebola"
 *         preco:
 *           type: number
 *           example: 49.90
 *         categoriaId:
 *           type: string
 *         disponivel:
 *           type: boolean
 *           default: true
 *         destaque:
 *           type: boolean
 *           default: false
 *         imagemUrl:
 *           type: string
 *         tempoPreparo:
 *           type: integer
 *           example: 30
 *         ingredientes:
 *           type: string
 *           example: "Molho de tomate, mussarela, calabresa, cebola"
 *     
 *     ProdutoResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/ProdutoInput'
 *         - type: object
 *           properties:
 *             id:
 *               type: string
 *             restauranteId:
 *               type: string
 *             categoria:
 *               $ref: '#/components/schemas/CategoriaResponse'
 *             createdAt:
 *               type: string
 *               format: date-time
 */

/**
 * @swagger
 * /api/restaurantes/{restauranteId}/produtos:
 *   get:
 *     summary: Listar produtos de um restaurante (público)
 *     tags: [Produtos]
 *     parameters:
 *       - in: path
 *         name: restauranteId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: categoriaId
 *         schema:
 *           type: string
 *       - in: query
 *         name: destaques
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Lista de produtos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProdutoResponse'
 */
router.get('/', produtoController.listarPublico);

/**
 * @swagger
 * /api/restaurantes/{restauranteId}/produtos/{id}:
 *   get:
 *     summary: Buscar produto por ID (público)
 *     tags: [Produtos]
 *     parameters:
 *       - in: path
 *         name: restauranteId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Produto encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProdutoResponse'
 *       404:
 *         description: Produto não encontrado
 */
router.get('/:id', produtoController.buscarPorIdPublico);

// Rotas protegidas
router.use(authMiddleware);
router.use(roleMiddleware(['DONO_RESTAURANTE', 'ADMIN']));

/**
 * @swagger
 * /api/restaurantes/{restauranteId}/produtos/meus/listar:
 *   get:
 *     summary: Listar produtos do meu restaurante (dono)
 *     tags: [Produtos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: restauranteId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: categoriaId
 *         schema:
 *           type: string
 *       - in: query
 *         name: disponivel
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: apenasDestaques
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Lista de produtos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProdutoResponse'
 */
router.get('/meus/listar', produtoController.listarMeus);

/**
 * @swagger
 * /api/restaurantes/{restauranteId}/produtos:
 *   post:
 *     summary: Criar novo produto
 *     tags: [Produtos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *             $ref: '#/components/schemas/ProdutoInput'
 *     responses:
 *       201:
 *         description: Produto criado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProdutoResponse'
 *       400:
 *         description: Dados inválidos
 */
router.post('/', produtoController.criar);

/**
 * @swagger
 * /api/restaurantes/{restauranteId}/produtos/{id}:
 *   put:
 *     summary: Atualizar produto
 *     tags: [Produtos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: restauranteId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProdutoInput'
 *     responses:
 *       200:
 *         description: Produto atualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProdutoResponse'
 *       404:
 *         description: Produto não encontrado
 */
router.put('/:id', produtoController.atualizar);

/**
 * @swagger
 * /api/restaurantes/{restauranteId}/produtos/{id}:
 *   delete:
 *     summary: Deletar produto
 *     tags: [Produtos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: restauranteId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Produto removido com sucesso
 *       404:
 *         description: Produto não encontrado
 */
router.delete('/:id', produtoController.deletar);

/**
 * @swagger
 * /api/restaurantes/{restauranteId}/produtos/{id}/disponibilidade:
 *   patch:
 *     summary: Alternar disponibilidade do produto
 *     tags: [Produtos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: restauranteId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Disponibilidade alterada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProdutoResponse'
 *       404:
 *         description: Produto não encontrado
 */
router.patch('/:id/disponibilidade', produtoController.toggleDisponibilidade);

/**
 * @swagger
 * /api/restaurantes/{restauranteId}/produtos/{id}/destaque:
 *   patch:
 *     summary: Alternar destaque do produto
 *     tags: [Produtos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: restauranteId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Destaque alterado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProdutoResponse'
 *       404:
 *         description: Produto não encontrado
 */
router.patch('/:id/destaque', produtoController.toggleDestaque);

export default router;