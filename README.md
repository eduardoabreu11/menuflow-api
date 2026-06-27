# MenuFlow API

API backend do **MenuFlow**, um SaaS de cardápio digital para restaurantes, desenvolvido com **Node.js**, **Express**, **TypeScript** e **PostgreSQL**.

O objetivo do projeto é permitir que restaurantes tenham um cardápio digital público, um painel administrativo para gerenciar seus produtos e um painel master para controle geral da plataforma.

---

## Visão geral do projeto

O MenuFlow foi pensado como uma plataforma SaaS com três áreas principais:

### Cardápio público

Área acessada pelos clientes finais do restaurante.

Funcionalidades planejadas/implementadas:

* Visualização do restaurante pelo slug.
* Listagem de banners ativos.
* Listagem de categorias ativas.
* Listagem de produtos ativos.
* Exibição de preço, descrição, imagem e destaque de produto.
* Rota pública sem autenticação.
* Bloqueio de restaurante inativo no cardápio público.

Exemplo de rota pública:

```txt
/public/menu/casa-do-arroz
```

---

### Painel do restaurante

Área usada pelo dono do restaurante para gerenciar seu próprio cardápio.

Funcionalidades previstas:

* Login do restaurante.
* Dashboard com métricas.
* Gerenciamento de categorias.
* Gerenciamento de produtos.
* Gerenciamento de banners.
* Configurações do restaurante.
* Link público do cardápio.
* Futuramente assinatura/status de pagamento.

---

### Painel master

Área administrativa da plataforma.

Funcionalidades previstas:

* Login master.
* Listagem de restaurantes.
* Bloqueio/ativação de restaurantes.
* Gerenciamento de planos.
* Controle financeiro.
* Gerenciamento de usuários.
* Acompanhamento geral da operação.

---

## Stack utilizada

### Backend

* Node.js
* Express
* TypeScript
* PostgreSQL
* pg
* JWT
* bcrypt
* Zod
* Helmet
* CORS
* express-rate-limit
* dotenv

### Banco de dados

* PostgreSQL
* Índices únicos para evitar duplicidade
* UUIDs como identificadores principais

### Arquitetura

O backend segue uma organização em camadas:

```txt
src/
├── @types/
├── config/
├── controllers/
├── database/
├── middlewares/
├── repositories/
├── routes/
├── services/
├── validations/
└── server.ts
```

### Responsabilidades principais

```txt
controllers   → recebem request/response
services      → regras de negócio
repositories  → acesso ao banco de dados
validations   → schemas Zod
middlewares   → autenticação, roles, validação e erros
routes        → definição das rotas da API
```

---

## Status atual do backend

### Já implementado

* API Express com TypeScript.
* Conexão com PostgreSQL.
* Autenticação com JWT.
* Hash de senhas com bcrypt.
* Middleware de autenticação.
* Middleware de roles.
* Rate limit no login.
* Helmet para headers de segurança.
* CORS configurado.
* Validação com Zod nas principais rotas.
* Error handler global.
* Not found handler separado.
* Tratamento de JSON inválido.
* Tratamento de duplicidade do PostgreSQL.
* Índices únicos no banco.
* CRUD de restaurantes.
* CRUD de categorias.
* CRUD de produtos.
* CRUD de banners.
* CRUD de planos.
* Dashboard do restaurante.
* Cardápio público por slug.
* Usuários master com listagem e busca por ID.
* Proteção multi-tenant entre MASTER e RESTAURANT_OWNER.
* Bloqueio para impedir que um dono acesse dados de outro restaurante.

---

## Funcionalidades principais implementadas

### Auth

* Login com e-mail e senha.
* Validação de e-mail e senha com Zod.
* Geração de JWT.
* Bloqueio de usuário inativo.
* Rate limit no login.
* Senhas protegidas com bcrypt.

Rota:

```txt
POST /login
```

---

### Usuários

Rotas protegidas para MASTER:

```txt
GET /users
GET /users/:id
```

Validações:

* UUID válido em `/users/:id`.
* Acesso apenas por usuário MASTER.

---

### Restaurantes

Rotas:

```txt
GET /restaurants
GET /restaurants/:id
POST /restaurants
PATCH /restaurants/:id
PATCH /restaurants/:id/block
PATCH /restaurants/:id/activate
DELETE /restaurants/:id
```

Regras:

