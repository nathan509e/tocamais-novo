import React, { createContext, useContext, useState, useCallback } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { GoogleTokenService } from './googleTokenService';

const GoogleOAuthContext = createContext();

export const useGoogleOAuth = () => {
  const context = useContext(GoogleOAuthContext);
  if (!context) {
    throw new Error('useGoogleOAuth must be used within GoogleOAuthProvider');
  }
  return context;
};

export function GoogleOAuthProvider({ children }) {
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [googleUser, setGoogleUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [tokenId, setTokenId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Recuperar token do Supabase ao inicializar
  React.useEffect(() => {
    const loadTokenFromStorage = async () => {
      try {
        const savedTokenId = localStorage.getItem('tocamais_google_token_id');
        const savedUser = localStorage.getItem('tocamais_google_user');

        if (savedTokenId && savedUser) {
          setTokenId(savedTokenId);
          setGoogleUser(JSON.parse(savedUser));
          
          // Validar e renovar token se necessário
          const validToken = await GoogleTokenService.getValidAccessToken(savedTokenId);
          setAccessToken(validToken);
          setIsGoogleConnected(true);
        }
      } catch (err) {
        console.error('Erro ao carregar token do Supabase:', err);
        // Limpar storage se houver erro
        localStorage.removeItem('tocamais_google_token_id');
        localStorage.removeItem('tocamais_google_user');
      }
    };

    loadTokenFromStorage();
  }, []);

  // Configurar Google Login
  const googleLogin = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      try {
        setIsLoading(true);
        setError(null);

        // Obter informações do usuário
        const userInfo = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: {
            Authorization: `Bearer ${codeResponse.access_token}`
          }
        });

        // Aqui você precisaria do artistId - você pode obter do seu contexto de autenticação
        // Por enquanto, vou usar um placeholder
        const artistId = localStorage.getItem('tocamais_artist_id') || userInfo.data.id;

        // Trocar código por tokens no backend (Supabase)
        // OBS: Você precisaria implementar uma edge function no Supabase para isso
        // Por enquanto, vamos armazenar o access token localmente (não ideal para produção)
        
        // Salvar informações no contexto
        setAccessToken(codeResponse.access_token);
        setGoogleUser(userInfo.data);
        setIsGoogleConnected(true);

        // Persistir no localStorage (temporário até implementar backend)
        localStorage.setItem('tocamais_google_token', codeResponse.access_token);
        localStorage.setItem('tocamais_google_user', JSON.stringify(userInfo.data));
        localStorage.setItem('tocamais_google_expires_in', codeResponse.expires_in || 3600);

        // Salvar também a data de expiração
        const expiresAt = new Date().getTime() + (codeResponse.expires_in || 3600) * 1000;
        localStorage.setItem('tocamais_google_expires_at', expiresAt.toString());

      } catch (err) {
        console.error('Erro ao fazer login com Google:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    },
    onError: (error) => {
      console.error('Google Login error:', error);
      setError(error.message || 'Erro ao conectar com Google');
      setIsLoading(false);
    },
    flow: 'implicit',
    scope: 'openid profile email https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly'
  });

  const handleConnectGoogle = useCallback(() => {
    setIsLoading(true);
    googleLogin();
  }, [googleLogin]);

  const handleDisconnectGoogle = useCallback(async () => {
    try {
      // Desconectar do Supabase se tiver tokenId
      if (tokenId) {
        await GoogleTokenService.disconnectGoogle(tokenId);
      }

      setIsGoogleConnected(false);
      setGoogleUser(null);
      setAccessToken(null);
      setTokenId(null);

      localStorage.removeItem('tocamais_google_token_id');
      localStorage.removeItem('tocamais_google_token');
      localStorage.removeItem('tocamais_google_user');
      localStorage.removeItem('tocamais_google_expires_in');
      localStorage.removeItem('tocamais_google_expires_at');
    } catch (err) {
      console.error('Erro ao desconectar:', err);
    }
  }, [tokenId]);

  /**
   * Renovar token se expirado
   */
  const refreshTokenIfNeeded = useCallback(async () => {
    try {
      if (!tokenId) return false;

      const validToken = await GoogleTokenService.getValidAccessToken(tokenId);
      setAccessToken(validToken);
      return true;
    } catch (err) {
      console.error('Erro ao renovar token:', err);
      handleDisconnectGoogle();
      return false;
    }
  }, [tokenId, handleDisconnectGoogle]);

  const value = {
    isGoogleConnected,
    googleUser,
    accessToken,
    tokenId,
    isLoading,
    error,
    handleConnectGoogle,
    handleDisconnectGoogle,
    refreshTokenIfNeeded
  };

  return (
    <GoogleOAuthContext.Provider value={value}>
      {children}
    </GoogleOAuthContext.Provider>
  );
}
