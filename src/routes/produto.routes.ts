import { Router } from 'express'
import { ProdutoController } from '../controllers/produto.controller'
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware'

const router = Router({ mergeParams: true })
const produtoController = new ProdutoController()

// Rotas públicas
router.get('/', produtoController.listarPublico)
router.get('/:id', produtoController.buscarPorIdPublico)

// Rotas protegidas (apenas dono do restaurante)
router.use(authMiddleware)
router.use(roleMiddleware(['DONO_RESTAURANTE', 'ADMIN']))

router.get('/meus/listar', produtoController.listarMeus)
router.post('/', produtoController.criar)
router.put('/:id', produtoController.atualizar)
router.delete('/:id', produtoController.deletar)
router.patch('/:id/disponibilidade', produtoController.toggleDisponibilidade)
router.patch('/:id/destaque', produtoController.toggleDestaque)

export default router