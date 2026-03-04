import express, { Application } from 'express';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import swaggerUi from 'swagger-ui-express';
import { specs } from './config/swagger';

dotenv.config();

// Configuração do pool com SSL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });

const app: Application = express();
const port = process.env.PORT || 3000;

// Criar servidor HTTP
const server = http.createServer(app);

// Configurar Socket.io
export const io = new SocketServer(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    }
});

// 🔴 ATENÇÃO: Webhook do Stripe deve vir ANTES de express.json()
// Importar rotas que precisam de tratamento especial
import stripeRoutes from './routes/stripe.routes';

// ⚠️ CORREÇÃO: Aplicar express.raw APENAS na rota do webhook
app.use('/api/stripe', stripeRoutes);

// Middlewares padrão (DEPOIS do webhook)
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rota de teste
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'API Delivery - Documentação'
}));

// Importar outras rotas
import cepRoutes from './routes/cep.routes';
import authRoutes from './routes/auth.routes';
import enderecoRoutes from './routes/endereco.routes';
import restauranteRoutes from './routes/restaurante.routes';
import categoriaRoutes from './routes/categoria.routes';
import produtoRoutes from './routes/produto.routes';
import pedidoRoutes from './routes/pedido.routes';
import uploadRoutes from './routes/upload.routes';
import cupomRoutes from './routes/cupom.routes';
import geolocationRoutes from './routes/geolocation.routes';

// Usar rotas (as outras rotas do Stripe) - DEPOIS do express.json
app.use('/api/stripe', stripeRoutes); // Checkout, cancelar, etc (usam JSON normal)

app.use('/api/cep', cepRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/enderecos', enderecoRoutes);
app.use('/api/restaurantes', restauranteRoutes);
app.use('/api/restaurantes/:restauranteId/categorias', categoriaRoutes);
app.use('/api/restaurantes/:restauranteId/produtos', produtoRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/cupons', cupomRoutes);
app.use('/api/geolocation', geolocationRoutes);

// Configuração dos WebSockets
io.on('connection', (socket) => {
    console.log('🔌 Novo cliente conectado:', socket.id);

    socket.on('entrar-pedido', (pedidoId: string) => {
        socket.join(`pedido-${pedidoId}`);
        console.log(`Cliente ${socket.id} entrou na sala pedido-${pedidoId}`);
    });

    socket.on('entrar-restaurante', (restauranteId: string) => {
        socket.join(`restaurante-${restauranteId}`);
        console.log(`Restaurante ${socket.id} entrou na sala restaurante-${restauranteId}`);
    });

    socket.on('compartilhar-localizacao', (data: { pedidoId: string, lat: number, lng: number }) => {
        socket.to(`pedido-${data.pedidoId}`).emit('localizacao-atualizada', {
            pedidoId: data.pedidoId,
            lat: data.lat,
            lng: data.lng
        });
    });

    socket.on('disconnect', () => {
        console.log('🔌 Cliente desconectado:', socket.id);
    });
});

// Tratamento de erros global
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('❌ Erro:', err.stack);

    // Verificar se é erro do Stripe
    if (err.message.includes('Stripe')) {
        return res.status(400).json({ error: err.message });
    }

    res.status(500).json({ error: 'Erro interno do servidor' });
});

// Usar server.listen em vez de app.listen
server.listen(port, () => {
    console.log(`🚀 Servidor rodando na porta ${port}`);
    console.log(`🔌 WebSockets disponível em ws://localhost:${port}`);
    console.log(`📚 Documentação Swagger: http://localhost:${port}/api-docs`);
    console.log(`💳 Stripe webhook: http://localhost:${port}/api/stripe/webhook`);
});