import express, { Application } from 'express';
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
    ssl: {
        rejectUnauthorized: false, // Essencial para Neon
    },
})

// Criar adapter e cliente Prisma
const adapter = new PrismaPg(pool)
export const prisma = new PrismaClient({ adapter })

const app: Application = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rota de teste
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ========= Swagger =========
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'API Delivery - Documentação'
}));

// Rota para JSON do OpenAPI
app.get('/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
});

// Importar rotas
import cepRoutes from './routes/cep.routes';
import authRoutes from './routes/auth.routes';
import enderecoRoutes from './routes/endereco.routes';
import restauranteRoutes from './routes/restaurante.routes';
import categoriaRoutes from './routes/categoria.routes';
import produtoRoutes from './routes/produto.routes';
import pedidoRoutes from './routes/pedido.routes';
import uploadRoutes from './routes/upload.routes';

// Usar rotas
app.use('/api/cep', cepRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/enderecos', enderecoRoutes);
app.use('/api/restaurantes', restauranteRoutes);
app.use('/api/restaurantes/:restauranteId/categorias', categoriaRoutes)
app.use('/api/restaurantes/:restauranteId/produtos', produtoRoutes)
app.use('/api/pedidos', pedidoRoutes)
app.use('/api/upload', uploadRoutes);

// Tratamento de erros global
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Erro interno do servidor' });
});

app.listen(port, () => {
    console.log(`🚀 Servidor rodando na porta ${port}`);
    console.log(`📚 Documentação Swagger: http://localhost:${port}/api-docs`);
    console.log(`📄 JSON OpenAPI: http://localhost:${port}/swagger.json`);
});