import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { GoogleTokenService } from './googleTokenService';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const REDIRECT_URI = `${window.location.origin}/oauth-callback.html`;
const SCOPES = 'openid profile email https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly';

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

  const handleTokenReceived = useCallback(async (token) => {
    try {
      setIsLoading(true);
      setError(null);

      const userInfo = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAccessToken(token);
      setGoogleUser(userInfo.data);
      setIsGoogleConnected(true);

      localStorage.setItem('tocamais_google_token', token);
      localStorage.setItem('tocamais_google_user', JSON.stringify(userInfo.data));
      localStorage.setItem('tocamais_google_expires_in', '3600');

      const expiresAt = new Date().getTime() + 3600 * 1000;
      localStorage.setItem('tocamais_google_expires_at', expiresAt.toString());
    } catch (err) {
      console.error('Erro ao fazer login com Google:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'GOOGLE_OAUTH_TOKEN' && event.data.accessToken) {
        handleTokenReceived(event.data.accessToken);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleTokenReceived]);

  // Recuperar token do Supabase ao inicializar
  useEffect(() => {
    const loadTokenFromStorage = async () => {
      try {
        const savedTokenId = localStorage.getItem('tocamais_google_token_id');
        const savedToken = localStorage.getItem('tocamais_google_token');
        const savedUser = localStorage.getItem('tocamais_google_user');
        const savedExpiresAt = Number(localStorage.getItem('tocamais_google_expires_at') || '0');

        if (savedTokenId && savedUser) {
          setTokenId(savedTokenId);
          setGoogleUser(JSON.parse(savedUser));

          const validToken = await GoogleTokenService.getValidAccessToken(savedTokenId);
          setAccessToken(validToken);
          setIsGoogleConnected(true);
          return;
        }

        if (savedToken && savedUser) {
          if (savedExpiresAt && savedExpiresAt <= Date.now()) {
            localStorage.removeItem('tocamais_google_token');
            localStorage.removeItem('tocamais_google_user');
            localStorage.removeItem('tocamais_google_expires_in');
            localStorage.removeItem('tocamais_google_expires_at');
            return;
          }

          setGoogleUser(JSON.parse(savedUser));
          setAccessToken(savedToken);
          setIsGoogleConnected(true);
        }
      } catch (err) {
        console.error('Erro ao carregar token do Supabase:', err);
        localStorage.removeItem('tocamais_google_token_id');
        localStorage.removeItem('tocamais_google_token');
        localStorage.removeItem('tocamais_google_user');
      }
    };

    loadTokenFromStorage();
  }, []);

  const handleConnectGoogle = useCallback(() => {
    console.log("GOOGLE_CLIENT_ID:", GOOGLE_CLIENT_ID);
    setIsLoading(true);
    setError(null);

    const state = Math.random().toString(36).substring(2);
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=token&scope=${encodeURIComponent(SCOPES)}&include_granted_scopes=true&state=${state}&prompt=select_account`;

    const popup = window.open(authUrl, 'google-oauth', 'width=500,height=700');
    if (!popup) {
      setError('Popup bloqueada. Permita popups para este site e tente novamente.');
      setIsLoading(false);
    }
  }, []);

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
