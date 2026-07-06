import { supabase } from './supabaseClient';
import axios from 'axios';

const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET; // Set this in .env

/**
 * Serviço para gerenciar tokens do Google de forma segura no Supabase
 */
export class GoogleTokenService {
  /**
   * Trocar authorization code por access token e refresh token
   * @param {string} authCode - Authorization code do Google OAuth
   * @param {Object} userData - Dados do usuário (email, name, picture)
   * @param {string} artistId - ID do artista
   * @returns {Object} { accessToken, refreshToken, expiresIn }
   */
  static async exchangeCodeForTokens(authCode, userData, artistId) {
    try {
      // Chamar Google OAuth token endpoint
      const response = await axios.post(GOOGLE_TOKEN_ENDPOINT, {
        code: authCode,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: window.location.origin,
        grant_type: 'authorization_code'
      });

      const {
        access_token,
        refresh_token,
        expires_in,
        id_token
      } = response.data;

      // Salvar tokens de forma segura no Supabase
      const tokenData = {
        artist_id: artistId,
        user_id: (await supabase.auth.getUser()).data.user.id,
        google_email: userData.email,
        google_user_id: userData.id,
        google_picture_url: userData.picture,
        access_token,
        access_token_expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
        refresh_token,
        import_blocks: true,
        export_shows: true,
        auto_sync: false,
        last_sync_status: 'pending'
      };

      const { data, error } = await supabase
        .from('google_calendar_tokens')
        .upsert(tokenData, { onConflict: 'artist_id' })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresIn: expires_in,
        tokenId: data.id
      };
    } catch (error) {
      console.error('Erro ao trocar código por tokens:', error);
      throw new Error(`Falha ao conectar com Google: ${error.message}`);
    }
  }

  /**
   * Renovar access token usando refresh token
   * @param {string} tokenId - ID do token no Supabase
   * @returns {Object} Novo access token e expiration
   */
  static async refreshAccessToken(tokenId) {
    try {
      // Buscar o refresh token do Supabase
      const { data: tokenData, error: fetchError } = await supabase
        .from('google_calendar_tokens')
        .select('refresh_token, access_token_expires_at')
        .eq('id', tokenId)
        .single();

      if (fetchError) throw fetchError;
      if (!tokenData?.refresh_token) {
        throw new Error('Refresh token não encontrado');
      }

      // Chamar Google para renovar token
      const response = await axios.post(GOOGLE_TOKEN_ENDPOINT, {
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: tokenData.refresh_token,
        grant_type: 'refresh_token'
      });

      const { access_token, expires_in } = response.data;
      const newExpiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

      // Atualizar token no Supabase
      const { error: updateError } = await supabase
        .from('google_calendar_tokens')
        .update({
          access_token,
          access_token_expires_at: newExpiresAt
        })
        .eq('id', tokenId);

      if (updateError) throw updateError;

      return {
        success: true,
        accessToken: access_token,
        expiresAt: newExpiresAt
      };
    } catch (error) {
      console.error('Erro ao renovar access token:', error);
      throw error;
    }
  }

  /**
   * Obter access token válido (renovar se necessário)
   * @param {string} tokenId - ID do token
   * @returns {string} Access token válido
   */
  static async getValidAccessToken(tokenId) {
    try {
      const { data, error } = await supabase
        .from('google_calendar_tokens')
        .select('access_token, access_token_expires_at')
        .eq('id', tokenId)
        .single();

      if (error) throw error;

      const expiresAt = new Date(data.access_token_expires_at);
      const now = new Date();
      const bufferMs = 5 * 60 * 1000; // 5 minutos de buffer

      // Se token vai expirar em menos de 5 minutos, renovar
      if (expiresAt.getTime() - now.getTime() < bufferMs) {
        const refreshed = await this.refreshAccessToken(tokenId);
        return refreshed.accessToken;
      }

      return data.access_token;
    } catch (error) {
      console.error('Erro ao obter access token válido:', error);
      throw error;
    }
  }

  /**
   * Desconectar e revogar access ao Google
   * @param {string} tokenId - ID do token
   */
  static async disconnectGoogle(tokenId) {
    try {
      const { data, error: fetchError } = await supabase
        .from('google_calendar_tokens')
        .select('access_token')
        .eq('id', tokenId)
        .single();

      if (fetchError) throw fetchError;

      // Revogar token no Google
      if (data?.access_token) {
        try {
          await axios.post('https://oauth2.googleapis.com/revoke', {
            token: data.access_token
          });
        } catch (revokeError) {
          console.warn('Aviso ao revogar token no Google:', revokeError.message);
          // Continuar mesmo se revoke falhar
        }
      }

      // Marcar como desconectado no Supabase
      const { error: updateError } = await supabase
        .from('google_calendar_tokens')
        .update({
          is_active: false,
          disconnected_at: new Date().toISOString()
        })
        .eq('id', tokenId);

      if (updateError) throw updateError;

      return { success: true };
    } catch (error) {
      console.error('Erro ao desconectar Google:', error);
      throw error;
    }
  }

  /**
   * Obter informações do token
   * @param {string} tokenId - ID do token
   */
  static async getTokenInfo(tokenId) {
    try {
      const { data, error } = await supabase
        .from('google_calendar_tokens')
        .select(`
          id,
          google_email,
          google_picture_url,
          import_blocks,
          export_shows,
          auto_sync,
          last_sync_at,
          last_sync_status,
          connected_at,
          is_active
        `)
        .eq('id', tokenId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao obter informações do token:', error);
      throw error;
    }
  }

  /**
   * Atualizar configurações de sincronização
   * @param {string} tokenId - ID do token
   * @param {Object} settings - Configurações a atualizar
   */
  static async updateSyncSettings(tokenId, settings) {
    try {
      const { error } = await supabase
        .from('google_calendar_tokens')
        .update(settings)
        .eq('id', tokenId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Erro ao atualizar configurações de sincronização:', error);
      throw error;
    }
  }

  /**
   * Registrar sincronização no log de auditoria
   * @param {string} artistId - ID do artista
   * @param {string} tokenId - ID do token
   * @param {Object} syncInfo - Informações da sincronização
   */
  static async logSync(artistId, tokenId, syncInfo) {
    try {
      const { error } = await supabase
        .from('google_sync_logs')
        .insert({
          artist_id: artistId,
          token_id: tokenId,
          sync_type: syncInfo.type || 'manual',
          status: syncInfo.status,
          items_synced: syncInfo.itemsSynced || 0,
          items_created: syncInfo.itemsCreated || 0,
          items_updated: syncInfo.itemsUpdated || 0,
          items_failed: syncInfo.itemsFailed || 0,
          error_message: syncInfo.error,
          duration_ms: syncInfo.durationMs
        });

      if (error) throw error;

      // Atualizar last_sync_at no token
      await supabase.rpc('increment_sync_count', { token_id: tokenId });
      await supabase
        .from('google_calendar_tokens')
        .update({
          last_sync_at: new Date().toISOString(),
          last_sync_status: syncInfo.status,
          last_sync_error: syncInfo.error
        })
        .eq('id', tokenId);

      return { success: true };
    } catch (error) {
      console.error('Erro ao registrar sincronização:', error);
      // Não lançar erro aqui para não interromper a sincronização
    }
  }

  /**
   * Obter histórico de sincronizações
   * @param {string} artistId - ID do artista
   * @param {number} limit - Número máximo de registros
   */
  static async getSyncHistory(artistId, limit = 20) {
    try {
      const { data, error } = await supabase
        .from('google_sync_logs')
        .select('*')
        .eq('artist_id', artistId)
        .order('synced_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao obter histórico de sincronizações:', error);
      throw error;
    }
  }
}

/**
 * Hook React para usar o GoogleTokenService
 */
export function useGoogleTokenService() {
  return {
    exchangeCodeForTokens: GoogleTokenService.exchangeCodeForTokens,
    refreshAccessToken: GoogleTokenService.refreshAccessToken,
    getValidAccessToken: GoogleTokenService.getValidAccessToken,
    disconnectGoogle: GoogleTokenService.disconnectGoogle,
    getTokenInfo: GoogleTokenService.getTokenInfo,
    updateSyncSettings: GoogleTokenService.updateSyncSettings,
    logSync: GoogleTokenService.logSync,
    getSyncHistory: GoogleTokenService.getSyncHistory
  };
}
