import { prisma } from '../server'
import { StatusPedido } from '@prisma/client'

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

        const total = subtotal + restaurante.taxaEntrega

        // Criar pedido
        return await prisma.pedido.create({
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
                enderecoEntrega: true
            }
        })
    }

    async atualizarStatus(id: string, restauranteId: string, proprietarioId: string, novoStatus: StatusPedido) {
        // Verificar se restaurante existe e pertence ao proprietário
        const restaurante = await prisma.restaurante.findFirst({
            where: {
                id: restauranteId,
                proprietarioId
            }
        })

        if (!restaurante) {
            throw new Error('Restaurante não encontrado ou não pertence a você')
        }

        // Buscar pedido
        const pedido = await prisma.pedido.findFirst({
            where: {
                id,
                restauranteId
            }
        })

        if (!pedido) {
            throw new Error('Pedido não encontrado')
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
        }

        if (!statusValidos[pedido.status].includes(novoStatus)) {
            throw new Error(`Transição de ${pedido.status} para ${novoStatus} não permitida`)
        }

        // Preparar dados de atualização com timestamps
        const updateData: any = { status: novoStatus }

        switch (novoStatus) {
            case 'CONFIRMADO':
                updateData.dataConfirmacao = new Date()
                break
            case 'EM_PREPARO':
                updateData.dataInicioPreparo = new Date()
                break
            case 'PRONTO':
                updateData.dataPronto = new Date()
                break
            case 'SAIU_PARA_ENTREGA':
                updateData.dataSaidaEntrega = new Date()
                break
            case 'ENTREGUE':
                updateData.dataEntrega = new Date()
                break
            case 'CANCELADO':
                updateData.dataCancelamento = new Date()
                break
        }

        return await prisma.pedido.update({
            where: { id },
            data: updateData,
            include: {
                itens: true,
                cliente: true
            }
        })
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

        return await prisma.pedido.update({
            where: { id },
            data: {
                status: 'CANCELADO',
                dataCancelamento: new Date()
            }
        })
    }
}