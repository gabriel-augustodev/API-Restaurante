import { Router } from 'express';
import { CepController } from '../controllers/cep.controller';

const router = Router();
const cepController = new CepController();

/**
 * @swagger
 * tags:
 *   name: CEP
 *   description: Busca de endereços por CEP
 */

/**
 * @swagger
 * /api/cep/{cep}:
 *   get:
 *     summary: Buscar endereço por CEP
 *     tags: [CEP]
 *     parameters:
 *       - in: path
 *         name: cep
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^\d{8}$'
 *         description: CEP sem traços (apenas números)
 *         example: 01001000
 *     responses:
 *       200:
 *         description: Endereço encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cep:
 *                   type: string
 *                 logradouro:
 *                   type: string
 *                 bairro:
 *                   type: string
 *                 cidade:
 *                   type: string
 *                 estado:
 *                   type: string
 *                 fromCache:
 *                   type: boolean
 *       400:
 *         description: CEP inválido
 *       404:
 *         description: CEP não encontrado
 */
router.get('/:cep', cepController.buscarCep);

export default router;