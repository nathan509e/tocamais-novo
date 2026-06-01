# Exemplos de Uso - Backend Integration

## 1. Usar GoogleTokenService no Frontend

### Exemplo: Conectar Google Calendar

```javascript
import { GoogleTokenService } from '@/lib/googleTokenService';

async function handleConnectGoogle(authCode, userData, artistId) {
  try {
    const result = await GoogleTokenService.exchangeCodeForTokens(
      authCode,
      userData,
      artistId
    );

    console.log('Token ID:', result.tokenId);
    console.log('Access Token válido até:', new Date(result.expiresAt));
    
    // Salvar no estado
    setTokenId(result.tokenId);
    setAccessToken(result.accessToken);
  } catch (error) {
    console.error('Erro:', error.message);
  }
}
```

### Exemplo: Sincronizar com Google Calendar

```javascript
async function syncWithGoogle(tokenId) {
  try {
    // Obter token válido (renova se expirado)
    const accessToken = await GoogleTokenService.getValidAccessToken(tokenId);

    // Buscar eventos do Google
    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const events = await response.json();
    
    // Registrar sincronização
    await GoogleTokenService.logSync(artistId, tokenId, {
      type: 'import',
      status: 'success',
      itemsSynced: events.items?.length || 0
    });

  } catch (error) {
    // Registrar erro
    await GoogleTokenService.logSync(artistId, tokenId, {
      type: 'import',
      status: 'failed',
      error: error.message
    });
  }
}
```

### Exemplo: Desconectar Google

```javascript
async function handleDisconnect(tokenId) {
  try {
    await GoogleTokenService.disconnectGoogle(tokenId);
    setTokenId(null);
    setAccessToken(null);
    console.log('Desconectado com sucesso');
  } catch (error) {
    console.error('Erro ao desconectar:', error);
  }
}
```

## 2. Usar Security Utilities

### Exemplo: Proteger Requisição com CSRF

```javascript
import { getCSRFToken, checkRateLimit, sanitizeInput } from '@/lib/securityUtils';

async function safeSyncRequest(data) {
  // 1. Check rate limit
  const rateLimit = checkRateLimit(`sync_${userId}`, 10, 60000);
  if (!rateLimit.allowed) {
    throw new Error(`Too many requests. Try again in ${Math.ceil(rateLimit.resetTime / 1000)}s`);
  }

  // 2. Get CSRF token
  const csrfToken = getCSRFToken();

  // 3. Sanitize input
  const sanitizedData = {
    ...data,
    notes: sanitizeInput(data.notes)
  };

  // 4. Make request with CSRF header
  const response = await fetch('/api/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify(sanitizedData)
  });

  return response.json();
}
```

## 3. Usar Edge Functions no Supabase

### Exemplo: Chamar Edge Function de OAuth

```javascript
// Em GoogleOAuthContext.jsx
async function exchangeCodeForTokens(authCode, artistId) {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-oauth-callback`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          code: authCode,
          artistId: artistId
        })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to exchange code');
    }

    return result;
  } catch (error) {
    console.error('Erro ao trocar código:', error);
    throw error;
  }
}
```

### Exemplo: Renovar Token via Edge Function

```javascript
async function refreshToken(tokenId) {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-refresh-token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          tokenId: tokenId
        })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to refresh token');
    }

    return result.accessToken;
  } catch (error) {
    console.error('Erro ao renovar token:', error);
    throw error;
  }
}
```

## 4. Usar RLS Policies

### Exemplo: Query com RLS automático

```javascript
// Esta query retorna apenas tokens do usuário autenticado
// RLS filtra automaticamente
const { data, error } = await supabase
  .from('google_calendar_tokens')
  .select('*')
  .eq('is_active', true);

// Se user_id do usuário autenticado não está no registro,
// o registro não será retornado (RLS bloqueia automaticamente)
```

## 5. Registrar Logs de Auditoria

```javascript
import { logSecurityEvent } from '@/lib/securityUtils';

