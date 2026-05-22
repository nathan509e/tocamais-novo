import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from './supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    checkUserSession();
  }, []);

  const checkUserSession = async () => {
    try {
      setIsLoadingAuth(true);
      // Fetch active session from supabase client
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        await loadUserProfile(session.user);
      } else {
        // Double check local storage session fallback
        const localSession = localStorage.getItem('tocamais_auth_session');
        if (localSession) {
          const parsed = JSON.parse(localSession);
          if (parsed) {
            setUser(parsed);
            await loadUserProfile(parsed);
          }
        }
      }
    } catch (err) {
      console.error('Session loading failed:', err);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const loadUserProfile = async (currentUser) => {
    try {
      setUser(currentUser);
      setIsAuthenticated(true);

      // Load specific user profile metadata from DB based on role
      const role = currentUser.role || 'contractor';
      
      if (role === 'artist') {
        const { data } = await supabase.from('artists').select('*').eq('user_id', currentUser.id).single();
        setUserProfile(data);
      } else if (role === 'venue') {
        const { data } = await supabase.from('venues').select('*').eq('user_id', currentUser.id).single();
        setUserProfile(data);
      } else {
        const { data } = await supabase.from('contractors').select('*').eq('user_id', currentUser.id).single();
        setUserProfile(data);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  };

  const loginWithRole = async (email, password) => {
    setIsLoadingAuth(true);
    setAuthError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        return { error };
      }

      if (data?.user) {
        await loadUserProfile(data.user);
        return { user: data.user, error: null };
      }
      return { error: { message: 'Nenhum usuário encontrado.' } };
    } catch (err) {
      return { error: { message: err.message || 'Falha ao autenticar.' } };
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const signUpWithRole = async ({ email, password, name, role, phone }) => {
    setIsLoadingAuth(true);
    setAuthError(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
            avatar_url: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop`
          }
        }
      });

      if (error) {
        return { error };
      }

      if (data?.user) {
        // Build additional profile metadata tables
        const currentUser = data.user;
        await loadUserProfile(currentUser);
        return { user: currentUser, error: null };
      }
      return { error: { message: 'Erro desconhecido ao cadastrar.' } };
    } catch (err) {
      return { error: { message: err.message || 'Erro de cadastro.' } };
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error(e);
    }
    setUser(null);
    setUserProfile(null);
    setIsAuthenticated(false);
    localStorage.removeItem('tocamais_auth_session');
  };

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      loginWithRole,
      signUpWithRole,
      logout,
      refreshProfile: () => loadUserProfile(user)
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
