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
        setIsLoadingAuth(false);
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

      let pubUser = null;
      try {
        const { data: existingUser } = await supabase.from('users').select('*').eq('id', currentUser.id).single();
        if (existingUser) pubUser = existingUser;
      } catch (e) {
        console.warn('Error loading public.users, will attempt insert:', e);
      }

      const role = pubUser?.role || (currentUser.user_metadata?.role || currentUser.role || 'contractor').replace('bar_owner', 'venue');

      if (!pubUser) {
        const { data: newUserRow, error: insertErr } = await supabase.from('users').insert({
          id: currentUser.id,
          email: currentUser.email,
          name: currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || 'Usuário',
          role: role,
          avatar_url: currentUser.user_metadata?.avatar_url || ''
        }).select().single();
        if (newUserRow) {
          pubUser = newUserRow;
        } else if (insertErr) {
          console.error('Failed to create users entry:', insertErr);
        }
      }

      if (role === 'admin') {
        setUserProfile(pubUser);
      } else if (role === 'artist') {
        let artistData = null;
        try {
          const { data } = await supabase.from('artists').select('*').eq('user_id', currentUser.id).single();
          artistData = data;
        } catch (e) {
          console.warn('Error loading artist profile, will attempt insert:', e);
        }

        if (!artistData) {
          // Create default artist entry
          const { data: newArtist, error: newArtistErr } = await supabase.from('artists').insert({
            user_id: currentUser.id,
            artistic_name: pubUser?.name || currentUser.user_metadata?.name || 'Artista',
            genre: 'Sertanejo',
            city: 'São Paulo',
            bio: 'Adicione sua biografia aqui.',
            base_fee: 0,
            rating: 0,
            followers: 0,
            verified: false,
            live_now: false,
            featured: false,
            cover_url: '',
            photo_url: pubUser?.avatar_url || ''
          }).select().single();
          if (newArtist) {
            artistData = newArtist;
          } else if (newArtistErr) {
            console.error('Failed to create default artist entry:', newArtistErr);
          }
        }
        setUserProfile(artistData);
      } else if (role === 'venue') {
        let venueData = null;
        try {
          const { data } = await supabase.from('venues').select('*').eq('user_id', currentUser.id).single();
          venueData = data;
        } catch (e) {
          console.warn('Error loading venue profile, will attempt insert:', e);
        }

        if (!venueData) {
          const { data: newVenue, error: newVenueErr } = await supabase.from('venues').insert({
            user_id: currentUser.id,
            venue_name: pubUser?.name || currentUser.user_metadata?.name || 'Meu Estabelecimento',
            city: 'São Paulo',
            address: 'Endereço não definido',
            capacity: 100,
            average_budget: 0
          }).select().single();
          if (newVenue) {
            venueData = newVenue;
          } else if (newVenueErr) {
            console.error('Failed to create default venue entry:', newVenueErr);
          }
        }
        setUserProfile(venueData);
      } else {
        let contractorData = null;
        try {
          const { data } = await supabase.from('contractors').select('*').eq('user_id', currentUser.id).single();
          contractorData = data;
        } catch (e) {
          console.warn('Error loading contractor profile, will attempt insert:', e);
        }

        if (!contractorData) {
          const { data: newContractor, error: newContractorErr } = await supabase.from('contractors').insert({
            user_id: currentUser.id,
            phone: '',
            preferences: {}
          }).select().single();
          if (newContractor) {
            contractorData = newContractor;
          } else if (newContractorErr) {
            console.error('Failed to create default contractor entry:', newContractorErr);
          }
        }
        setUserProfile(contractorData);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  };

  const loginWithRole = async (email, password) => {
    setIsLoadingAuth(true);
    setAuthError(null);

    try {
      console.log('Attempting login for:', email);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      console.log('Login result:', { data, error });
      
      if (error) {
        console.error('Login error:', error);
        setIsLoadingAuth(false);
        return { error };
      }

      if (data?.user) {
        console.log('User logged in, loading profile...');
        await loadUserProfile(data.user);
        setIsLoadingAuth(false);
        return { user: data.user, error: null };
      }
      setIsLoadingAuth(false);
      return { error: { message: 'Nenhum usuário encontrado.' } };
    } catch (err) {
      console.error('Login exception:', err);
      setIsLoadingAuth(false);
      return { error: { message: err.message || 'Falha ao autenticar.' } };
    }
  };

  const signUpWithRole = async ({ email, password, name, role, phone }) => {
    setIsLoadingAuth(true);
    setAuthError(null);

    try {
      // Step 1: try supabase auth signup
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, role, avatar_url: '' }
        }
      });

      if (!error && data?.user) {
        await loadUserProfile(data.user);
        if (!data.session && !import.meta.env.VITE_USE_MOCK) {
          return {
            user: data.user,
            error: { message: 'Conta criada com sucesso! Enviamos um e-mail de confirmação para você. Por favor, confirme o seu e-mail para poder entrar.' }
          };
        }
        return { user: data.user, error: null };
      }

      // Step 2: fallback to RPC if auth.signUp fails (pgcrypto not installed)
      console.warn('auth.signUp failed, trying RPC fallback:', error?.message);
      const { data: rpcData, error: rpcError } = await supabase.rpc('create_user_direct', {
        user_email: email,
        user_password: password,
        user_name: name,
        user_role: role,
        user_phone: phone || ''
      });

      if (rpcError) {
        return { error: rpcError };
      }

      // Step 3: log in with the newly created user
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) {
        return { error: { message: 'Conta criada, mas falha ao fazer login automático. Tente entrar manualmente.' } };
      }

      // Step 4: reload everything
      const { data: { user: freshUser } } = await supabase.auth.getUser();
      if (freshUser) {
        await loadUserProfile(freshUser);
        return { user: freshUser, error: null };
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
