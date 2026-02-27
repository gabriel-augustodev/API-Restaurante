import { Router } from 'express';
import { UploadController } from '../controllers/upload.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';
import { uploadRestaurante, uploadProduto, uploadPerfil } from '../config/cloudinary';

const router = Router();
const uploadController = new UploadController();

// Todas as rotas de upload exigem autenticação
router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Upload
 *   description: Upload de imagens
 */

/**
 * @swagger
 * /api/upload/restaurante/{restauranteId}:
 *   post:
 *     summary: Upload de imagem para restaurante
 *     tags: [Upload]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               imagem:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Imagem enviada com sucesso
 *       400:
 *         description: Nenhuma imagem enviada
 *       403:
 *         description: Acesso negado
 */
router.post('/restaurante/:restauranteId',
    roleMiddleware(['DONO_RESTAURANTE', 'ADMIN']),
    uploadRestaurante.single('imagem'),
    uploadController.uploadRestaurante
);

/**
 * @swagger
 * /api/upload/produto/{restauranteId}/{produtoId}:
 *   post:
 *     summary: Upload de imagem para produto
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: restauranteId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: produtoId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               imagem:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Imagem enviada com sucesso
 *       400:
 *         description: Nenhuma imagem enviada
 *       403:
 *         description: Acesso negado
 */
router.post('/produto/:restauranteId/:produtoId',
    roleMiddleware(['DONO_RESTAURANTE', 'ADMIN']),
    uploadProduto.single('imagem'),
    uploadController.uploadProduto
);

/**
 * @swagger
 * /api/upload/perfil:
 *   post:
 *     summary: Upload de foto de perfil
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               imagem:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Imagem enviada com sucesso
 *       400:
 *         description: Nenhuma imagem enviada
 */
router.post('/perfil',
    uploadPerfil.single('imagem'),
    uploadController.uploadPerfil
);

export default router;