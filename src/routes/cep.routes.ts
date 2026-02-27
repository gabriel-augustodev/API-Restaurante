import { Router } from 'express';
import { CepController } from '../controllers/cep.controller';

const router = Router();
const cepController = new CepController();

router.get('/:cep', cepController.buscarCep);

export default router;