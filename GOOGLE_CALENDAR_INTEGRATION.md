# Integração Google Calendar - TocaMais

## Overview

A integração com Google Calendar foi implementada para permitir que artistas sincronizem seus eventos e bloqueios de data entre TocaMais e Google Calendar em tempo real.

## Arquitetura

### 1. **Dependencies Instaladas**

```
- @react-oauth/google: v2.x - OAuth 2.0 para React
- googleapis: v140.x - Cliente Google APIs
- axios: v1.x - HTTP client para requisições
```

### 2. **Arquivos Criados/Modificados**

#### Novos Arquivos:
- `src/lib/GoogleOAuthContext.jsx` - Context provider para autenticação Google OAuth
- `src/lib/googleCalendarService.js` - Serviço para operações de Google Calendar API

#### Arquivos Modificados:
- `src/main.jsx` - Adicionado GoogleOAuthProvider wrapper
- `src/App.jsx` - Adicionado GoogleOAuthProvider
- `src/pages/artist/ArtistAgenda.jsx` - Integração com Google OAuth real
- `.env` - Adicionado VITE_GOOGLE_CLIENT_ID

## Como Funciona

### 1. **Fluxo de Autenticação**

```
1. Usuário clica "Conectar Google Agenda"
   ↓
2. Hook useGoogleOAuth() dispara handleConnectGoogle()
   ↓
3. Google OAuth modal abre (nativa do @react-oauth/google)
   ↓
4. Usuário faz login com Google
   ↓
5. Access Token é obtido
   ↓
6. Informações do usuário são armazenadas em localStorage
   ↓
7. Estado isGoogleConnected = true
   ↓
8. Auto-sync é ativado (opcional)
```

### 2. **Sincronização de Dados**

#### **Importar Bloqueios do Google Calendar**
```javascript
// Busca eventos do Google Calendar para o mês atual
GET https://www.googleapis.com/calendar/v3/calendars/primary/events
  - timeMin: início do mês
  - timeMax: fim do mês
  - Filtra eventos e os adiciona à tabela 'agendas'
```

#### **Exportar Shows para Google Calendar**
```javascript
// Cria eventos no Google Calendar para shows confirmados
POST https://www.googleapis.com/calendar/v3/calendars/primary/events
  - summary: "Show - [Nome do Local]"
  - date: data do show
  - colorId: verde (#2) para diferenciação
```

### 3. **Context & Hooks**

#### `useGoogleOAuth()` Hook
Fornece:
```javascript
{
  isGoogleConnected: boolean,
  googleUser: { email, name, picture },
  accessToken: string,
  isLoading: boolean,
  error: string,
  handleConnectGoogle: () => void,
  handleDisconnectGoogle: () => void,
  refreshTokenIfNeeded: () => boolean
}
```

## Fluxo de Componente (ArtistAgenda)

```
ArtistAgenda.jsx
├── useGoogleOAuth() - Obtém estado de autenticação
├── handleConnectGoogle() - Inicia OAuth
├── handleDisconnectGoogle() - Revoga acesso
├── handleStartSync() - Sincroniza eventos
│   ├── Importa bloqueios do Google
│   ├── Exporta shows para Google
│   └── Atualiza Supabase
└── UI
    ├── Botão de Conexão (se desconectado)
    ├── Status de Sincronização (se conectado)
    ├── Últimas Sync & Opções
    └── Indicador de Loading
```

## Scopes OAuth Solicitados

```
- openid: Identificação
- profile: Nome e foto do usuário
- email: Email do usuário
- https://www.googleapis.com/auth/calendar.events: Ler/criar eventos
- https://www.googleapis.com/auth/calendar.readonly: Ler calendários
```

## Storage Local

Dados armazenados em `localStorage`:

```javascript
tocamais_google_token              // Access Token
tocamais_google_user              // Dados do usuário (email, name, picture)
tocamais_google_expires_in        // Tempo de expiração (segundos)
tocamais_google_expires_at        // Timestamp de expiração
tocamais_google_last_sync         // Última sincronização
```

## Tratamento de Erros

### Cenários de Erro Tratados:

1. **Token Expirado**
   - Sistema detecta expiração
   - Desconecta automaticamente
   - Notifica usuário para reconectar

2. **Falha na API do Google**
   - Erro é registrado em console
   - Toast notifica usuário
   - Sincronização não interrompe app

3. **Acesso Negado**
   - Usuário não permitiu scopes
   - Botão fica inativo
   - Mensagem de erro exibida

4. **Rede Indisponível**
   - Erro é capturado em try/catch
   - Toast informa usuário
   - Pode tentar novamente

## Segurança

✅ **Implementado:**
- Access tokens armazenados apenas localmente (localStorage)
- Tokens incluídos no header Authorization
- Scopes mínimos necessários solicitados
- Proteção contra token expirado

⚠️ **Considerações para Produção:**
- Implementar refresh token no backend
- Usar localStorage alternativo (secure HttpOnly cookies)
- Implementar rate limiting
- Adicionar validação de segurança CSRF
- Criptografar dados sensíveis em repouso

## Fluxo de Sincronização em Detalhes

```javascript
handleStartSync(forceImport = false) {
  1. Validar que está conectado ao Google
  2. Marcar sincronização como em progresso
  
  3. Se importBlocks = true:
     - Fazer fetch dos eventos do Google para o mês atual
     - Para cada evento:
       - Verifica se já está bloqueado
       - Insere nova entrada em 'agendas'
       - Com note: "[Event Title] (Google Calendar)"
  
  4. Se exportShows = true:
     - Para cada show confirmado:
       - Cria objeto de evento
       - Faz POST na Google Calendar API
       - Cor verde para diferenciação
  
  5. Atualizar dados locais do Supabase
  6. Marcar sincronização como completa
  7. Notificar usuário com toast
}
```

## Testing

Para testar manualmente:

1. **Autenticação:**
   ```
   - Ir para Artist Agenda
   - Clicar "Conectar Google Agenda"
   - Fazer login com Google (use conta de teste)
   - Verificar localStorage tem tokens
   ```

2. **Sincronização:**
   ```
   - Conectar Google Calendar
   - Criar evento em Google Calendar
   - Clicar "Sincronizar Agora"
   - Verificar que data aparece bloqueada
   ```

3. **Exportação:**
   ```
   - Criar/confirmar show em TocaMais
   - Ativar "exportShows"
   - Sincronizar
   - Verificar que evento aparece em Google Calendar
   ```

## Próximos Passos (Melhorias Futuras)

- [ ] Implementar backend para gerenciar refresh tokens
- [ ] Suporte para múltiplos calendários
- [ ] Sincronização em tempo real (webhooks)
- [ ] Tratamento de conflitos de eventos
- [ ] UI melhorada para seleção de calendário
- [ ] Histórico de sincronizações
- [ ] Opção de sincronização automática periódica

## Troubleshooting

### "Token expirado"
**Solução:** Desconectar e reconectar com Google

### "Erro ao sincronizar"
**Solução:** 
- Verificar conexão internet
- Verificar que Google Calendar permite acesso
- Renovar permissões em Google Account

### "Google não conectado"
**Solução:**
- Verificar que @react-oauth/google está instalado
- Verificar VITE_GOOGLE_CLIENT_ID no .env
- Limpar localStorage e reconectar

### Scopes não aparecem na permissão
**Solução:**
- Ir em https://myaccount.google.com/permissions
- Remover app TocaMais
- Reconectar (scopes serão solicitados novamente)
