import { Router } from 'express';
import { CategoriaController } from '../controllers/categoria.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';

const router = Router({ mergeParams: true });
const categoriaController = new CategoriaController();

/**
 * @swagger
 * tags:
 *   name: Categorias
 *   description: Gerenciamento de categorias de produtos
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CategoriaInput:
 *       type: object
 *       required:
 *         - nome
 *       properties:
 *         nome:
 *           type: string
 *           example: "Pizzas Salgadas"
 *         descricao:
 *           type: string
 *           example: "Pizzas tradicionais e especiais"
 *         ordem:
 *           type: integer
 *           example: 1
 *     
 *     CategoriaResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/CategoriaInput'
 *         - type: object
 *           properties:
 *             id:
 *               type: string
 *             restauranteId:
 *               type: string
 *             produtos:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ProdutoResponse'
 *             createdAt:
 *               type: string
 *               format: date-time
 */

/**
 * @swagger
 * /api/restaurantes/{restauranteId}/categorias:
 *   get:
 *     summary: Listar categorias de um restaurante (público)
 *     tags: [Categorias]
 *     parameters:
 *       - in: path
 *         name: restauranteId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de categorias
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CategoriaResponse'
 */
router.get('/', categoriaController.listarPublico);

/**
 * @swagger
 * /api/restaurantes/{restauranteId}/categorias/{id}:
 *   get:
 *     summary: Buscar categoria por ID (público)
 *     tags: [Categorias]
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
 *         description: Categoria encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoriaResponse'
 *       404:
 *         description: Categoria não encontrada
 */
router.get('/:id', categoriaController.buscarPorIdPublico);

// Rotas protegidas
router.use(authMiddleware);
router.use(roleMiddleware(['DONO_RESTAURANTE', 'ADMIN']));

/**
 * @swagger
 * /api/restaurantes/{restauranteId}/categorias/minhas/listar:
 *   get:
 *     summary: Listar categorias do meu restaurante (dono)
 *     tags: [Categorias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: restauranteId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de categorias
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CategoriaResponse'
 */
router.get('/minhas/listar', categoriaController.listarMinhas);

/**
 * @swagger
 * /api/restaurantes/{restauranteId}/categorias:
 *   post:
 *     summary: Criar nova categoria
 *     tags: [Categorias]
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
 *             $ref: '#/components/schemas/CategoriaInput'
 *     responses:
 *       201:
 *         description: Categoria criada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoriaResponse'
 *       400:
 *         description: Dados inválidos
 */
router.post('/', categoriaController.criar);

/**
 * @swagger
 * /api/restaurantes/{restauranteId}/categorias/{id}:
 *   put:
 *     summary: Atualizar categoria
 *     tags: [Categorias]
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
 *             $ref: '#/components/schemas/CategoriaInput'
 *     responses:
 *       200:
 *         description: Categoria atualizada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoriaResponse'
 *       404:
 *         description: Categoria não encontrada
 */
router.put('/:id', categoriaController.atualizar);

/**
 * @swagger
 * /api/restaurantes/{restauranteId}/categorias/{id}:
 *   delete:
 *     summary: Deletar categoria
 *     tags: [Categorias]
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
 *         description: Categoria removida com sucesso
 *       400:
 *         description: Categoria possui produtos
 *       404:
 *         description: Categoria não encontrada
 */
router.delete('/:id', categoriaController.deletar);

export default router;