* MASTER pode gerenciar todos.
* RESTAURANT_OWNER acessa apenas seus próprios restaurantes.
* Slug validado.
* Nome validado.
* Bloqueio/ativação apenas pelo MASTER.
* Índice único para slug no banco.

---

### Categorias

Rotas:

```txt
GET /categories
GET /categories/:id
POST /categories
PATCH /categories/:id
PATCH /categories/:id/activate
PATCH /categories/:id/disable
DELETE /categories/:id
```

Regras:

* Categoria pertence a um restaurante.
* Nome obrigatório.
* Nome único dentro do mesmo restaurante.
* Validação de UUID.
* Validação de duplicidade no service.
* Índice único no banco para impedir categorias duplicadas no mesmo restaurante.

---

### Produtos

Rotas:

```txt
GET /products
GET /products/:id
POST /products
PATCH /products/:id
PATCH /products/:id/activate
PATCH /products/:id/disable
DELETE /products/:id
```

Regras:

* Produto pertence a um restaurante e uma categoria.
* Categoria precisa pertencer ao restaurante.
* Preço precisa ser maior que zero.
* Nome obrigatório.
* Produto único dentro da mesma categoria/restaurante.
* Validação de `restaurant_id` e `category_id` na query.
* Suporte a `image_url`.
* Suporte a `video_url`.
* Índice único no banco para impedir produto duplicado na mesma categoria/restaurante.

---

### Banners

Rotas:

```txt
GET /banners
GET /banners/:id
POST /banners
PATCH /banners/:id
PATCH /banners/:id/activate
PATCH /banners/:id/disable
DELETE /banners/:id
```

Regras:

* Banner pertence a um restaurante.
* `image_url` obrigatória.
* URL validada com Zod.
* Banner duplicado bloqueado.
* Índice único no banco para impedir mesma imagem repetida no mesmo restaurante.

---

### Dashboard do restaurante

Rotas:

```txt
GET /dashboard?restaurant_id=
GET /dashboard/recent-products?restaurant_id=
```

Regras:

* Apenas RESTAURANT_OWNER.
* `restaurant_id` obrigatório.
* UUID validado.
* Dono só acessa dashboard do próprio restaurante.

Retorno esperado:

```json
{
  "categories": 3,
  "products": 2,
  "activeProducts": 2,
  "banners": 4
}
```

---

### Public Menu

Rota pública:

```txt
GET /public/menu/:slug
```

Regras:

* Não precisa de token.
* Slug validado.
* Restaurante precisa estar ativo.
* Não retorna restaurante bloqueado/inativo.
* Retorna apenas banners ativos.
* Retorna apenas categorias ativas.
* Retorna apenas produtos ativos.
* Não vaza `owner_user_id`, `created_at`, `updated_at` ou dados internos.

Estrutura de retorno:

```json
{
  "restaurant": {
    "id": "uuid",
    "name": "Casa do Arroz",
    "slug": "casa-do-arroz",
    "description": "Descrição do restaurante",
    "logo_url": null,
    "whatsapp": "98999999999",
    "phone": "9833333333",
    "address": "São Luís - MA",
    "opening_hours": "Segunda a sábado, 18h às 23h"
  },
  "banners": [],
  "categories": []
}
```

---

### Planos

Rotas:

```txt
GET /plans
GET /plans/:id
POST /plans
PATCH /plans/:id
PATCH /plans/:id/disable
DELETE /plans/:id
```

Regras:

* Apenas MASTER.
* Nome obrigatório.
* Preço mensal não pode ser negativo.
* Preço anual não pode ser negativo.
* Limites precisam ser números inteiros válidos.
* Plano duplicado bloqueado.
* Update parcial com segurança.
* Índice único no banco para nome do plano.

Observação atual do MVP:

Neste momento, o MenuFlow será iniciado com **um plano único completo**, sem aplicação prática de limites por plano. Os campos como `max_products`, `max_categories`, `max_users` e `max_restaurants` ficam preparados para o futuro, caso a plataforma passe a ter planos diferentes.

---

## Segurança implementada

* Senhas com bcrypt.
* JWT com expiração.
* JWT com issuer e audience.
* Middleware de autenticação.
* Middleware de autorização por role.
* Validação de entrada com Zod.
* CORS configurado.
* Helmet configurado.
* Rate limit no login.
* Error handler global.
* Not found handler.
* Proteção contra JSON inválido.
* Índices únicos no banco.
* Tratamento do erro PostgreSQL `23505`.
* `.env` protegido pelo `.gitignore`.
* `.env.example` disponível como modelo.

