import { prisma } from '../server';
import { TipoCupom } from '@prisma/client';

interface AplicarCupomParams {
    codigo: string;
    usuarioId: string;
    valorPedido: number;
    restauranteId?: string;
}

export class CupomService {
    async listar(params?: {
        restauranteId?: string;
        ativo?: boolean;
        todos?: boolean; // para admin ver todos
    }) {
        const where: any = {};

        if (params?.restauranteId) {
            where.restauranteId = params.restauranteId;
        }

        if (params?.ativo !== undefined) {
            where.ativo = params.ativo;
        }

        // Se não for admin, mostrar apenas cupons ativos e não expirados
        if (!params?.todos) {
            where.dataValidade = { gt: new Date() };
        }

        return await prisma.cupom.findMany({
            where,
            include: {
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

    async buscarPorId(id: string) {
        const cupom = await prisma.cupom.findUnique({
            where: { id },
            include: {
                restaurante: {
                    select: {
                        id: true,
                        nome: true
                    }
                },
                usos: {
                    include: {
                        usuario: {
                            select: {
                                id: true,
                                nome: true,
                                email: true
                            }
                        },
                        pedido: {
                            select: {
                                id: true,
                                total: true,
                                createdAt: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 10 // últimos 10 usos
                }
            }
        });

        if (!cupom) {
            throw new Error('Cupom não encontrado');
        }

        return cupom;
    }

    async buscarPorCodigo(codigo: string) {
        const cupom = await prisma.cupom.findUnique({
            where: { codigo },
            include: {
                restaurante: {
                    select: {
                        id: true,
                        nome: true
                    }
                }
            }
        });

        if (!cupom) {
            throw new Error('Cupom não encontrado');
        }

        return cupom;
    }

    async criar(data: {
        codigo: string;
        descricao?: string;
        tipo: TipoCupom;
        valor: number;
        valorMinimoPedido?: number;
        valorMaximoDesconto?: number;
        dataValidade: Date;
        maxUsos?: number;
        maxUsosPorUsuario?: number;
        restauranteId?: string;
        apenasPrimeiroPedido?: boolean;
    }) {
        // Verificar se código já existe
        const existe = await prisma.cupom.findUnique({
            where: { codigo: data.codigo.toUpperCase() }
        });

        if (existe) {
            throw new Error('Já existe um cupom com este código');
        }

        // Validar valor
        if (data.tipo === 'PERCENTUAL' && (data.valor <= 0 || data.valor > 100)) {
            throw new Error('Percentual deve estar entre 0 e 100');
        }

        if (data.tipo === 'FIXO' && data.valor <= 0) {
            throw new Error('Valor fixo deve ser maior que zero');
        }

        return await prisma.cupom.create({
            data: {
                ...data,
                codigo: data.codigo.toUpperCase(),
                usosAtuais: 0
            }
        });
    }

    async atualizar(id: string, data: {
        descricao?: string;
        valor?: number;
        valorMinimoPedido?: number;
        valorMaximoDesconto?: number;
        dataValidade?: Date;
        maxUsos?: number;
        maxUsosPorUsuario?: number;
        ativo?: boolean;
    }) {
        const cupom = await prisma.cupom.findUnique({
            where: { id }
        });

        if (!cupom) {
            throw new Error('Cupom não encontrado');
        }

        return await prisma.cupom.update({
            where: { id },
            data
        });
    }

    async validar(params: AplicarCupomParams) {
        const { codigo, usuarioId, valorPedido, restauranteId } = params;

        // Buscar cupom
        const cupom = await prisma.cupom.findUnique({
            where: { codigo: codigo.toUpperCase() }
        });

        if (!cupom) {
            return { valido: false, mensagem: 'Cupom não encontrado' };
        }

        // Verificar se está ativo
        if (!cupom.ativo) {
            return { valido: false, mensagem: 'Cupom inativo' };
        }

        // Verificar validade
        if (cupom.dataValidade < new Date()) {
            return { valido: false, mensagem: 'Cupom expirado' };
        }

        // Verificar limite de usos
        if (cupom.maxUsos && cupom.usosAtuais >= cupom.maxUsos) {
            return { valido: false, mensagem: 'Cupom esgotado' };
        }

        // Verificar se é específico de um restaurante
        if (cupom.restauranteId && cupom.restauranteId !== restauranteId) {
            return { valido: false, mensagem: 'Cupom não válido para este restaurante' };
        }

        // Verificar valor mínimo do pedido
        if (cupom.valorMinimoPedido && valorPedido < cupom.valorMinimoPedido) {
            return {
                valido: false,
                mensagem: `Pedido mínimo de R$ ${cupom.valorMinimoPedido.toFixed(2)}`
            };
        }

        // Verificar se é primeiro pedido
        if (cupom.apenasPrimeiroPedido) {
            const pedidosAnteriores = await prisma.pedido.count({
                where: { clienteId: usuarioId }
            });

            if (pedidosAnteriores > 0) {
                return { valido: false, mensagem: 'Cupom válido apenas para primeiro pedido' };
            }
        }

        // Verificar limite por usuário
        if (cupom.maxUsosPorUsuario) {
            const usosUsuario = await prisma.cupomUso.count({
                where: {
                    cupomId: cupom.id,
                    usuarioId
                }
            });

            if (usosUsuario >= cupom.maxUsosPorUsuario) {
                return {
                    valido: false,
                    mensagem: `Você já utilizou este cupom ${cupom.maxUsosPorUsuario} vez(es)`
                };
            }
        }

        // Calcular desconto
        let valorDesconto = 0;
        if (cupom.tipo === 'PERCENTUAL') {
            valorDesconto = (valorPedido * cupom.valor) / 100;

            // Aplicar limite máximo se houver
            if (cupom.valorMaximoDesconto && valorDesconto > cupom.valorMaximoDesconto) {
                valorDesconto = cupom.valorMaximoDesconto;
            }
        } else {
            valorDesconto = cupom.valor;
        }

        return {
            valido: true,
            cupomId: cupom.id,
            valorDesconto,
            mensagem: 'Cupom válido'
        };
    }

    async aplicar(params: AplicarCupomParams & { pedidoId: string }) {
        const validacao = await this.validar(params);

        if (!validacao.valido) {
            throw new Error(validacao.mensagem);
        }

        // Registrar o uso do cupom
        await prisma.cupomUso.create({
            data: {
                cupomId: validacao.cupomId!,
                usuarioId: params.usuarioId,
                pedidoId: params.pedidoId,
                valorDesconto: validacao.valorDesconto!
            }
        });

        // Incrementar contador de usos
        await prisma.cupom.update({
            where: { id: validacao.cupomId },
            data: {
                usosAtuais: {
                    increment: 1
                }
            }
        });

        return {
            cupomId: validacao.cupomId,
            valorDesconto: validacao.valorDesconto
        };
    }

    async historicoUsuario(usuarioId: string) {
        return await prisma.cupomUso.findMany({
            where: { usuarioId },
            include: {
                cupom: true,
                pedido: {
                    include: {
                        restaurante: {
                            select: {
                                id: true,
                                nome: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async maisUsados(limite: number = 10) {
        return await prisma.cupom.findMany({
            where: { ativo: true },
            orderBy: { usosAtuais: 'desc' },
            take: limite
        });
    }
}