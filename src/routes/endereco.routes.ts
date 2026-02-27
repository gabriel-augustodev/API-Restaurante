import { Router } from 'express'
import { EnderecoController } from '../controllers/endereco.controller'
import { authMiddleware } from '../middlewares/auth.middleware'

const router = Router()
const enderecoController = new EnderecoController()

// Todas as rotas de endereço são protegidas (precisa estar logado)
router.use(authMiddleware)

router.get('/', enderecoController.listar)
router.get('/:id', enderecoController.buscarPorId)
router.post('/', enderecoController.criar)
router.put('/:id', enderecoController.atualizar)
router.delete('/:id', enderecoController.deletar)
router.patch('/:id/principal', enderecoController.definirComoPrincipal)

export default router