---

## Roles

O sistema trabalha com os seguintes tipos de usuário:

```txt
MASTER
RESTAURANT_OWNER
RESTAURANT_STAFF
```

### MASTER

Pode acessar e gerenciar dados globais da plataforma.

### RESTAURANT_OWNER

Pode acessar apenas seus próprios restaurantes, categorias, produtos, banners e dashboard.

### RESTAURANT_STAFF

Role planejada para o futuro, para funcionários do restaurante com permissões limitadas.

---

## Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto com base no `.env.example`.

Exemplo:

```env
PORT=3333

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=sua_senha_aqui
DB_NAME=menuflow

FRONTEND_URL=http://localhost:3000

JWT_SECRET=sua_chave_secreta_aqui
JWT_ISSUER=cardapio-api
JWT_AUDIENCE=cardapio-web
JWT_EXPIRES_IN=15m
```

### Importante

O arquivo `.env` real não deve ser enviado para o GitHub.

O projeto já possui `.gitignore` para impedir o envio de arquivos sensíveis.

---

## Como rodar o projeto localmente

### 1. Clonar o repositório

```bash
git clone https://github.com/eduardoabreu11/menuflow-api.git
```

### 2. Entrar na pasta

```bash
cd menuflow-api
```

### 3. Instalar dependências

```bash
npm install
```

### 4. Criar o arquivo `.env`

Crie um arquivo `.env` usando o `.env.example` como base.

### 5. Criar o banco PostgreSQL

Crie um banco chamado:

```txt
menuflow
```

### 6. Rodar o projeto

```bash
npm run dev
```

A API ficará disponível em:

```txt
http://localhost:3333
```

---

## Rota de health check

```txt
GET /
```

Resposta esperada:

```json
{
  "name": "MenuFlow API",
  "status": "online"
}
```

---

## Estrutura principal do banco de dados

### users

Tabela de usuários da plataforma.

Campos principais:

```txt
id
name
email
password_hash
role
is_active
created_at
updated_at
```

---

### restaurants

Tabela de restaurantes.

Campos principais:

```txt
id
owner_user_id
name
slug
description
logo_url
whatsapp
phone
address
opening_hours
status
created_at
updated_at
```

---

### plans

Tabela de planos.

Campos principais:

```txt
id
name
description
monthly_price
annual_price
max_restaurants
max_products
max_categories
max_users
is_active
created_at
updated_at
```

---

### categories

Tabela de categorias do cardápio.

Campos principais:

```txt
id
restaurant_id
name
emoji
sort_order
is_active
created_at
updated_at
```

---

### products

Tabela de produtos do cardápio.

Campos principais:

```txt
id
restaurant_id
category_id
name
description
price
image_url
video_url
is_promotion
is_new
is_active
created_at
updated_at
```

---

### banners

Tabela de banners do restaurante.

Campos principais:

```txt
id
restaurant_id
image_url
is_active
created_at
updated_at
```

---

## Índices únicos criados no banco

O projeto possui índices únicos para reforçar a segurança dos dados:

```sql
users_email_unique_lower_idx
restaurants_slug_unique_lower_idx
plans_name_unique_lower_idx
categories_restaurant_name_unique_lower_idx
products_restaurant_category_name_unique_lower_idx
banners_restaurant_image_url_unique_idx
```

Esses índices impedem duplicidades como:

* Dois usuários com o mesmo e-mail.
* Dois restaurantes com o mesmo slug.
* Dois planos com o mesmo nome.
* Duas categorias com o mesmo nome no mesmo restaurante.
* Dois produtos com o mesmo nome na mesma categoria/restaurante.
* Dois banners iguais no mesmo restaurante.

---

## Testes manuais já realizados

Foram realizados testes manuais com PowerShell/cURL para validar:

* Login.
* Token expirado/inválido.
* Validação de UUID.
* Validação de slug.
* Validação de preço negativo.
* Validação de campos obrigatórios.
* Bloqueio de duplicidade.
* Public menu sem token.
* Dashboard com `restaurant_id` inválido.
* Rota inexistente.
* JSON inválido.
* Listagem de usuários.
* Criação e atualização de planos.
* Criação e atualização de produtos.
* Criação e atualização de categorias.
* Criação e atualização de banners.

