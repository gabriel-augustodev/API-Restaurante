import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { StripeService } from '../services/stripe.service';

const stripeService = new StripeService();

export class StripeController {
    /**
     * Criar sessão de checkout para um pedido
     */
    async criarCheckout(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { pedidoId } = req.params;
            const clienteId = req.user!.userId;

            // Validar ID
            if (!pedidoId || Array.isArray(pedidoId)) {
                return res.status(400).json({ error: 'ID do pedido inválido' });
            }

            const resultado = await stripeService.criarCheckoutSession(pedidoId, clienteId);

            res.json(resultado);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Webhook para receber notificações do Stripe
     * ATENÇÃO: Esta rota NÃO pode usar authMiddleware
     */
    async webhook(req: Request, res: Response, next: NextFunction) {
        console.log('\n📥 ===== WEBHOOK RECEBIDO NO CONTROLLER =====');
        console.log('📅 Timestamp:', new Date().toISOString());
        console.log('Headers:', Object.keys(req.headers).join(', '));

        try {
            const signature = req.headers['stripe-signature'] as string;

            if (!signature) {
                console.log('❌ Signature não encontrada');
                return res.status(400).send('Missing stripe-signature header');
            }

            console.log('✅ Signature encontrada, processando...');
            const result = await stripeService.processarWebhook(req.body, signature);

            console.log('✅ Webhook processado com sucesso!');
            res.json(result);
        } catch (error) {
            console.error('❌ Erro no webhook:', error);
            next(error);
        }
    }

    /**
     * Cancelar uma sessão de checkout (opcional)
     */
    async cancelarCheckout(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { sessionId } = req.params;

            if (!sessionId || Array.isArray(sessionId)) {
                return res.status(400).json({ error: 'ID da sessão inválido' });
            }

            // Implementar lógica de cancelamento se necessário
            res.json({ message: 'Checkout cancelado' });
        } catch (error) {
            next(error);
        }
    }
}