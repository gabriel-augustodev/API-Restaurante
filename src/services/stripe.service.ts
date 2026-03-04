import { stripe } from '../config/stripe';
import { prisma } from '../server';

export class StripeService {
    /**
     * Criar uma sessão de checkout para um pedido
     */
    async criarCheckoutSession(pedidoId: string, clienteId: string) {
        try {
            // Buscar o pedido com seus itens
            const pedido = await prisma.pedido.findUnique({
                where: { id: pedidoId },
                include: {
                    itens: {
                        include: {
                            produto: true
                        }
                    },
                    cliente: true,
                    restaurante: true
                }
            });

            if (!pedido) {
                throw new Error('Pedido não encontrado');
            }

            // Verificar se o pedido pertence ao cliente
            if (pedido.clienteId !== clienteId) {
                throw new Error('Este pedido não pertence ao cliente informado');
            }

            // Stripe trabalha com centavos (menor unidade)
            const valorEmCentavos = Math.round(pedido.total * 100);

            // Criar os line items baseado nos itens do pedido
            const lineItems = pedido.itens.map(item => ({
                price_data: {
                    currency: 'brl',
                    product_data: {
                        name: item.produto.nome,
                        description: item.produto.descricao || undefined, // ✅ description sempre presente
                    },
                    unit_amount: Math.round(item.precoUnitario * 100), // Preço unitário em centavos
                },
                quantity: item.quantidade,
            }));

            // Adicionar taxa de entrega como um item separado
            if (pedido.taxaEntrega > 0) {
                lineItems.push({
                    price_data: {
                        currency: 'brl',
                        product_data: {
                            name: 'Taxa de entrega',
                            description: 'Taxa de entrega do pedido', // ✅ description fornecida
                        },
                        unit_amount: Math.round(pedido.taxaEntrega * 100),
                    },
                    quantity: 1,
                });
            }

            // Criar sessão de checkout no Stripe
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: lineItems,
                mode: 'payment',
                success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pedidos/${pedidoId}/sucesso?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/carrinho`,
                metadata: {
                    pedidoId: pedido.id,
                    clienteId: pedido.clienteId,
                    restauranteId: pedido.restauranteId
                },
                customer_email: pedido.cliente?.email,
            });

            // Aqui você pode salvar o sessionId no pedido se quiser
            // await prisma.pedido.update({
            //   where: { id: pedidoId },
            //   data: { stripeSessionId: session.id }
            // });

            return {
                sessionId: session.id,
                url: session.url,
            };

        } catch (error) {
            // Tratamento seguro para erro do tipo 'unknown'
            if (error instanceof Error) {
                console.error('❌ Erro ao criar sessão Stripe:', error.message);
                throw new Error(`Falha ao criar pagamento: ${error.message}`);
            } else {
                console.error('❌ Erro desconhecido ao criar sessão Stripe:', error);
                throw new Error('Falha ao criar pagamento: Erro desconhecido');
            }
        }
    }

    /**
     * Processar webhook do Stripe
     */
    async processarWebhook(rawBody: string | Buffer, signature: string) {
        console.log('\n🔄 ===== PROCESSAHNDO WEBHOOK NO SERVICE =====');

        try {
            const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

            if (!webhookSecret) {
                console.error('❌ Webhook secret não configurado no .env');
                throw new Error('Webhook secret não configurado');
            }

            console.log('🔐 Verificando assinatura...');
            console.log('   - Secret (primeiros 10 chars):', webhookSecret.substring(0, 10) + '...');
            console.log('   - Signature (primeiros 20 chars):', signature.substring(0, 20) + '...');
            console.log('   - Body type:', typeof rawBody);
            console.log('   - Body é Buffer?', rawBody instanceof Buffer);
            console.log('   - Body length:', rawBody.length);

            // Verificar a assinatura do webhook
            const event = stripe.webhooks.constructEvent(
                rawBody,
                signature,
                webhookSecret
            );

            console.log('✅ Assinatura verificada com sucesso!');
            console.log('📦 Evento recebido:');
            console.log('   - ID:', event.id);
            console.log('   - Tipo:', event.type);
            console.log('   - API Version:', event.api_version);
            console.log('   - Criado em:', new Date(event.created * 1000).toISOString());

            // Processar diferentes tipos de evento
            switch (event.type) {
                case 'checkout.session.completed': {
                    const session = event.data.object;
                    console.log('💰 Session completed:');
                    console.log('   - Session ID:', session.id);
                    console.log('   - Metadata:', session.metadata);
                    await this.handleCheckoutCompleted(session);
                    break;
                }
                case 'checkout.session.async_payment_succeeded': {
                    const session = event.data.object;
                    await this.handleCheckoutCompleted(session);
                    break;
                }
                case 'checkout.session.async_payment_failed': {
                    const session = event.data.object;
                    await this.handlePaymentFailed(session);
                    break;
                }
                default:
                    console.log(`⚡️ Evento não tratado: ${event.type}`);
            }

            console.log('🔄 ===== FIM PROCESSAMENTO =====\n');
            return { received: true };

        } catch (error) {
            console.error('❌ ERRO no processamento:');
            if (error instanceof Error) {
                console.error('   - Mensagem:', error.message);
                console.error('   - Stack:', error.stack);
            } else {
                console.error('   - Erro desconhecido:', error);
            }
            console.log('🔄 ===== FIM COM ERRO =====\n');
            throw error;
        }
    }

    /**
     * Quando o pagamento é concluído com sucesso
     */
    private async handleCheckoutCompleted(session: any) {
        try {
            const pedidoId = session.metadata?.pedidoId;

            if (!pedidoId) {
                console.error('Webhook: pedidoId não encontrado na metadata');
                return;
            }

            console.log(`💰 Pagamento confirmado para pedido ${pedidoId}`);

            // Atualizar status do pedido para CONFIRMADO
            await prisma.pedido.update({
                where: { id: pedidoId },
                data: {
                    status: 'CONFIRMADO',
                }
            });

            // Aqui você pode adicionar notificação via WebSocket
            // SocketService.notificarAtualizacaoStatus(pedido);

            console.log(`✅ Pedido ${pedidoId} confirmado com sucesso`);

        } catch (error) {
            if (error instanceof Error) {
                console.error(`❌ Erro ao processar pagamento confirmado: ${error.message}`);
            } else {
                console.error(`❌ Erro desconhecido ao processar pagamento confirmado`);
            }
        }
    }

    /**
     * Quando o pagamento falha
     */
    private async handlePaymentFailed(session: any) {
        try {
            const pedidoId = session.metadata?.pedidoId;

            if (!pedidoId) {
                console.error('Webhook: pedidoId não encontrado na metadata');
                return;
            }

            console.log(`❌ Pagamento falhou para pedido ${pedidoId}`);

            // Atualizar status do pedido
            await prisma.pedido.update({
                where: { id: pedidoId },
                data: {
                    status: 'CANCELADO' // ou outro status de falha
                }
            });

        } catch (error) {
            if (error instanceof Error) {
                console.error(`❌ Erro ao processar falha de pagamento: ${error.message}`);
            } else {
                console.error(`❌ Erro desconhecido ao processar falha de pagamento`);
            }
        }
    }
}