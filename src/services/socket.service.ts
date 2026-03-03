import { io } from '../server';

export class SocketService {
    // Novo pedido criado - notificar restaurante
    static notificarNovoPedido(pedido: any) {
        console.log('🔊 Notificando novo pedido para restaurante:', pedido.restauranteId);

        io.to(`restaurante-${pedido.restauranteId}`).emit('novo-pedido', {
            mensagem: 'Novo pedido recebido!',
            pedido: {
                id: pedido.id,
                cliente: pedido.cliente?.nome,
                total: pedido.total,
                itens: pedido.itens?.length,
                createdAt: pedido.createdAt
            }
        });
    }

    // Status do pedido atualizado - notificar cliente
    static notificarAtualizacaoStatus(pedido: any) {
        console.log('🔊 Emitindo status-atualizado para sala:', `pedido-${pedido.id}`, pedido.status);

        io.to(`pedido-${pedido.id}`).emit('status-atualizado', {
            pedidoId: pedido.id,
            status: pedido.status,
            mensagem: `Seu pedido agora está: ${pedido.status}`,
            timestamp: new Date()
        });

        // Se o status for PRONTO ou SAIU_PARA_ENTREGA, notificar também
        if (pedido.status === 'PRONTO' || pedido.status === 'SAIU_PARA_ENTREGA') {
            io.to(`pedido-${pedido.id}`).emit('pedido-pronto', {
                pedidoId: pedido.id,
                mensagem: 'Seu pedido está pronto!'
            });
        }

        // Se o status for ENTREGUE
        if (pedido.status === 'ENTREGUE') {
            io.to(`pedido-${pedido.id}`).emit('pedido-entregue', {
                pedidoId: pedido.id,
                mensagem: 'Pedido entregue! Avalie sua experiência.'
            });
        }
    }

    // Novo cupom disponível (broadcast para todos)
    static notificarNovoCupom(cupom: any) {
        console.log('🔊 Notificando novo cupom:', cupom.codigo);

        io.emit('novo-cupom', {
            codigo: cupom.codigo,
            descricao: cupom.descricao,
            tipo: cupom.tipo,
            valor: cupom.valor,
            dataValidade: cupom.dataValidade
        });
    }

    // Restaurante atualiza tempo de preparo
    static notificarTempoPreparo(pedidoId: string, minutos: number) {
        console.log(`🔊 Notificando tempo de preparo para pedido ${pedidoId}: ${minutos} minutos`);

        io.to(`pedido-${pedidoId}`).emit('tempo-preparo', {
            pedidoId,
            minutos,
            mensagem: `Tempo estimado de preparo: ${minutos} minutos`
        });
    }

    // Entregador atualizando localização
    static notificarLocalizacao(pedidoId: string, lat: number, lng: number) {
        console.log(`🔊 Atualizando localização do pedido ${pedidoId}: (${lat}, ${lng})`);

        io.to(`pedido-${pedidoId}`).emit('localizacao-entregador', {
            pedidoId,
            lat,
            lng
        });
    }
}