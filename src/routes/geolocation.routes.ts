import { Router } from 'express';
import { GeolocationController } from '../controllers/geolocation.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const geolocationController = new GeolocationController();

/**
 * @swagger
 * tags:
 *   name: Geolocalização
 *   description: Serviços de geocoding e cálculo de distâncias
 */

// Rotas públicas
router.get('/geocode', geolocationController.geocode);
router.get('/reverse-geocode', geolocationController.reverseGeocode);
router.post('/calcular-distancia', geolocationController.calcularDistancia);

// Rotas protegidas
router.use(authMiddleware);
router.get('/restaurantes-proximos', geolocationController.buscarRestaurantesProximos);
router.put('/restaurante/:restauranteId/coordenadas',
    roleMiddleware(['DONO_RESTAURANTE', 'ADMIN']),
    geolocationController.atualizarCoordenadasRestaurante
);

export default router;