# Implementação Backend - Google Calendar Integration

## Overview

Este documento descreve como implementar o backend seguro para a integração do Google Calendar usando Supabase.

## 📋 Pré-requisitos

- Projeto Supabase já configurado
- Acesso à console do Supabase
- Google OAuth Client Secret (você já tem o Client ID)

## 🔧 Passos de Implementação

### 1. Criar Variáveis de Ambiente no Supabase

1. Vá para: **Project Settings → Secrets & Environment Variables**
2. Adicione as seguintes variáveis:

```
GOOGLE_CLIENT_ID=236136068504-m9djldbu00o9btp3gteeube7u5qcn0ug.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu_client_secret_aqui
```

**Onde obter o Client Secret:**
1. Vá para https://console.cloud.google.com/
2. Selecione seu projeto
3. Vá para **Credentials**
4. Clique no seu OAuth 2.0 Client ID
5. Copie o **Client Secret**

### 2. Criar as Tabelas no Supabase

1. Vá para **SQL Editor** no Supabase
2. Cole o conteúdo do arquivo `supabase_google_tokens_schema.sql`
3. Execute o script

**O que isso cria:**
- Tabela `google_calendar_tokens` - Armazena tokens de forma segura
- Tabela `google_sync_logs` - Registro de auditoria de sincronizações
- Row Level Security (RLS) - Proteção de dados por usuário

### 3. Deploy das Edge Functions

#### Opção A: Via CLI (Recomendado)

```bash
# Instalar Supabase CLI se ainda não tiver
npm install -g supabase

# Login no Supabase
supabase login

# Inicializar projeto (se ainda não fez)
supabase init

# Deploy das functions
supabase functions deploy google-oauth-callback
supabase functions deploy google-refresh-token
```

#### Opção B: Via Dashboard

1. Vá para **Edge Functions** no Supabase Dashboard
2. Clique **Create a new function**
3. Nome: `google-oauth-callback`
4. Cole o conteúdo de `supabase/functions/google-oauth-callback/index.ts`
5. Repita para `google-refresh-token`

### 4. Atualizar Redirect URI no Google

1. Vá para https://console.cloud.google.com/
2. Vá para **Credentials**
3. Clique no seu OAuth 2.0 Client ID
4. Adicionar Authorized redirect URIs:

```
http://localhost:5173  (desenvolvimento)
https://seu-dominio.com  (produção)
```

### 5. Instalar Variáveis de Ambiente

Atualize seu `.env` com:

```
VITE_GOOGLE_CLIENT_ID=236136068504-m9djldbu00o9btp3gteeube7u5qcn0ug.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=seu_client_secret_aqui
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_anon_key
```

## 📊 Arquitetura de Segurança

### Fluxo Seguro de OAuth

```
1. Frontend coleta authorization code
   ↓
2. Envia para Edge Function (google-oauth-callback)
   ↓
3. Edge Function (no servidor Supabase):
   - Troca code por access_token e refresh_token
   - Verifica autenticação do usuário (RLS)
   - Salva tokens NO BANCO DE DADOS (criptografado)
   - NÃO retorna refresh token ao frontend
   ↓
4. Frontend recebe apenas tokenId e accessToken
   ↓
5. Frontend armazena tokenId no localStorage
   ↓
6. Quando access_token expira:
   - Frontend envia requisição com tokenId
   - Edge Function (google-refresh-token) valida ownership
   - Renovação acontece no servidor
   - Access token atualizado no banco
```

### Segurança em Camadas

✅ **Criptografia de Dados**
- Tokens armazenados em coluna TEXT (idealmente com coluna de criptografia Supabase)

✅ **Row Level Security (RLS)**
- Usuários só veem seus próprios tokens
- Queries são filtradas automaticamente

✅ **Validação de Autenticação**
- Edge Functions verificam token JWT
- Apenas usuários autenticados podem acessar

✅ **Validação de Ownership**
- Verifica que tokenId pertence ao usuário
- Previne acesso cruzado entre usuários

✅ **Proteção de Refresh Token**
- Nunca é enviado ao frontend
- Apenas servidor pode usar para renovação

✅ **CORS Seguro**
- Apenas requests autorizadas são processadas

## 🧪 Testando a Implementação

### 1. Testar Edge Function Localmente

