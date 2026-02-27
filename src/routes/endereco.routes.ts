import { Router } from 'express';
import { EnderecoController } from '../controllers/endereco.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const enderecoController = new EnderecoController();

/**
 * @swagger
 * tags:
 *   name: Endereços
 *   description: Gerenciamento de endereços dos usuários (requer autenticação)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     EnderecoInput:
 *       type: object
 *       required:
 *         - cep
 *         - numero
 *       properties:
 *         cep:
 *           type: string
 *           example: "01001000"
 *         numero:
 *           type: string
 *           example: "100"
 *         complemento:
 *           type: string
 *           example: "Apto 101"
 *         isPrincipal:
 *           type: boolean
 *           example: true
 *     
 *     EnderecoResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/EnderecoInput'
 *         - type: object
 *           properties:
 *             id:
 *               type: string
 *               example: "a1111111-1111-1111-1111-111111111111"
 *             userId:
 *               type: string
 *               example: "11111111-1111-1111-1111-111111111111"
 *             logradouro:
 *               type: string
 *               example: "Praça da Sé"
 *             bairro:
 *               type: string
 *               example: "Sé"
 *             cidade:
 *               type: string
 *               example: "São Paulo"
 *             estado:
 *               type: string
 *               example: "SP"
 *             createdAt:
 *               type: string
 *               format: date-time
 *             updatedAt:
 *               type: string
 *               format: date-time
 */

// Todas as rotas de endereço são protegidas (precisa estar logado)
router.use(authMiddleware);

/**
 * @swagger
 * /api/enderecos:
 *   get:
 *     summary: Listar todos os endereços do usuário logado
 *     tags: [Endereços]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de endereços
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/EnderecoResponse'
 *       401:
 *         description: Não autorizado
 */
router.get('/', enderecoController.listar);

/**
 * @swagger
 * /api/enderecos/{id}:
 *   get:
 *     summary: Buscar endereço por ID
 *     tags: [Endereços]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do endereço
 *     responses:
 *       200:
 *         description: Endereço encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EnderecoResponse'
 *       404:
 *         description: Endereço não encontrado
 */
router.get('/:id', enderecoController.buscarPorId);

/**
 * @swagger
 * /api/enderecos:
 *   post:
 *     summary: Criar novo endereço
 *     tags: [Endereços]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EnderecoInput'
 *     responses:
 *       201:
 *         description: Endereço criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EnderecoResponse'
 *       400:
 *         description: Dados inválidos
 */
router.post('/', enderecoController.criar);

/**
 * @swagger
 * /api/enderecos/{id}:
 *   put:
 *     summary: Atualizar endereço
 *     tags: [Endereços]
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
 *               numero:
 *                 type: string
 *               complemento:
 *                 type: string
 *               isPrincipal:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Endereço atualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EnderecoResponse'
 *       404:
 *         description: Endereço não encontrado
 */
router.put('/:id', enderecoController.atualizar);

/**
 * @swagger
 * /api/enderecos/{id}:
 *   delete:
 *     summary: Deletar endereço
 *     tags: [Endereços]
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
 *         description: Endereço removido com sucesso
 *       404:
 *         description: Endereço não encontrado
 */
router.delete('/:id', enderecoController.deletar);

/**
 * @swagger
 * /api/enderecos/{id}/principal:
 *   patch:
 *     summary: Definir endereço como principal
 *     tags: [Endereços]
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
 *         description: Endereço definido como principal
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EnderecoResponse'
 *       404:
 *         description: Endereço não encontrado
 */
router.patch('/:id/principal', enderecoController.definirComoPrincipal);

export default router;