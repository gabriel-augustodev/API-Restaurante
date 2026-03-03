import { prisma } from '../server'
import { StatusPedido } from '@prisma/client'
import { SocketService } from './socket.service' // ← ADICIONADO
import { CupomService } from './cupom.service'   // ← ADICIONADO

const cupomService = new CupomService()

export class PedidoService {
    async listarPorCliente(clienteId: string) {
        return await prisma.pedido.findMany({
            where: { clienteId },
            include: {
                restaurante: {
                    select: {
                        id: true,
                        nome: true,
                        imagemUrl: true
                    }
                },
                itens: {
                    include: {
                        produto: {
                            select: {
                                id: true,
                                nome: true,
                                imagemUrl: true
                            }
                        }
                    }
                },
                cupomUso: {  // ← ADICIONADO: incluir cupom usado
                    include: {
                        cupom: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })
    }

    async listarPorRestaurante(restauranteId: string, proprietarioId: string, status?: StatusPedido) {
        // Verificar se restaurante pertence ao proprietário
        const restaurante = await prisma.restaurante.findFirst({
            where: {
                id: restauranteId,
                proprietarioId
            }
        })

        if (!restaurante) {
            throw new Error('Restaurante não encontrado ou não pertence a você')
        }

        return await prisma.pedido.findMany({
            where: {
                restauranteId,
                ...(status ? { status } : {})
            },
            include: {
                cliente: {
                    select: {
                        id: true,
                        nome: true,
                        telefone: true
                    }
                },
                enderecoEntrega: true,
                itens: {
                    include: {
                        produto: {
                            select: {
                                id: true,
                                nome: true,
                                imagemUrl: true
                            }
                        }
                    }
                },
                cupomUso: {  // ← ADICIONADO: incluir cupom usado
                    include: {
                        cupom: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })
    }

    async buscarPorId(id: string, usuarioId: string, role: string) {
        const pedido = await prisma.pedido.findUnique({
            where: { id },
            include: {
                cliente: {
                    select: {
                        id: true,
                        nome: true,
                        telefone: true,
                        email: true
                    }
                },
                restaurante: {
                    select: {
                        id: true,
                        nome: true,
                        telefone: true,
                        imagemUrl: true,
                        proprietarioId: true
                    }
                },
                enderecoEntrega: true,
                itens: {
                    include: {
                        produto: {
                            select: {
                                id: true,
                                nome: true,
                                imagemUrl: true,
                                descricao: true
                            }
                        }
                    }
                },
                cupomUso: {  // ← ADICIONADO: incluir cupom usado
                    include: {
                        cupom: true
                    }
                }
            }
        })

        if (!pedido) {
            throw new Error('Pedido não encontrado')
        }

        // Verificar permissão
        if (role === 'CLIENTE' && pedido.clienteId !== usuarioId) {
            throw new Error('Acesso negado')
        }

        if (role === 'DONO_RESTAURANTE' && pedido.restaurante.proprietarioId !== usuarioId) {
            throw new Error('Acesso negado')
        }

        return pedido
    }

    async criar(clienteId: string, data: {
        restauranteId: string
        enderecoEntregaId: string
        itens: {
            produtoId: string
            quantidade: number
            observacoes?: string
        }[]
        observacoes?: string
        cupomCodigo?: string  // ← ADICIONADO: cupom opcional
    }) {
        // Verificar se restaurante existe e está ativo
        const restaurante = await prisma.restaurante.findFirst({
            where: {
                id: data.restauranteId,
                ativo: true
            }
        })

        if (!restaurante) {
            throw new Error('Restaurante não encontrado ou inativo')
        }

        // Verificar se endereço pertence ao cliente
        const endereco = await prisma.endereco.findFirst({
            where: {
                id: data.enderecoEntregaId,
                userId: clienteId
            }
        })

        if (!endereco) {
            throw new Error('Endereço não encontrado ou não pertence a você')
        }

        // Buscar produtos e calcular valores
        let subtotal = 0
        const itensParaCriar = []

        for (const item of data.itens) {
            const produto = await prisma.produto.findFirst({
                where: {
                    id: item.produtoId,
                    restauranteId: data.restauranteId,
                    disponivel: true
                }
            })

            if (!produto) {
                throw new Error(`Produto ${item.produtoId} não encontrado ou indisponível`)
            }

            const itemTotal = produto.preco * item.quantidade
            subtotal += itemTotal

            itensParaCriar.push({
                produtoId: produto.id,
                quantidade: item.quantidade,
                precoUnitario: produto.preco,
                observacoes: item.observacoes
            })
        }

        let total = subtotal + restaurante.taxaEntrega
        let cupomAplicado = null

        // 🔥 NOVO: Aplicar cupom se informado
        if (data.cupomCodigo) {
            try {
                const validacao = await cupomService.validar({
                    codigo: data.cupomCodigo,
                    usuarioId: clienteId,
                    valorPedido: subtotal,
                    restauranteId: data.restauranteId
                });

                if (validacao.valido) {
                    cupomAplicado = validacao;
                    total = subtotal + restaurante.taxaEntrega - validacao.valorDesconto!;

                    // Garantir que total não seja negativo
                    if (total < 0) total = 0;
                }
            } catch (error) {
                // Se cupom inválido, apenas ignora (não interrompe pedido)
                console.log('Cupom inválido:', error);
            }
        }

        // Criar pedido
        const pedido = await prisma.pedido.create({
            data: {
                clienteId,
                restauranteId: data.restauranteId,
                enderecoEntregaId: data.enderecoEntregaId,
                subtotal,
                taxaEntrega: restaurante.taxaEntrega,
                total,
                observacoes: data.observacoes,
                itens: {
                    create: itensParaCriar
                }
            },
            include: {
                itens: {
                    include: {
                        produto: true
                    }
                },
                restaurante: true,
                enderecoEntrega: true,
                cliente: {
                    select: {
                        id: true,
                        nome: true,
                        telefone: true
                    }
                }
            }
        })

        // 🔥 NOVO: Registrar uso do cupom se foi aplicado
        if (cupomAplicado) {
            await cupomService.aplicar({
                codigo: data.cupomCodigo!,
                usuarioId: clienteId,
                valorPedido: subtotal,
                restauranteId: data.restauranteId,
                pedidoId: pedido.id
            });
        }

        // 🔌 WEBSOCKET: Notificar restaurante sobre novo pedido
        SocketService.notificarNovoPedido(pedido);

        return pedido
    }

    async atualizarStatus(id: string, restauranteId: string, proprietarioId: string, novoStatus: StatusPedido) {
        // Verificar se restaurante existe e pertence ao proprietário
        const restaurante = await prisma.restaurante.findFirst({
            where: {
                id: restauranteId,
                proprietarioId
            }
        });

        if (!restaurante) {
            throw new Error('Restaurante não encontrado ou não pertence a você');
        }

        // Buscar pedido
        const pedido = await prisma.pedido.findFirst({
            where: {
                id,
                restauranteId
            }
        });

        if (!pedido) {
            throw new Error('Pedido não encontrado');
        }

        // Validar transições de status
        const statusValidos: Record<StatusPedido, StatusPedido[]> = {
            AGUARDANDO_RESTAURANTE: ['CONFIRMADO', 'CANCELADO'],
            CONFIRMADO: ['EM_PREPARO', 'CANCELADO'],
            EM_PREPARO: ['PRONTO', 'CANCELADO'],
            PRONTO: ['SAIU_PARA_ENTREGA'],
            SAIU_PARA_ENTREGA: ['ENTREGUE'],
            ENTREGUE: [],
            CANCELADO: []
        };

        if (!statusValidos[pedido.status]?.includes(novoStatus)) {
            throw new Error(`Transição de ${pedido.status} para ${novoStatus} não permitida`);
        }

        // Preparar dados de atualização com timestamps
        const updateData: any = { status: novoStatus };

        switch (novoStatus) {
            case 'CONFIRMADO':
                updateData.dataConfirmacao = new Date();
                break;
            case 'EM_PREPARO':
                updateData.dataInicioPreparo = new Date();
                break;
            case 'PRONTO':
                updateData.dataPronto = new Date();
                break;
            case 'SAIU_PARA_ENTREGA':
                updateData.dataSaidaEntrega = new Date();
                break;
            case 'ENTREGUE':
                updateData.dataEntrega = new Date();
                break;
            case 'CANCELADO':
                updateData.dataCancelamento = new Date();
                break;
        }

        console.log('📝 Atualizando pedido:', id, 'para', novoStatus);

        const pedidoAtualizado = await prisma.pedido.update({
            where: { id },
            data: updateData,
            include: {
                itens: true,
                cliente: {
                    select: {
                        id: true,
                        nome: true,
                        telefone: true
                    }
                },
                restaurante: {
                    select: {
                        id: true,
                        nome: true
                    }
                }
            }
        });

        console.log('✅ Pedido atualizado, chamando WebSocket...');

        // 🔌 NOTIFICAR VIA WEBSOCKET
        try {
            SocketService.notificarAtualizacaoStatus(pedidoAtualizado);
            console.log('✅ WebSocket notificado com sucesso');
        } catch (error) {
            console.error('❌ Erro ao notificar WebSocket:', error);
        }

        return pedidoAtualizado;
    }

    async cancelarPedido(id: string, clienteId: string) {
        const pedido = await prisma.pedido.findFirst({
            where: {
                id,
                clienteId
            }
        })

        if (!pedido) {
            throw new Error('Pedido não encontrado')
        }

        // Só pode cancelar se ainda não foi confirmado
        if (pedido.status !== 'AGUARDANDO_RESTAURANTE') {
            throw new Error('Não é possível cancelar pedido após confirmação')
        }

        const pedidoCancelado = await prisma.pedido.update({
            where: { id },
            data: {
                status: 'CANCELADO',
                dataCancelamento: new Date()
            },
            include: {
                cliente: {
                    select: {
                        id: true,
                        nome: true
                    }
                },
                restaurante: {
                    select: {
                        id: true,
                        nome: true
                    }
                }
            }
        })

        // 🔌 WEBSOCKET: Notificar restaurante que pedido foi cancelado
        SocketService.notificarAtualizacaoStatus(pedidoCancelado);

        return pedidoCancelado
    }

    // 🔥 NOVO: Método para atualizar tempo de preparo
    async atualizarTempoPreparo(id: string, restauranteId: string, proprietarioId: string, minutos: number) {
        // Verificar permissão
        const restaurante = await prisma.restaurante.findFirst({
            where: {
                id: restauranteId,
                proprietarioId
            }
        });

        if (!restaurante) {
            throw new Error('Acesso negado');
        }

        const pedido = await prisma.pedido.update({
            where: { id },
            data: { tempoPreparoEstimado: minutos },
            include: {
                cliente: {
                    select: {
                        id: true
                    }
                }
            }
        });

        // 🔌 WEBSOCKET: Notificar cliente sobre tempo de preparo
        SocketService.notificarTempoPreparo(id, minutos);

        return pedido;
    }

    // 🔥 NOVO: Método para buscar pedidos com cupons
    async listarComCupons(clienteId: string) {
        return await prisma.pedido.findMany({
            where: {
                clienteId,
                cupomUso: { isNot: null }
            },
            include: {
                cupomUso: {
                    include: {
                        cupom: true
                    }
                },
                restaurante: {
                    select: {
                        id: true,
                        nome: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
}