```bash
# Instalar Supabase functions locally (experimental)
supabase functions serve

# Em outro terminal, fazer request
curl -X POST http://localhost:54321/functions/v1/google-oauth-callback \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer seu_jwt_token" \
  -d '{
    "code": "seu_auth_code",
    "artistId": "seu_artist_id"
  }'
```

### 2. Testar no Frontend

1. Vá para Artist Agenda
2. Clique "Conectar Google Agenda"
3. Faça login com Google
4. Verifique que:
   - Token foi salvo no Supabase (check SQL: `SELECT * FROM google_calendar_tokens`)
   - localStorage tem apenas tokenId (não refresh_token)
   - Sincronização funciona

### 3. Testar Renovação de Token

```sql
-- Forçar expiração do token para testar renovação
UPDATE google_calendar_tokens
SET access_token_expires_at = NOW() - INTERVAL '1 hour'
WHERE id = 'seu_token_id';
```

Depois tentar sincronizar - deve renovar automaticamente.

## 🔒 Segurança Adicional para Produção

### 1. Habilitar criptografia end-to-end

```sql
-- Adicionar coluna para tokens criptografados
ALTER TABLE google_calendar_tokens 
ADD COLUMN access_token_encrypted TEXT,
ADD COLUMN refresh_token_encrypted TEXT;

-- Usar pgcrypto para criptografia
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

### 2. Implementar Rate Limiting

```sql
-- Criar tabela para rastrear requisições
CREATE TABLE api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);
```

### 3. Implementar CSRF Protection

```typescript
// Adicionar no Edge Function
const csrfToken = req.headers.get('x-csrf-token');
// Validar contra sessão
```

### 4. Adicionar Logging e Auditoria

```sql
-- Criar tabela de auditoria
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);
```

## 📚 Estrutura de Pastas

```
projeto/
├── supabase/
│   └── functions/
│       ├── google-oauth-callback/
│       │   └── index.ts
│       └── google-refresh-token/
│           └── index.ts
├── supabase_google_tokens_schema.sql
├── src/
│   ├── lib/
│   │   ├── GoogleOAuthContext.jsx (atualizado)
│   │   ├── googleTokenService.js (novo)
│   │   └── googleCalendarService.js
│   └── pages/
│       └── artist/
│           └── ArtistAgenda.jsx (atualizado)
└── .env
```

## 🚀 Deployment em Produção

### 1. Atualizar URLs

```
# Em .env.production
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_GOOGLE_REDIRECT_URI=https://seu-dominio.com/callback
```

### 2. Renovar Secrets

```bash
supabase secrets set GOOGLE_CLIENT_SECRET=seu_novo_secret
```

### 3. Deploy das Functions

```bash
supabase functions deploy google-oauth-callback --project-ref seu-projeto-ref
supabase functions deploy google-refresh-token --project-ref seu-projeto-ref
```

### 4. Verificar Certificados SSL

- Usar HTTPS em produção (obrigatório para OAuth)
- Verificar que certificados são válidos

## 🐛 Troubleshooting

### "GOOGLE_CLIENT_SECRET não definido"
- Verifique secrets no Supabase Settings
- Secrets levam alguns segundos para aplicar

### "Failed to save tokens"
- Verifique que tabela foi criada com sucesso
- Verifique RLS policies

### "Unauthorized: Token belongs to another user"
- Verifique que JWT token é válido
- Verifique que user.id corresponde ao tokenData.user_id

### "Google token refresh failed"
- Refresh token pode ter expirado (máximo 6 meses)
- Peça ao usuário para reconectar

## 📖 Documentação Adicional

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Google Calendar API](https://developers.google.com/calendar/api)

## ✅ Checklist de Implementação

- [ ] Criar variáveis de ambiente no Supabase
- [ ] Executar schema SQL no banco de dados
- [ ] Deploy das Edge Functions
- [ ] Atualizar Redirect URIs no Google
- [ ] Atualizar .env com URLs
- [ ] Testar OAuth flow locally
- [ ] Testar renovação de token
- [ ] Testar sincronização bidirecional
- [ ] Implementar rate limiting
- [ ] Implementar logging adicional
- [ ] Deploy em produção
- [ ] Monitorar logs de erro
- [ ] Documentar procedimentos de backup
