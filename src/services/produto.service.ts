import { prisma } from '../server'

export class ProdutoService {
    async listarPorRestaurante(restauranteId: string, params?: {
        categoriaId?: string
        apenasDestaques?: boolean
        disponivel?: boolean
    }) {
        return await prisma.produto.findMany({
            where: {
                restauranteId,
                ...(params?.categoriaId ? { categoriaId: params.categoriaId } : {}),
                ...(params?.apenasDestaques ? { destaque: true } : {}),
                ...(params?.disponivel !== undefined ? { disponivel: params.disponivel } : {})
            },
            include: {
                categoria: true
            },
            orderBy: [
                { destaque: 'desc' },
                { nome: 'asc' }
            ]
        })
    }

    async buscarPorId(id: string, restauranteId: string) {
        const produto = await prisma.produto.findFirst({
            where: {
                id,
                restauranteId
            },
            include: {
                categoria: true
            }
        })

        if (!produto) {
            throw new Error('Produto não encontrado')
        }

        return produto
    }

    async criar(restauranteId: string, data: {
        nome: string
        descricao?: string
        preco: number
        categoriaId?: string
        disponivel?: boolean
        destaque?: boolean
        imagemUrl?: string
        tempoPreparo?: number
        ingredientes?: string
    }) {
        // Verificar se já existe produto com mesmo nome
        const existe = await prisma.produto.findFirst({
            where: {
                restauranteId,
                nome: data.nome
            }
        })

        if (existe) {
            throw new Error('Já existe um produto com este nome')
        }

        // Se tiver categoria, verificar se pertence ao restaurante
        if (data.categoriaId) {
            const categoria = await prisma.categoria.findFirst({
                where: {
                    id: data.categoriaId,
                    restauranteId
                }
            })

            if (!categoria) {
                throw new Error('Categoria não encontrada ou não pertence a este restaurante')
            }
        }

        return await prisma.produto.create({
            data: {
                ...data,
                restauranteId
            },
            include: {
                categoria: true
            }
        })
    }

    async atualizar(id: string, restauranteId: string, data: {
        nome?: string
        descricao?: string
        preco?: number
        categoriaId?: string | null
        disponivel?: boolean
        destaque?: boolean
        imagemUrl?: string
        tempoPreparo?: number
        ingredientes?: string
    }) {
        // Verificar se produto existe e pertence ao restaurante
        const produto = await prisma.produto.findFirst({
            where: { id, restauranteId }
        })

        if (!produto) {
            throw new Error('Produto não encontrado')
        }

        // Se estiver alterando o nome, verificar duplicidade
        if (data.nome && data.nome !== produto.nome) {
            const existe = await prisma.produto.findFirst({
                where: {
                    restauranteId,
                    nome: data.nome,
                    id: { not: id }
                }
            })

            if (existe) {
                throw new Error('Já existe um produto com este nome')
            }
        }

        // Se tiver categoria, verificar se pertence ao restaurante
        if (data.categoriaId) {
            const categoria = await prisma.categoria.findFirst({
                where: {
                    id: data.categoriaId,
                    restauranteId
                }
            })

            if (!categoria) {
                throw new Error('Categoria não encontrada ou não pertence a este restaurante')
            }
        }

        return await prisma.produto.update({
            where: { id },
            data,
            include: {
                categoria: true
            }
        })
    }

    async deletar(id: string, restauranteId: string) {
        const produto = await prisma.produto.findFirst({
            where: { id, restauranteId }
        })

        if (!produto) {
            throw new Error('Produto não encontrado')
        }

        await prisma.produto.delete({
            where: { id }
        })

        return { message: 'Produto removido com sucesso' }
    }

    async toggleDisponibilidade(id: string, restauranteId: string) {
        const produto = await prisma.produto.findFirst({
            where: { id, restauranteId }
        })

        if (!produto) {
            throw new Error('Produto não encontrado')
        }

        return await prisma.produto.update({
            where: { id },
            data: { disponivel: !produto.disponivel }
        })
    }

    async toggleDestaque(id: string, restauranteId: string) {
        const produto = await prisma.produto.findFirst({
            where: { id, restauranteId }
        })

        if (!produto) {
            throw new Error('Produto não encontrado')
        }

        return await prisma.produto.update({
            where: { id },
            data: { destaque: !produto.destaque }
        })
    }
}