---

## Próximos passos do backend

### Testes automáticos

Planejado:

```txt
- Separar app.ts e server.ts
- Instalar Vitest
- Instalar Supertest
- Criar testes básicos
- Testar rota GET /
- Testar rota inexistente
- Testar JSON inválido
- Testar login inválido
- Testar validações principais
```

---

### Melhorias de arquitetura

Planejado:

```txt
- Criar asyncHandler
- Criar AppError
- Reduzir try/catch repetitivo nos controllers
- Centralizar erros no errorHandler
- Padronizar status HTTP
```

---

### Users completo

Planejado:

```txt
- Criar usuário pelo MASTER
- Editar usuário
- Ativar/desativar usuário
- Trocar senha
- Resetar senha
- Garantir que password_hash nunca seja retornado
- Criar permissões futuras para RESTAURANT_STAFF
```

---

### Assinaturas e pagamentos

Como o MVP terá um plano único, o foco será em assinatura simples.

Planejado:

```txt
- Criar tabela subscriptions
- Criar tabela payments
- Relacionar restaurante com plano
- Definir status de pagamento
- Controlar vencimento
- Exibir financeiro no painel master
- Bloquear restaurante inadimplente
```

Status esperados:

```txt
PAID
PENDING
OVERDUE
CANCELED
```

---

### Upload de arquivos

Planejado:

```txt
- Upload de logo do restaurante
- Upload de banners
- Upload de imagem do produto
- Validação de tipo de arquivo
- Validação de tamanho
- Integração futura com Cloudinary, S3 ou Supabase Storage
```

---

### Docker

Planejado para uma fase mais próxima do deploy.

Arquivos previstos:

```txt
Dockerfile
docker-compose.yml
.dockerignore
```

O Docker será usado para padronizar o ambiente de execução e facilitar o deploy.

---

### Deploy

Planejado:

```txt
- Deploy do backend
- Banco PostgreSQL em produção
- Configuração de variáveis de ambiente
- Configuração de CORS com domínio real
- Integração com frontend em produção
```

Possibilidades futuras:

```txt
Render
Railway
VPS
Hostinger VPS
```

---

## Roadmap geral do MenuFlow

### Backend

```txt
Concluído:
- API base
- Auth
- JWT
- bcrypt
- roles
- validações Zod
- restaurants
- categories
- products
- banners
- public menu
- dashboard
- plans
- users básicos
- índices únicos
- error handler
- GitHub

Pendente:
- testes automáticos
- AppError/asyncHandler
- users completo
- assinatura simples
- pagamentos
- upload
- Docker
- deploy
```

---

### Frontend

Repositório frontend:

```txt
menuflow-web
```

Status atual:

```txt
- Estrutura inicial criada
- Painel admin iniciado
- Painel master iniciado
- Cardápio público iniciado
- Services criados para integração com API
```

Pendente:

```txt
- Login real integrado
- Proteção de rotas
- Dashboard real
- Categorias reais
- Produtos reais
- Banners reais
- Configurações reais
- Financeiro real
- Assinatura real
- Melhorias de loading e estados vazios
- Ajustes responsivos
- Deploy
```

---

## Status geral do projeto

Estimativa atual:

```txt
Backend base: 85%
Validações: 85%
Segurança backend: 80%
Banco de dados: 75%
Public menu backend: 90%
Plans backend: 85%
Products/Categories/Banners backend: 85%
Users backend: 40%
Assinaturas/pagamentos: 15%
Frontend admin: 45%
Frontend master: 40%
Cardápio público frontend: 60%
Upload: 10%
Testes automáticos: 0%
Deploy: 20%
```

Estimativa geral:

```txt
55% a 60% concluído
```

---

## Repositórios

Backend:

```txt
https://github.com/eduardoabreu11/menuflow-api
```

Frontend:

```txt
https://github.com/eduardoabreu11/menuflow-web
```

---

## Observação

Este projeto está em desenvolvimento ativo.

O foco atual é construir um MVP funcional com:

```txt
- Um plano único completo
- Cardápio público
- Painel do restaurante
- Painel master
- Controle simples de assinatura/pagamento
- Backend seguro e validado
- Frontend integrado com API real
```

Futuramente, o projeto poderá evoluir para múltiplos planos, upload completo de mídia, deploy em produção, Docker e testes automatizados.
