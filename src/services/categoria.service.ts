import { prisma } from '../server'

export class CategoriaService {
    async listarPorRestaurante(restauranteId: string) {
        return await prisma.categoria.findMany({
            where: { restauranteId },
            include: {
                produtos: {
                    where: { disponivel: true },
                    orderBy: { nome: 'asc' }
                }
            },
            orderBy: { ordem: 'asc' }
        })
    }

    async buscarPorId(id: string, restauranteId: string) {
        const categoria = await prisma.categoria.findFirst({
            where: {
                id,
                restauranteId
            },
            include: {
                produtos: {
                    where: { disponivel: true },
                    orderBy: { nome: 'asc' }
                }
            }
        })

        if (!categoria) {
            throw new Error('Categoria não encontrada')
        }

        return categoria
    }

    async criar(restauranteId: string, data: {
        nome: string
        descricao?: string
        ordem?: number
    }) {
        // Verificar se já existe categoria com mesmo nome
        const existe = await prisma.categoria.findFirst({
            where: {
                restauranteId,
                nome: data.nome
            }
        })

        if (existe) {
            throw new Error('Já existe uma categoria com este nome')
        }

        return await prisma.categoria.create({
            data: {
                ...data,
                restauranteId,
                ordem: data.ordem ?? 0
            }
        })
    }

    async atualizar(id: string, restauranteId: string, data: {
        nome?: string
        descricao?: string
        ordem?: number
    }) {
        // Verificar se categoria existe e pertence ao restaurante
        const categoria = await prisma.categoria.findFirst({
            where: { id, restauranteId }
        })

        if (!categoria) {
            throw new Error('Categoria não encontrada')
        }

        // Se estiver alterando o nome, verificar duplicidade
        if (data.nome && data.nome !== categoria.nome) {
            const existe = await prisma.categoria.findFirst({
                where: {
                    restauranteId,
                    nome: data.nome,
                    id: { not: id }
                }
            })

            if (existe) {
                throw new Error('Já existe uma categoria com este nome')
            }
        }

        return await prisma.categoria.update({
            where: { id },
            data
        })
    }

    async deletar(id: string, restauranteId: string) {
        const categoria = await prisma.categoria.findFirst({
            where: { id, restauranteId }
        })

        if (!categoria) {
            throw new Error('Categoria não encontrada')
        }

        // Verificar se há produtos nesta categoria
        const produtos = await prisma.produto.count({
            where: { categoriaId: id }
        })

        if (produtos > 0) {
            throw new Error('Não é possível deletar categoria com produtos. Mova os produtos primeiro.')
        }

        await prisma.categoria.delete({
            where: { id }
        })

        return { message: 'Categoria removida com sucesso' }
    }
}