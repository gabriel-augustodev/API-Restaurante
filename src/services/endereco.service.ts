import { prisma } from '../server'
import { CepService } from './cep.service'

const cepService = new CepService()

export class EnderecoService {
    async listarPorUsuario(userId: string) {
        return await prisma.endereco.findMany({
            where: { userId },
            orderBy: [
                { isPrincipal: 'desc' },
                { createdAt: 'desc' }
            ]
        })
    }

    async buscarPorId(id: string, userId: string) {
        const endereco = await prisma.endereco.findFirst({
            where: {
                id,
                userId // Garante que só busca endereços do próprio usuário
            }
        })

        if (!endereco) {
            throw new Error('Endereço não encontrado')
        }

        return endereco
    }

    async criar(userId: string, data: {
        cep: string
        numero: string
        complemento?: string
        isPrincipal?: boolean
    }) {
        // Buscar dados do CEP automaticamente
        const cepData = await cepService.buscarCep(data.cep)

        // Se for o primeiro endereço, define como principal
        const enderecosExistentes = await prisma.endereco.count({
            where: { userId }
        })

        const isPrincipal = data.isPrincipal ?? (enderecosExistentes === 0)

        // Se este endereço for marcado como principal, remove principal dos outros
        if (isPrincipal) {
            await prisma.endereco.updateMany({
                where: {
                    userId,
                    isPrincipal: true
                },
                data: { isPrincipal: false }
            })
        }

        // Criar endereço
        return await prisma.endereco.create({
            data: {
                userId,
                cep: cepData.cep,
                logradouro: cepData.logradouro,
                numero: data.numero,
                complemento: data.complemento,
                bairro: cepData.bairro,
                cidade: cepData.cidade,
                estado: cepData.estado,
                isPrincipal
            }
        })
    }

    async atualizar(id: string, userId: string, data: {
        numero?: string
        complemento?: string
        isPrincipal?: boolean
    }) {
        // Verificar se endereço existe e pertence ao usuário
        const endereco = await this.buscarPorId(id, userId)

        // Se for marcar como principal, remover principal dos outros
        if (data.isPrincipal && !endereco.isPrincipal) {
            await prisma.endereco.updateMany({
                where: {
                    userId,
                    isPrincipal: true
                },
                data: { isPrincipal: false }
            })
        }

        // Atualizar endereço
        return await prisma.endereco.update({
            where: { id },
            data: {
                numero: data.numero,
                complemento: data.complemento,
                isPrincipal: data.isPrincipal
            }
        })
    }

    async deletar(id: string, userId: string) {
        // Verificar se endereço existe e pertence ao usuário
        const endereco = await this.buscarPorId(id, userId)

        // Se for o endereço principal, não pode deletar (ou define outro como principal)
        if (endereco.isPrincipal) {
            // Buscar outro endereço para ser o principal
            const outroEndereco = await prisma.endereco.findFirst({
                where: {
                    userId,
                    id: { not: id }
                }
            })

            if (outroEndereco) {
                // Define o outro como principal
                await prisma.endereco.update({
                    where: { id: outroEndereco.id },
                    data: { isPrincipal: true }
                })
            }
        }

        // Deletar o endereço
        await prisma.endereco.delete({
            where: { id }
        })

        return { message: 'Endereço removido com sucesso' }
    }

    async definirComoPrincipal(id: string, userId: string) {
        // Verificar se endereço existe
        await this.buscarPorId(id, userId)

        // Remover principal de todos
        await prisma.endereco.updateMany({
            where: { userId },
            data: { isPrincipal: false }
        })

        // Definir este como principal
        return await prisma.endereco.update({
            where: { id },
            data: { isPrincipal: true }
        })
    }
}