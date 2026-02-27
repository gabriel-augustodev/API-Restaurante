import { Router } from 'express'
import { RestauranteController } from '../controllers/restaurante.controller'
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware'

const router = Router()
const restauranteController = new RestauranteController()

// Rotas públicas (não precisam de autenticação)
router.get('/publicos', restauranteController.listarPublico)
router.get('/publicos/:id', restauranteController.buscarPorId)

// Rotas protegidas (precisa estar logado)
router.use(authMiddleware)

// Rotas para donos de restaurante
router.get('/meus', restauranteController.meusRestaurantes)
router.post('/',
    roleMiddleware(['DONO_RESTAURANTE', 'ADMIN']),
    restauranteController.criar
)
router.put('/:id', restauranteController.atualizar) // O service já verifica se é dono
router.delete('/:id', restauranteController.deletar)

export default router