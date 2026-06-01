/**
 * CSRF Protection Utility
 * Protege contra Cross-Site Request Forgery attacks
 */

// Gerar CSRF token
export function generateCSRFToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Salvar CSRF token na sessão
export function setCSRFToken() {
  const token = generateCSRFToken();
  sessionStorage.setItem('csrf_token', token);
  return token;
}

// Obter CSRF token
export function getCSRFToken() {
  let token = sessionStorage.getItem('csrf_token');
  if (!token) {
    token = setCSRFToken();
  }
  return token;
}

// Validar CSRF token (no backend)
export function validateCSRFToken(providedToken) {
  const storedToken = sessionStorage.getItem('csrf_token');
  return storedToken && storedToken === providedToken;
}

/**
 * Rate Limiting Utility
 * Protege contra abuso de API
 */

const rateLimitStore = new Map();

export function checkRateLimit(key, maxRequests = 10, windowMs = 60000) {
  const now = Date.now();
  const userData = rateLimitStore.get(key) || { count: 0, resetTime: now + windowMs };

  // Resetar se window passou
  if (now > userData.resetTime) {
    userData.count = 0;
    userData.resetTime = now + windowMs;
  }

  userData.count++;

  if (userData.count > maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: userData.resetTime
    };
  }

  rateLimitStore.set(key, userData);

  return {
    allowed: true,
    remaining: maxRequests - userData.count,
    resetTime: userData.resetTime
  };
}

/**
 * Request Validation Utility
 */

export function validateGoogleOAuthRequest(data) {
  const errors = [];

  if (!data.code && !data.artistId) {
    errors.push('Missing required fields: code, artistId');
  }

  if (typeof data.code !== 'string' || data.code.length < 10) {
    errors.push('Invalid authorization code');
  }

  if (!isValidUUID(data.artistId)) {
    errors.push('Invalid artistId format');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate UUID format
 */
function isValidUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Secure HTTP Headers
 * Retorna headers para proteção adicional
 */

export function getSecurityHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://accounts.google.com; style-src 'self' 'unsafe-inline'",
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  };
}

/**
 * Sanitize User Input
 */

export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;

  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim()
    .substring(0, 1000); // Limitar tamanho
}

/**
 * Sanitize URL
 */

export function sanitizeURL(url) {
  try {
    const parsed = new URL(url);
    // Apenas aceitar https
    if (parsed.protocol !== 'https:') {
      throw new Error('Invalid protocol');
    }
    return parsed.toString();
  } catch (err) {
    console.error('Invalid URL:', err);
    return null;
  }
}

/**
 * Log Security Event
 */

export async function logSecurityEvent(event) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    type: event.type, // 'oauth_attempt', 'rate_limit_exceeded', etc
    severity: event.severity || 'info', // 'info', 'warning', 'error'
    userId: event.userId,
    details: event.details,
    ip: event.ip,
    userAgent: event.userAgent
  };

  // Enviar para logging service (exemplo: Sentry, LogRocket, etc)
  console.log('[Security Event]', logEntry);

  // Salvar no Supabase também
  try {
    // await supabase.from('security_logs').insert(logEntry);
  } catch (err) {
    console.error('Failed to log security event:', err);
  }
}

/**
 * Token Encryption/Decryption Utilities
 * Para valores mais sensíveis
 */

export async function encryptToken(token, key) {
  // Implementar com TweetNaCl.js ou libsodium
  // Por enquanto, apenas exemplo
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  return btoa(String.fromCharCode.apply(null, data));
}

export async function decryptToken(encryptedToken, key) {
  // Implementar com TweetNaCl.js ou libsodium
  const decoded = atob(encryptedToken);
  const bytes = new Uint8Array(decoded.length);
  for (let i = 0; i < decoded.length; i++) {
    bytes[i] = decoded.charCodeAt(i);
  }
  const decoder = new TextDecoder();
  return decoder.decode(bytes);
}
