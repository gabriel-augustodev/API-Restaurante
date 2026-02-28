import { Router } from 'express';
import { CupomController } from '../controllers/cupom.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const cupomController = new CupomController();

/**
 * @swagger
 * tags:
 *   name: Cupons
 *   description: Gerenciamento de cupons de desconto
 */

// Rotas públicas (apenas listar cupons ativos)
router.get('/publicos', cupomController.listarPublico);
router.get('/codigo/:codigo', cupomController.buscarPorCodigo);

// Rotas protegidas (requer autenticação)
router.use(authMiddleware);

// Validação de cupom (cliente)
router.post('/validar', cupomController.validar);
router.get('/meu-historico', cupomController.meuHistorico);

// Rotas para admin/donos de restaurante
router.get('/', cupomController.listarTodos);
router.get('/:id', cupomController.buscarPorId);
router.post('/',
    roleMiddleware(['DONO_RESTAURANTE', 'ADMIN']),
    cupomController.criar
);
router.put('/:id',
    roleMiddleware(['DONO_RESTAURANTE', 'ADMIN']),
    cupomController.atualizar
);
router.get('/admin/mais-usados',
    roleMiddleware(['ADMIN']),
    cupomController.maisUsados
);

export default router;