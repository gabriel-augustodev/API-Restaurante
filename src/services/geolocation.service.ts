import axios from 'axios';
import { getDistance } from 'geolib';

interface Coordinates {
    lat: number;
    lon: number;
}

interface GeocodeResult {
    lat: number;
    lon: number;
    displayName: string;
    importance?: number;
}

interface DistanceResult {
    distanciaMetros: number;
    distanciaKm: number;
    tempoEstimadoMinutos?: number; // Considerando velocidade média de 30km/h
}

export class GeolocationService {
    private readonly NOMINATIM_URL = 'https://nominatim.openstreetmap.org';
    private readonly USER_AGENT = 'API_Delivery_Restaurante/1.0';

    /**
     * Geocoding: converter endereço em coordenadas
     * Respeita limite de 1 requisição/segundo do Nominatim [citation:5]
     */
    async geocode(endereco: string): Promise<GeocodeResult[]> {
        try {
            const response = await axios.get(`${this.NOMINATIM_URL}/search`, {
                params: {
                    q: endereco,
                    format: 'json',
                    limit: 5,
                    addressdetails: 1
                },
                headers: {
                    'User-Agent': this.USER_AGENT
                }
            });

            // Respeitar rate limit do Nominatim [citation:7]
            await this.delay(1000);

            return response.data.map((item: any) => ({
                lat: parseFloat(item.lat),
                lon: parseFloat(item.lon),
                displayName: item.display_name,
                importance: item.importance
            }));
        } catch (error) {
            console.error('Erro no geocoding:', error);
            throw new Error('Falha ao converter endereço em coordenadas');
        }
    }

    /**
     * Reverse geocoding: converter coordenadas em endereço
     */
    async reverseGeocode(lat: number, lon: number): Promise<string> {
        try {
            const response = await axios.get(`${this.NOMINATIM_URL}/reverse`, {
                params: {
                    lat,
                    lon,
                    format: 'json'
                },
                headers: {
                    'User-Agent': this.USER_AGENT
                }
            });

            await this.delay(1000); // Rate limiting

            return response.data.display_name || 'Endereço não encontrado';
        } catch (error) {
            console.error('Erro no reverse geocoding:', error);
            throw new Error('Falha ao converter coordenadas em endereço');
        }
    }

    /**
     * Calcular distância entre duas coordenadas usando geolib [citation:6]
     */
    calcularDistancia(coord1: Coordinates, coord2: Coordinates): DistanceResult {
        const distanciaMetros = getDistance(
            { latitude: coord1.lat, longitude: coord1.lon },
            { latitude: coord2.lat, longitude: coord2.lon }
        );

        const distanciaKm = distanciaMetros / 1000;

        // Tempo estimado: velocidade média 30km/h (entrega)
        const tempoEstimadoMinutos = Math.ceil((distanciaKm / 30) * 60);

        return {
            distanciaMetros,
            distanciaKm: Math.round(distanciaKm * 100) / 100,
            tempoEstimadoMinutos
        };
    }

    /**
     * Calcular frete baseado na distância
     * Regra: R$5 base + R$2 por km adicional
     */
    calcularFrete(distanciaKm: number): number {
        const taxaBase = 5.00;
        const taxaPorKm = 2.00;

        if (distanciaKm <= 1) return taxaBase;
        return taxaBase + (distanciaKm - 1) * taxaPorKm;
    }

    /**
     * Buscar restaurantes próximos a uma localização
     */
    async buscarRestaurantesProximos(
        restaurantes: Array<{ id: string; nome: string; latitude: number; longitude: number }>,
        clienteLat: number,
        clienteLon: number,
        raioKm: number = 5
    ) {
        const clienteCoord = { lat: clienteLat, lon: clienteLon };

        const restaurantesComDistancia = restaurantes.map(rest => {
            const distancia = this.calcularDistancia(
                clienteCoord,
                { lat: rest.latitude, lon: rest.longitude }
            );

            return {
                ...rest,
                distanciaKm: distancia.distanciaKm,
                tempoEstimado: distancia.tempoEstimadoMinutos,
                freteEstimado: this.calcularFrete(distancia.distanciaKm)
            };
        });

        // Filtrar por raio e ordenar por distância
        return restaurantesComDistancia
            .filter(r => r.distanciaKm <= raioKm)
            .sort((a, b) => a.distanciaKm - b.distanciaKm);
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}