import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { prisma } from '../server';

export class UploadController {
    // Upload de imagem para restaurante
    async uploadRestaurante(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { restauranteId } = req.params;
            const userId = req.user!.userId;

            // VALIDAÇÃO: garantir que restauranteId é string
            if (!restauranteId || Array.isArray(restauranteId)) {
                return res.status(400).json({ error: 'ID do restaurante inválido' });
            }

            if (!req.file) {
                return res.status(400).json({ error: 'Nenhuma imagem enviada' });
            }

            // Verificar se o restaurante pertence ao usuário
            const restaurante = await prisma.restaurante.findFirst({
                where: {
                    id: restauranteId, // Agora é string com certeza
                    proprietarioId: userId
                }
            });

            if (!restaurante) {
                return res.status(404).json({ error: 'Restaurante não encontrado' });
            }

            // Atualizar a URL da imagem no banco
            const imagemUrl = (req.file as any).path;

            const restauranteAtualizado = await prisma.restaurante.update({
                where: { id: restauranteId }, // Agora é string com certeza
                data: { imagemUrl },
                select: {
                    id: true,
                    nome: true,
                    imagemUrl: true
                }
            });

            res.json({
                message: 'Imagem enviada com sucesso',
                restaurante: restauranteAtualizado
            });
        } catch (error) {
            next(error);
        }
    }

    // Upload de imagem para produto
    async uploadProduto(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { restauranteId, produtoId } = req.params;
            const userId = req.user!.userId;

            // VALIDAÇÃO: garantir que os IDs são strings
            if (!restauranteId || Array.isArray(restauranteId)) {
                return res.status(400).json({ error: 'ID do restaurante inválido' });
            }

            if (!produtoId || Array.isArray(produtoId)) {
                return res.status(400).json({ error: 'ID do produto inválido' });
            }

            if (!req.file) {
                return res.status(400).json({ error: 'Nenhuma imagem enviada' });
            }

            // Verificar se o restaurante pertence ao usuário
            const restaurante = await prisma.restaurante.findFirst({
                where: {
                    id: restauranteId,
                    proprietarioId: userId
                }
            });

            if (!restaurante) {
                return res.status(404).json({ error: 'Restaurante não encontrado' });
            }

            // Verificar se o produto pertence ao restaurante
            const produto = await prisma.produto.findFirst({
                where: {
                    id: produtoId,
                    restauranteId
                }
            });

            if (!produto) {
                return res.status(404).json({ error: 'Produto não encontrado' });
            }

            // Atualizar a URL da imagem no banco
            const imagemUrl = (req.file as any).path;

            const produtoAtualizado = await prisma.produto.update({
                where: { id: produtoId },
                data: { imagemUrl },
                select: {
                    id: true,
                    nome: true,
                    imagemUrl: true
                }
            });

            res.json({
                message: 'Imagem enviada com sucesso',
                produto: produtoAtualizado
            });
        } catch (error) {
            next(error);
        }
    }

    // Upload de foto de perfil do usuário
    async uploadPerfil(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.userId;

            if (!req.file) {
                return res.status(400).json({ error: 'Nenhuma imagem enviada' });
            }

            const imagemUrl = (req.file as any).path;

            // Se quiser salvar no banco, primeiro adicione o campo fotoUrl no model User
            // await prisma.user.update({
            //   where: { id: userId },
            //   data: { fotoUrl: imagemUrl }
            // });

            res.json({
                message: 'Imagem enviada com sucesso',
                imagemUrl
            });
        } catch (error) {
            next(error);
        }
    }

    // Upload de imagem para categoria (opcional)
    async uploadCategoria(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { restauranteId, categoriaId } = req.params;
            const userId = req.user!.userId;

            // VALIDAÇÃO
            if (!restauranteId || Array.isArray(restauranteId)) {
                return res.status(400).json({ error: 'ID do restaurante inválido' });
            }

            if (!categoriaId || Array.isArray(categoriaId)) {
                return res.status(400).json({ error: 'ID da categoria inválido' });
            }

            if (!req.file) {
                return res.status(400).json({ error: 'Nenhuma imagem enviada' });
            }

            // Verificar se o restaurante pertence ao usuário
            const restaurante = await prisma.restaurante.findFirst({
                where: {
                    id: restauranteId,
                    proprietarioId: userId
                }
            });

            if (!restaurante) {
                return res.status(404).json({ error: 'Restaurante não encontrado' });
            }

            // Verificar se a categoria pertence ao restaurante
            const categoria = await prisma.categoria.findFirst({
                where: {
                    id: categoriaId,
                    restauranteId
                }
            });

            if (!categoria) {
                return res.status(404).json({ error: 'Categoria não encontrada' });
            }

            // Atualizar a URL da imagem (se você adicionar campo imagemUrl em Categoria)
            const imagemUrl = (req.file as any).path;

            // Se tiver campo imagemUrl no model Categoria, descomente:
            // const categoriaAtualizada = await prisma.categoria.update({
            //   where: { id: categoriaId },
            //   data: { imagemUrl },
            //   select: {
            //     id: true,
            //     nome: true,
            //     imagemUrl: true
            //   }
            // });

            res.json({
                message: 'Imagem enviada com sucesso',
                imagemUrl
                // categoria: categoriaAtualizada
            });
        } catch (error) {
            next(error);
        }
    }
}