# 🍽️ API Delivery Restaurante

API completa para sistema de delivery de restaurantes, construída com Node.js, Express, TypeScript, Prisma e PostgreSQL (Neon).

## 🚀 Tecnologias

- **Node.js** + **Express** - Framework web
- **TypeScript** - Tipagem estática
- **Prisma 7** - ORM com suporte a PostgreSQL
- **Neon** - Banco de dados PostgreSQL serverless
- **JWT** - Autenticação segura
- **Bcrypt** - Hash de senhas
- **Postman** - Testes de API

## 📋 Funcionalidades

### ✅ Implementadas

- [x] Autenticação completa (registro, login, refresh token, logout)
- [x] Busca de CEP com cache (integração ViaCEP)
- [x] CRUD de endereços para usuários
- [x] CRUD de restaurantes (com dias de funcionamento)
- [x] CRUD de categorias e produtos
- [x] Sistema de pedidos com status em tempo real
- [x] Avaliações de pedidos
- [x] Controle de roles (CLIENTE, DONO_RESTAURANTE, ADMIN)
- [x] Banco de dados populado para testes

## 📦 Estrutura do Projeto

src/
├── config/ # Configurações
├── controllers/ # Controladores (lógica das rotas)
├── middlewares/ # Middlewares (auth, roles, erros)
├── routes/ # Definição das rotas
├── services/ # Serviços (lógica de negócio)
├── utils/ # Utilitários (jwt, validações)
├── validations/ # Schemas de validação
└── server.ts # Entry point da aplicação

## 🔧 Instalação e Configuração

### Pré-requisitos

- Node.js 18+
- Conta no Neon
- Postman ou similar para testar

### Passo a passo

1. **Clone o repositório**
   - git clone https://github.com/gabriel-augustodev/API-Restaurante
   - cd api-delivery

2. **Instale as dependências**
   - npm install

3. **Configure as variáveis de ambiente**
   - Crie um arquivo .env na raiz:
     DATABASE_URL="URL DO BANCO AQUI"
     JWT_SECRET="SEU SEGREDO AQUI"
     PORT=3000

4. **Execute as migrações do Prisma**
   - npx prisma migrate dev --name init

5. **Inicie o servidor**
   - npm run dev

## 📚 Documentação da API

Autenticação

- POST /api/auth/register — Registrar novo usuário
  - Body: { email, senha, nome, telefone? }
- POST /api/auth/login — Fazer login
  - Body: { email, senha }
- POST /api/auth/refresh-token — Renovar access token
  - Body: { refreshToken }
- POST /api/auth/logout — Fazer logout
  - Body: { refreshToken }
- GET /api/auth/me — Dados do usuário logado
  - Authorization: Bearer TOKEN

Endereços (protegido)

- GET /api/enderecos — Listar meus endereços
- GET /api/enderecos/:id — Buscar endereço por ID
- POST /api/enderecos — Criar novo endereço
- PUT /api/enderecos/:id — Atualizar endereço
- DELETE /api/enderecos/:id — Deletar endereço
- PATCH /api/enderecos/:id/principal — Definir como principal

Restaurantes

- GET /api/restaurantes/publicos — Listar restaurantes (público)
- GET /api/restaurantes/publicos/:id — Buscar restaurante (público)
- GET /api/restaurantes/meus — Meus restaurantes (dono)
- POST /api/restaurantes — Criar restaurante (dono)
- PUT /api/restaurantes/:id — Atualizar (dono)
- DELETE /api/restaurantes/:id — Desativar (dono)

Cardápio

- GET /api/restaurantes/:id/produtos — Listar produtos (público)
- POST /api/restaurantes/:id/categorias — Criar categoria (dono)
- POST /api/restaurantes/:id/produtos — Criar produto (dono)

Pedidos (protegido)

- GET /api/pedidos/meus — Lista meus pedidos
- GET /api/pedidos/:id — Busca pedido por ID
- POST /api/pedidos — Criar novo pedido
- PATCH /api/pedidos/:id/cancelar — Cancelar pedido
- GET /api/pedidos/restaurante/:id — Lista pedidos do restaurante
- PATCH /api/pedidos/:id/restaurante/:id/status — Atualiza status

CEP

- GET /api/cep/:cep — Buscar endereço por CEP (com cache)

## 🧪 Testes

Exemplos de requisições

Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "joao@email.com", "senha": "123456"}'
```

Criar pedido

```bash
curl -X POST http://localhost:3000/api/pedidos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "restauranteId": "r1111111-1111-1111-1111-111111111111",
    "enderecoEntregaId": "a1111111-1111-1111-1111-111111111111",
    "itens": [
      {
        "produtoId": "p1111111-1111-1111-1111-111111111102",
        "quantidade": 1
      }
    ]
  }'
```

# 📦 Scripts Disponíveis

```bash
npm run dev            # Inicia o servidor em modo desenvolvimento (nodemon)
npm run build          # Compila TypeScript para JavaScript
npm start              # Inicia o servidor em produção
npx prisma studio      # Interface gráfica do banco
npx prisma migrate dev # Cria nova migração
```
# 🤝 Contribuição

1.Faça um fork do projeto

2.Crie uma branch para sua feature (git checkout -b feature/nova-feature)

3.Commit suas mudanças (git commit -m 'Adiciona nova feature')

4.Push para a branch (git push origin feature/nova-feature)

5.Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.

## 👨‍💻 Autor

Gabriel Augusto - @gabriel-augustodev

## 🙏 Agradecimentos

- Neon pelo banco de dados serverless
- Prisma pelo incrível ORM
- ViaCEP pela API de CEP gratuita