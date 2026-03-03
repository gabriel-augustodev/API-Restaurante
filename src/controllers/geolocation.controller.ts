import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { GeolocationService } from '../services/geolocation.service';
import { prisma } from '../server';

const geolocationService = new GeolocationService();

export class GeolocationController {
    /**
     * Geocoding: endereço -> coordenadas
     */
    async geocode(req: Request, res: Response, next: NextFunction) {
        try {
            const { endereco } = req.query;

            if (!endereco || typeof endereco !== 'string') {
                return res.status(400).json({ error: 'Endereço é obrigatório' });
            }

            const resultados = await geolocationService.geocode(endereco);
            res.json(resultados);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Reverse geocoding: coordenadas -> endereço
     */
    async reverseGeocode(req: Request, res: Response, next: NextFunction) {
        try {
            const { lat, lon } = req.query;

            if (!lat || !lon) {
                return res.status(400).json({ error: 'Latitude e longitude são obrigatórios' });
            }

            const latNum = parseFloat(lat as string);
            const lonNum = parseFloat(lon as string);

            const endereco = await geolocationService.reverseGeocode(latNum, lonNum);
            res.json({ endereco });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Calcular distância entre dois endereços
     */
    async calcularDistancia(req: Request, res: Response, next: NextFunction) {
        try {
            const { endereco1, endereco2 } = req.body;

            if (!endereco1 || !endereco2) {
                return res.status(400).json({ error: 'Dois endereços são obrigatórios' });
            }

            // Geocoding dos dois endereços
            const [coord1, coord2] = await Promise.all([
                geolocationService.geocode(endereco1),
                geolocationService.geocode(endereco2)
            ]);

            if (!coord1.length || !coord2.length) {
                return res.status(404).json({ error: 'Endereço não encontrado' });
            }

            const distancia = geolocationService.calcularDistancia(
                { lat: coord1[0].lat, lon: coord1[0].lon },
                { lat: coord2[0].lat, lon: coord2[0].lon }
            );

            const frete = geolocationService.calcularFrete(distancia.distanciaKm);

            res.json({
                endereco1: coord1[0].displayName,
                endereco2: coord2[0].displayName,
                distancia,
                frete
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Buscar restaurantes próximos (protegido)
     */
    async buscarRestaurantesProximos(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { endereco, raio } = req.query;
            const raioKm = raio ? parseFloat(raio as string) : 5;

            if (!endereco || typeof endereco !== 'string') {
                return res.status(400).json({ error: 'Endereço é obrigatório' });
            }

            // Geocoding do endereço do cliente
            const coordenadas = await geolocationService.geocode(endereco);

            if (!coordenadas.length) {
                return res.status(404).json({ error: 'Endereço não encontrado' });
            }

            const clienteCoord = coordenadas[0];

            // Buscar restaurantes com coordenadas
            const restaurantes = await prisma.restaurante.findMany({
                where: {
                    ativo: true,
                    latitude: { not: null },
                    longitude: { not: null }
                },
                select: {
                    id: true,
                    nome: true,
                    latitude: true,
                    longitude: true,
                    imagemUrl: true,
                    taxaEntrega: true
                }
            });

            // Converter para o formato esperado
            const restaurantesComCoords = restaurantes.map(r => ({
                id: r.id,
                nome: r.nome,
                latitude: r.latitude!,
                longitude: r.longitude!,
                taxaEntrega: r.taxaEntrega
            }));

            // Calcular proximidade
            const proximos = await geolocationService.buscarRestaurantesProximos(
                restaurantesComCoords,
                clienteCoord.lat,
                clienteCoord.lon,
                raioKm
            );

            res.json({
                cliente: {
                    endereco: clienteCoord.displayName,
                    lat: clienteCoord.lat,
                    lon: clienteCoord.lon
                },
                restaurantes: proximos,
                total: proximos.length
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Atualizar coordenadas de um restaurante (dono)
     */
    async atualizarCoordenadasRestaurante(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { restauranteId } = req.params;
            const { endereco } = req.body;
            const userId = req.user!.userId;

            // VALIDAÇÃO: garantir que restauranteId é string
            if (!restauranteId || Array.isArray(restauranteId)) {
                return res.status(400).json({ error: 'ID do restaurante inválido' });
            }

            if (!endereco || typeof endereco !== 'string') {
                return res.status(400).json({ error: 'Endereço é obrigatório' });
            }

            // Verificar se restaurante pertence ao usuário
            const restaurante = await prisma.restaurante.findFirst({
                where: {
                    id: restauranteId,  // Agora é string com certeza
                    proprietarioId: userId
                }
            });

            if (!restaurante) {
                return res.status(404).json({ error: 'Restaurante não encontrado' });
            }

            // Geocoding do endereço
            const coordenadas = await geolocationService.geocode(endereco);

            if (!coordenadas.length) {
                return res.status(404).json({ error: 'Endereço não encontrado' });
            }

            const coord = coordenadas[0];

            // Atualizar restaurante
            const restauranteAtualizado = await prisma.restaurante.update({
                where: { id: restauranteId },  // Agora é string com certeza
                data: {
                    latitude: coord.lat,
                    longitude: coord.lon
                }
            });

            res.json({
                message: 'Coordenadas atualizadas com sucesso',
                restaurante: {
                    id: restauranteAtualizado.id,
                    nome: restauranteAtualizado.nome,
                    latitude: restauranteAtualizado.latitude,
                    longitude: restauranteAtualizado.longitude,
                    enderecoEncontrado: coord.displayName
                }
            });
        } catch (error) {
            next(error);
        }
    }
}