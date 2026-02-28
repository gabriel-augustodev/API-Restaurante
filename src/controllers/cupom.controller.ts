import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { CupomService } from '../services/cupom.service';
import { prisma } from '../server';

const cupomService = new CupomService();

export class CupomController {
    // Listar cupons (público - apenas ativos e válidos)
    async listarPublico(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { restauranteId } = req.query;

            const cupons = await cupomService.listar({
                restauranteId: restauranteId as string,
                ativo: true
            });

            res.json(cupons);
        } catch (error) {
            next(error);
        }
    }

    // Listar todos cupons (admin/dono) - inclui inativos e expirados
    async listarTodos(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { restauranteId, ativo } = req.query;
            const userId = req.user!.userId;
            const userRole = req.user!.role;

            // Se não for admin, só pode ver cupons dos seus restaurantes
            let filtroRestaurante = restauranteId as string | undefined;

            if (userRole !== 'ADMIN') {
                // Buscar restaurantes do usuário
                const restaurantes = await prisma.restaurante.findMany({
                    where: { proprietarioId: userId },
                    select: { id: true }
                });

                const restaurantesIds = restaurantes.map(r => r.id);

                if (filtroRestaurante && !restaurantesIds.includes(filtroRestaurante)) {
                    return res.status(403).json({ error: 'Acesso negado a este restaurante' });
                }

                // Se não especificou restaurante, mostra de todos os seus restaurantes
                if (!filtroRestaurante) {
                    const cupons = await prisma.cupom.findMany({
                        where: {
                            restauranteId: { in: restaurantesIds },
                            ...(ativo !== undefined ? { ativo: ativo === 'true' } : {})
                        },
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
                    return res.json(cupons);
                }
            }

            // Se for admin ou especificou restaurante
            const cupons = await cupomService.listar({
                restauranteId: filtroRestaurante,
                ativo: ativo !== undefined ? ativo === 'true' : undefined,
                todos: true
            });

            res.json(cupons);
        } catch (error) {
            next(error);
        }
    }

    // Buscar cupom por ID
    async buscarPorId(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;

            if (!id || Array.isArray(id)) {
                return res.status(400).json({ error: 'ID inválido' });
            }

            const cupom = await cupomService.buscarPorId(id);

            // Verificar permissão (se não for admin, só pode ver cupons dos seus restaurantes)
            if (req.user!.role !== 'ADMIN' && cupom.restaurante) {
                const restaurante = await prisma.restaurante.findFirst({
                    where: {
                        id: cupom.restaurante.id,
                        proprietarioId: req.user!.userId
                    }
                });

                if (!restaurante) {
                    return res.status(403).json({ error: 'Acesso negado' });
                }
            }

            res.json(cupom);
        } catch (error) {
            next(error);
        }
    }

    // Buscar cupom por código (público - para validação)
    async buscarPorCodigo(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { codigo } = req.params;

            if (!codigo || Array.isArray(codigo)) {
                return res.status(400).json({ error: 'Código inválido' });
            }

            const cupom = await cupomService.buscarPorCodigo(codigo);
            res.json(cupom);
        } catch (error) {
            next(error);
        }
    }

    // Criar cupom (dono do restaurante ou admin)
    async criar(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const {
                codigo, descricao, tipo, valor,
                valorMinimoPedido, valorMaximoDesconto,
                dataValidade, maxUsos, maxUsosPorUsuario,
                restauranteId, apenasPrimeiroPedido
            } = req.body;

            // Validações básicas
            if (!codigo || !tipo || !valor || !dataValidade) {
                return res.status(400).json({
                    error: 'Código, tipo, valor e data de validade são obrigatórios'
                });
            }

            // Se for dono (não admin), verificar se restaurante pertence a ele
            if (req.user!.role !== 'ADMIN' && restauranteId) {
                const restaurante = await prisma.restaurante.findFirst({
                    where: {
                        id: restauranteId,
                        proprietarioId: req.user!.userId
                    }
                });

                if (!restaurante) {
                    return res.status(403).json({ error: 'Restaurante não pertence a você' });
                }
            }

            const cupom = await cupomService.criar({
                codigo,
                descricao,
                tipo,
                valor: Number(valor),
                valorMinimoPedido: valorMinimoPedido ? Number(valorMinimoPedido) : undefined,
                valorMaximoDesconto: valorMaximoDesconto ? Number(valorMaximoDesconto) : undefined,
                dataValidade: new Date(dataValidade),
                maxUsos: maxUsos ? Number(maxUsos) : undefined,
                maxUsosPorUsuario: maxUsosPorUsuario ? Number(maxUsosPorUsuario) : undefined,
                restauranteId,
                apenasPrimeiroPedido
            });

            res.status(201).json(cupom);
        } catch (error) {
            next(error);
        }
    }

    // Atualizar cupom
    async atualizar(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const {
                descricao, valor, valorMinimoPedido, valorMaximoDesconto,
                dataValidade, maxUsos, maxUsosPorUsuario, ativo
            } = req.body;

            if (!id || Array.isArray(id)) {
                return res.status(400).json({ error: 'ID inválido' });
            }

            // Verificar permissão
            const cupom = await prisma.cupom.findUnique({
                where: { id },
                include: { restaurante: true }
            });

            if (!cupom) {
                return res.status(404).json({ error: 'Cupom não encontrado' });
            }

            if (req.user!.role !== 'ADMIN' && cupom.restaurante) {
                const restaurante = await prisma.restaurante.findFirst({
                    where: {
                        id: cupom.restaurante.id,
                        proprietarioId: req.user!.userId
                    }
                });

                if (!restaurante) {
                    return res.status(403).json({ error: 'Acesso negado' });
                }
            }

            const cupomAtualizado = await cupomService.atualizar(id, {
                descricao,
                valor: valor ? Number(valor) : undefined,
                valorMinimoPedido: valorMinimoPedido ? Number(valorMinimoPedido) : undefined,
                valorMaximoDesconto: valorMaximoDesconto ? Number(valorMaximoDesconto) : undefined,
                dataValidade: dataValidade ? new Date(dataValidade) : undefined,
                maxUsos: maxUsos ? Number(maxUsos) : undefined,
                maxUsosPorUsuario: maxUsosPorUsuario ? Number(maxUsosPorUsuario) : undefined,
                ativo
            });

            res.json(cupomAtualizado);
        } catch (error) {
            next(error);
        }
    }

    // Validar cupom (para usar no checkout)
    async validar(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { codigo, valorPedido, restauranteId } = req.body;
            const usuarioId = req.user!.userId;

            if (!codigo || !valorPedido) {
                return res.status(400).json({
                    error: 'Código do cupom e valor do pedido são obrigatórios'
                });
            }

            const resultado = await cupomService.validar({
                codigo,
                usuarioId,
                valorPedido: Number(valorPedido),
                restauranteId
            });

            res.json(resultado);
        } catch (error) {
            next(error);
        }
    }

    // Histórico de cupons do usuário
    async meuHistorico(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const usuarioId = req.user!.userId;
            const historico = await cupomService.historicoUsuario(usuarioId);
            res.json(historico);
        } catch (error) {
            next(error);
        }
    }

    // Cupons mais usados (admin)
    async maisUsados(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { limite } = req.query;
            const resultado = await cupomService.maisUsados(limite ? Number(limite) : 10);
            res.json(resultado);
        } catch (error) {
            next(error);
        }
    }
}