import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API Delivery Restaurante',
            version: '1.0.0',
            description: 'API completa para sistema de delivery de restaurantes',
            contact: {
                name: 'Gabriel Augusto',
                email: 'gabrielaugustodesenvolvedor@gmail.com'
            }
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Servidor de Desenvolvimento'
            },
            {
                url: 'https://seu-app.onrender.com',
                description: 'Servidor de Produção'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', example: 'cmm1bro8k000050u5hy8wj4um' },
                        email: { type: 'string', example: 'joao@email.com' },
                        nome: { type: 'string', example: 'João Silva' },
                        role: { type: 'string', enum: ['CLIENTE', 'DONO_RESTAURANTE', 'ADMIN'] }
                    }
                },
                Endereco: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        cep: { type: 'string', example: '01001000' },
                        logradouro: { type: 'string', example: 'Praça da Sé' },
                        numero: { type: 'string', example: '100' },
                        bairro: { type: 'string', example: 'Sé' },
                        cidade: { type: 'string', example: 'São Paulo' },
                        estado: { type: 'string', example: 'SP' },
                        isPrincipal: { type: 'boolean' }
                    }
                },
                Restaurante: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        nome: { type: 'string', example: 'Pizzaria do Carlos' },
                        descricao: { type: 'string' },
                        telefone: { type: 'string' },
                        taxaEntrega: { type: 'number', example: 8.50 }
                    }
                },
                Produto: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        nome: { type: 'string', example: 'Pizza Calabresa' },
                        descricao: { type: 'string' },
                        preco: { type: 'number', example: 49.90 },
                        disponivel: { type: 'boolean' }
                    }
                },
                Pedido: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        subtotal: { type: 'number' },
                        taxaEntrega: { type: 'number' },
                        total: { type: 'number' },
                        status: {
                            type: 'string',
                            enum: ['AGUARDANDO_RESTAURANTE', 'CONFIRMADO', 'EM_PREPARO', 'PRONTO', 'SAIU_PARA_ENTREGA', 'ENTREGUE', 'CANCELADO']
                        }
                    }
                },
                LoginRequest: {
                    type: 'object',
                    properties: {
                        email: { type: 'string', example: 'joao@email.com' },
                        senha: { type: 'string', example: '123456' }
                    },
                    required: ['email', 'senha']
                },
                LoginResponse: {
                    type: 'object',
                    properties: {
                        user: { $ref: '#/components/schemas/User' },
                        accessToken: { type: 'string' },
                        refreshToken: { type: 'string' }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' }
                    }
                }
            }
        },
        security: [{ bearerAuth: [] }]
    },
    apis: ['./src/routes/*.ts', './src/controllers/*.ts'], // Arquivos a serem analisados
};

export const specs = swaggerJsdoc(options);