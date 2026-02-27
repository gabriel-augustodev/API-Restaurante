import { prisma } from '../server'
import axios from 'axios'

interface ViaCEPResponse {
    cep: string
    logradouro: string
    bairro: string
    localidade: string
    uf: string
    erro?: boolean
}

export class CepService {
    async buscarCep(cep: string) {
        // O CEP já deve vir limpo do controller
        if (cep.length !== 8) {
            throw new Error('CEP deve ter 8 dígitos')
        }

        // Verificar cache
        const cache = await prisma.cepCache.findUnique({
            where: { cep }
        })

        if (cache) {
            return {
                ...cache,
                fromCache: true
            }
        }

        // Buscar na ViaCEP
        try {
            const response = await axios.get<ViaCEPResponse>(
                `https://viacep.com.br/ws/${cep}/json/`
            )

            if (response.data.erro) {
                throw new Error('CEP não encontrado')
            }

            const endereco = {
                cep,
                logradouro: response.data.logradouro,
                bairro: response.data.bairro,
                cidade: response.data.localidade,
                estado: response.data.uf
            }

            // Salvar no cache
            await prisma.cepCache.upsert({
                where: { cep },
                update: endereco,
                create: endereco
            })

            return {
                ...endereco,
                fromCache: false
            }

        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error('Erro ao consultar ViaCEP')
            }
            throw error
        }
    }
}