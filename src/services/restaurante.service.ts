import { prisma } from '../server'
import { DiaSemana } from '@prisma/client'

export class RestauranteService {
    async listar(params?: { ativo?: boolean, busca?: string }) {
        return await prisma.restaurante.findMany({
            where: {
                ativo: params?.ativo ?? true,
                ...(params?.busca ? {
                    OR: [
                        { nome: { contains: params.busca, mode: 'insensitive' } },
                        { descricao: { contains: params.busca, mode: 'insensitive' } }
                    ]
                } : {})
            },
            include: {
                endereco: true,
                diasFuncionamento: true
            },
            orderBy: { nome: 'asc' }
        })
    }

    async buscarPorId(id: string) {
        const restaurante = await prisma.restaurante.findUnique({
            where: { id },
            include: {
                endereco: true,
                diasFuncionamento: true
            }
        })

        if (!restaurante) {
            throw new Error('Restaurante não encontrado')
        }

        return restaurante
    }

    async listarPorProprietario(proprietarioId: string) {
        return await prisma.restaurante.findMany({
            where: { proprietarioId },
            include: {
                endereco: true,
                diasFuncionamento: true
            }
        })
    }

    async criar(proprietarioId: string, data: {
        nome: string
        descricao?: string
        cnpj: string
        telefone: string
        email: string
        enderecoId: string
        horarioAbertura?: string
        horarioFechamento?: string
        taxaEntrega?: number
        tempoMedioEntrega?: number
        imagemUrl?: string
        diasFuncionamento?: {
            diaSemana: DiaSemana
            aberto: boolean
            horarioAbre?: string
            horarioFecha?: string
        }[]
    }) {
        // Verificar se CNPJ já existe
        const cnpjExistente = await prisma.restaurante.findUnique({
            where: { cnpj: data.cnpj }
        })

        if (cnpjExistente) {
            throw new Error('CNPJ já cadastrado')
        }

        // Verificar se endereço pertence ao proprietário
        const endereco = await prisma.endereco.findFirst({
            where: {
                id: data.enderecoId,
                userId: proprietarioId
            }
        })

        if (!endereco) {
            throw new Error('Endereço não encontrado ou não pertence a você')
        }

        // Criar restaurante
        return await prisma.restaurante.create({
            data: {
                ...data,
                proprietarioId,
                diasFuncionamento: data.diasFuncionamento ? {
                    create: data.diasFuncionamento
                } : undefined
            },
            include: {
                endereco: true,
                diasFuncionamento: true
            }
        })
    }

    async atualizar(id: string, proprietarioId: string, data: {
        nome?: string
        descricao?: string
        telefone?: string
        email?: string
        horarioAbertura?: string
        horarioFechamento?: string
        taxaEntrega?: number
        tempoMedioEntrega?: number
        imagemUrl?: string
        ativo?: boolean
    }) {
        // Verificar se restaurante existe e pertence ao proprietário
        const restaurante = await prisma.restaurante.findFirst({
            where: {
                id,
                proprietarioId
            }
        })

        if (!restaurante) {
            throw new Error('Restaurante não encontrado ou não pertence a você')
        }

        return await prisma.restaurante.update({
            where: { id },
            data,
            include: {
                endereco: true,
                diasFuncionamento: true
            }
        })
    }

    async deletar(id: string, proprietarioId: string) {
        const restaurante = await prisma.restaurante.findFirst({
            where: {
                id,
                proprietarioId
            }
        })

        if (!restaurante) {
            throw new Error('Restaurante não encontrado ou não pertence a você')
        }

        // Soft delete (marca como inativo)
        return await prisma.restaurante.update({
            where: { id },
            data: { ativo: false }
        })
    }
}