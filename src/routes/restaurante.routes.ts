import { Router } from 'express';
import { RestauranteController } from '../controllers/restaurante.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const restauranteController = new RestauranteController();

/**
 * @swagger
 * tags:
 *   name: Restaurantes
 *   description: Gerenciamento de restaurantes
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     DiasFuncionamento:
 *       type: object
 *       properties:
 *         diaSemana:
 *           type: string
 *           enum: [SEGUNDA, TERCA, QUARTA, QUINTA, SEXTA, SABADO, DOMINGO]
 *         aberto:
 *           type: boolean
 *         horarioAbre:
 *           type: string
 *           example: "10:00"
 *         horarioFecha:
 *           type: string
 *           example: "22:00"
 *     
 *     RestauranteInput:
 *       type: object
 *       required:
 *         - nome
 *         - cnpj
 *         - telefone
 *         - email
 *         - enderecoId
 *       properties:
 *         nome:
 *           type: string
 *           example: "Pizzaria do Carlos"
 *         descricao:
 *           type: string
 *           example: "A melhor pizza da cidade"
 *         cnpj:
 *           type: string
 *           example: "12345678000199"
 *         telefone:
 *           type: string
 *           example: "1133334444"
 *         email:
 *           type: string
 *           example: "contato@pizzaria.com"
 *         enderecoId:
 *           type: string
 *         horarioAbertura:
 *           type: string
 *           example: "18:00"
 *         horarioFechamento:
 *           type: string
 *           example: "23:59"
 *         taxaEntrega:
 *           type: number
 *           example: 8.50
 *         tempoMedioEntrega:
 *           type: integer
 *           example: 45
 *         diasFuncionamento:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/DiasFuncionamento'
 *     
 *     RestauranteResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/RestauranteInput'
 *         - type: object
 *           properties:
 *             id:
 *               type: string
 *             proprietarioId:
 *               type: string
 *             ativo:
 *               type: boolean
 *             endereco:
 *               $ref: '#/components/schemas/EnderecoResponse'
 *             createdAt:
 *               type: string
 *               format: date-time
 */

/**
 * @swagger
 * /api/restaurantes/publicos:
 *   get:
 *     summary: Listar restaurantes ativos (público)
 *     tags: [Restaurantes]
 *     parameters:
 *       - in: query
 *         name: busca
 *         schema:
 *           type: string
 *         description: Termo para buscar no nome ou descrição
 *     responses:
 *       200:
 *         description: Lista de restaurantes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RestauranteResponse'
 */
router.get('/publicos', restauranteController.listarPublico);

/**
 * @swagger
 * /api/restaurantes/publicos/{id}:
 *   get:
 *     summary: Buscar restaurante por ID (público)
 *     tags: [Restaurantes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Restaurante encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RestauranteResponse'
 *       404:
 *         description: Restaurante não encontrado
 */
router.get('/publicos/:id', restauranteController.buscarPorId);

// Rotas protegidas
router.use(authMiddleware);

/**
 * @swagger
 * /api/restaurantes/meus:
 *   get:
 *     summary: Listar restaurantes do proprietário logado
 *     tags: [Restaurantes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista dos seus restaurantes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RestauranteResponse'
 */
router.get('/meus', restauranteController.meusRestaurantes);

/**
 * @swagger
 * /api/restaurantes:
 *   post:
 *     summary: Criar novo restaurante (apenas DONO_RESTAURANTE)
 *     tags: [Restaurantes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RestauranteInput'
 *     responses:
 *       201:
 *         description: Restaurante criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RestauranteResponse'
 *       400:
 *         description: Dados inválidos
 *       403:
 *         description: Acesso negado
 */
router.post('/',
    roleMiddleware(['DONO_RESTAURANTE', 'ADMIN']),
    restauranteController.criar
);

/**
 * @swagger
 * /api/restaurantes/{id}:
 *   put:
 *     summary: Atualizar restaurante
 *     tags: [Restaurantes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               descricao:
 *                 type: string
 *               telefone:
 *                 type: string
 *               horarioAbertura:
 *                 type: string
 *               horarioFechamento:
 *                 type: string
 *               taxaEntrega:
 *                 type: number
 *               imagemUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Restaurante atualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RestauranteResponse'
 *       404:
 *         description: Restaurante não encontrado
 */
router.put('/:id', restauranteController.atualizar);

/**
 * @swagger
 * /api/restaurantes/{id}:
 *   delete:
 *     summary: Desativar restaurante (soft delete)
 *     tags: [Restaurantes]
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
 *         description: Restaurante desativado com sucesso
 *       404:
 *         description: Restaurante não encontrado
 */
router.delete('/:id', restauranteController.deletar);

export default router;