async function handleGoogleOAuth(userId, ipAddress, userAgent) {
  try {
    // ... OAuth flow ...

    await logSecurityEvent({
      type: 'oauth_success',
      severity: 'info',
      userId: userId,
      ip: ipAddress,
      userAgent: userAgent,
      details: {
        provider: 'google',
        scopes: ['calendar.events', 'calendar.readonly']
      }
    });
  } catch (error) {
    await logSecurityEvent({
      type: 'oauth_failed',
      severity: 'warning',
      userId: userId,
      ip: ipAddress,
      details: {
        provider: 'google',
        error: error.message
      }
    });
  }
}
```

## 6. Sincronização Automática

```javascript
// Em um useEffect ou hook customizado
useEffect(() => {
  if (!tokenId) return;

  // Sincronizar a cada 30 minutos
  const syncInterval = setInterval(async () => {
    try {
      const syncLog = {
        type: 'auto',
        status: 'pending'
      };

      const startTime = Date.now();

      // Realizar sincronização
      await performSync(tokenId);

      syncLog.status = 'success';
      syncLog.durationMs = Date.now() - startTime;

      await GoogleTokenService.logSync(artistId, tokenId, syncLog);
    } catch (error) {
      await GoogleTokenService.logSync(artistId, tokenId, {
        type: 'auto',
        status: 'failed',
        error: error.message
      });
    }
  }, 30 * 60 * 1000); // 30 minutos

  return () => clearInterval(syncInterval);
}, [tokenId]);
```

## 7. Tratamento de Erros com Recovery

```javascript
async function robustSync(tokenId) {
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      const accessToken = await GoogleTokenService.getValidAccessToken(tokenId);
      // Perform sync...
      return { success: true };
    } catch (error) {
      retryCount++;

      if (retryCount < maxRetries) {
        // Esperar antes de tentar novamente (backoff exponencial)
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        // Falha permanente
        await logSecurityEvent({
          type: 'sync_failed_permanent',
          severity: 'error',
          userId: userId,
          details: { error: error.message, retries: retryCount }
        });
        throw error;
      }
    }
  }
}
```

## 8. Monitorar Status de Sincronização

```javascript
async function getSyncStatus(artistId) {
  try {
    const logs = await GoogleTokenService.getSyncHistory(artistId, 5);

    return {
      lastSync: logs[0]?.synced_at,
      lastStatus: logs[0]?.status,
      totalSyncs: logs.length,
      history: logs.map(log => ({
        date: log.synced_at,
        status: log.status,
        itemsSynced: log.items_synced,
        duration: `${log.duration_ms}ms`,
        error: log.error_message
      }))
    };
  } catch (error) {
    console.error('Erro ao obter status:', error);
  }
}
```

## 9. Validar Permissões de Scopes

```javascript
function hasRequiredScopes(tokenRecord) {
  const requiredScopes = [
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/calendar.readonly'
  ];

  return requiredScopes.every(scope => 
    tokenRecord.scopes.includes(scope)
  );
}

// Uso
const tokenInfo = await GoogleTokenService.getTokenInfo(tokenId);
if (!hasRequiredScopes(tokenInfo)) {
  throw new Error('Missing required permissions. Please reconnect Google Calendar.');
}
```

## 10. Backup e Recuperação de Tokens

```javascript
async function backupGoogleTokens(artistId) {
  try {
    const { data: tokens } = await supabase
      .from('google_calendar_tokens')
      .select('id, google_email, last_sync_at, is_active')
      .eq('artist_id', artistId);

    const backup = {
      timestamp: new Date().toISOString(),
      artistId,
      tokens
    };

    // Salvar localmente (não inclui tokens sensíveis)
    localStorage.setItem('google_tokens_backup', JSON.stringify(backup));
    console.log('Backup criado com sucesso');
  } catch (error) {
    console.error('Erro ao fazer backup:', error);
  }
}
```
