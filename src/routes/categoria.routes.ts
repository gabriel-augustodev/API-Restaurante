import { Router } from 'express'
import { CategoriaController } from '../controllers/categoria.controller'
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware'

const router = Router({ mergeParams: true })
const categoriaController = new CategoriaController()

// Rotas públicas
router.get('/', categoriaController.listarPublico)
router.get('/:id', categoriaController.buscarPorIdPublico)

// Rotas protegidas (apenas dono do restaurante)
router.use(authMiddleware)
router.use(roleMiddleware(['DONO_RESTAURANTE', 'ADMIN']))

router.get('/minhas/listar', categoriaController.listarMinhas)
router.post('/', categoriaController.criar)
router.put('/:id', categoriaController.atualizar)
router.delete('/:id', categoriaController.deletar)

export default router