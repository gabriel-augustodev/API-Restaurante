import { Router } from 'express';
import express from 'express';
import { StripeController } from '../controllers/stripe.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const stripeController = new StripeController();

/**
 * @swagger
 * tags:
 *   name: Pagamentos
 *   description: Integração com Stripe
 */

// ⚠️ CRÍTICO: O webhook PRECISA do raw body, então aplicamos express.raw AQUI
router.post(
    '/webhook',
    express.raw({ type: 'application/json' }),
    stripeController.webhook
);

// Rotas protegidas (usam JSON normal)
router.use(authMiddleware);
router.post('/checkout/:pedidoId', stripeController.criarCheckout);
router.post('/checkout/:sessionId/cancelar', stripeController.cancelarCheckout);

export default router;