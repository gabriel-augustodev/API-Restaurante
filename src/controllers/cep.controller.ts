import { Request, Response, NextFunction } from 'express'
import { CepService } from '../services/cep.service'

const cepService = new CepService()

export class CepController {
    async buscarCep(req: Request, res: Response, next: NextFunction) {
        try {
            const { cep } = req.params

            // Garantir que cep é string
            if (Array.isArray(cep)) {
                return res.status(400).json({ error: 'CEP inválido' })
            }

            const resultado = await cepService.buscarCep(cep)
            res.json(resultado)
        } catch (error) {
            next(error)
        }
    }
}