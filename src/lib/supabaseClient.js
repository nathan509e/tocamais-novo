// Supabase Client Wrapper with LocalStorage Fallback for local testing/development
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Define mock initial database records
const initialDb = {
  users: [
    { id: 'usr-lucas', email: 'lucas@gmail.com', name: 'Lucas Volta', role: 'artist', avatar_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop' },
    { id: 'usr-joao', email: 'joao@gmail.com', name: 'João Silva', role: 'venue', avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop' },
    { id: 'usr-maria', email: 'maria@gmail.com', name: 'Maria Santos', role: 'contractor', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop' }
  ],
  artists: [
    { 
      id: 'art-1', 
      user_id: 'usr-lucas', 
      artistic_name: 'Lucas Volta', 
      genre: 'Sertanejo', 
      city: 'São Paulo', 
      bio: 'Sertanejo Universitário de alta qualidade para o seu evento. Repertório animado e romântico.', 
      base_fee: 2800, 
      rating: 4.9, 
      followers: 103000, 
      photo_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop', 
      verified: true, 
      live_now: false, 
      featured: true, 
      video_portfolio_urls: ['https://www.youtube.com/watch?v=mock1', 'https://www.youtube.com/watch?v=mock2'],
      music_playlist_urls: ['https://open.spotify.com/playlist/mock'],
      presentation_video_url: 'https://assets.mixkit.co/videos/preview/mixkit-singer-singing-into-a-microphone-in-a-studio-41712-large.mp4'
    },
    { id: 'art-2', user_id: 'usr-laxy', artistic_name: 'Laxy Music', genre: 'Pop', city: 'Rio de Janeiro', bio: 'Show pop acústico e eletrizante para animar noites de estabelecimentos e festas.', base_fee: 2200, rating: 4.7, followers: 89000, photo_url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=400&fit=crop', verified: true, live_now: true, featured: false, presentation_video_url: 'https://assets.mixkit.co/videos/preview/mixkit-musician-playing-acoustic-guitar-41584-large.mp4' },
    { id: 'art-3', user_id: 'usr-novaera', artistic_name: 'Banda Nova Era', genre: 'Rock', city: 'Belo Horizonte', bio: 'Banda cover de clássicos do rock nacional e internacional.', base_fee: 4500, rating: 4.8, followers: 67000, photo_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop', verified: true, featured: true, live_now: false, presentation_video_url: 'https://assets.mixkit.co/videos/preview/mixkit-guitarist-performing-on-stage-at-a-concert-41589-large.mp4' },
    { id: 'art-4', user_id: 'usr-sofia', artistic_name: 'Sofia Neon', genre: 'Pop', city: 'São Paulo', bio: 'Cantora e compositora pop, ideal para bares refinados e eventos intimistas.', base_fee: 1800, rating: 4.6, followers: 54000, photo_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop', verified: true, featured: false, live_now: false, presentation_video_url: 'https://assets.mixkit.co/videos/preview/mixkit-singer-singing-into-a-microphone-in-a-studio-41712-large.mp4' },
    { id: 'art-5', user_id: 'usr-matteus', artistic_name: 'Dj Matteus', genre: 'Eletrônico', city: 'São Paulo', bio: 'Set moderno de house music, deep house e hits remixados.', base_fee: 3200, rating: 4.8, followers: 112000, photo_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop', verified: true, featured: true, live_now: true, presentation_video_url: 'https://assets.mixkit.co/videos/preview/mixkit-electronic-music-producer-working-in-his-studio-41724-large.mp4' },
    { id: 'art-6', user_id: 'usr-samba', artistic_name: 'Trio Samba Amor', genre: 'Samba', city: 'Rio de Janeiro', bio: 'A essência do samba carioca e pagode noventista para animar seu final de semana.', base_fee: 2500, rating: 4.9, followers: 78000, photo_url: 'https://images.unsplash.com/photo-1504898770365-14faca6a7320?w=400&h=400&fit=crop', verified: true, featured: false, live_now: false, presentation_video_url: 'https://assets.mixkit.co/videos/preview/mixkit-musician-playing-acoustic-guitar-41584-large.mp4' }
  ],
  venues: [
    { id: 'ven-1', user_id: 'usr-joao', venue_name: 'Bar do João', city: 'São Paulo', address: 'Rua das Flores, 123 - Pinheiros', capacity: 250, bio: 'O melhor bar com música ao vivo da região de Pinheiros.', average_budget: 8000.00, logo_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100&h=100&fit=crop' }
  ],
  contractors: [
    { id: 'con-1', user_id: 'usr-maria', phone: '+5511999999999', preferences: { preferred_genre: 'Pop', event_type: 'Casamento' } }
  ],
  events: [
    { id: 'evt-1', title: 'Sertanejo Universitário', description: 'Show principal Lucas Volta', date: '2026-05-20', time: '21:00', duration: 120, status: 'confirmed', fee_proposed: 1800, fee_agreed: 1800, address: 'Rua das Flores, 123 - Pinheiros', venue_id: 'ven-1', artist_id: 'art-1', contractor_id: null },
    { id: 'evt-2', title: 'Sunset Party', description: 'Sunset Acoustic Pop', date: '2026-05-23', time: '17:00', duration: 180, status: 'pending', fee_proposed: 2200, fee_agreed: null, address: 'Praia de Maresias, 500', venue_id: null, artist_id: 'art-1', contractor_id: 'con-1' },
    { id: 'evt-3', title: 'Aniversário da Maria', description: 'Show particular pop', date: '2026-05-30', time: '20:00', duration: 120, status: 'proposed', fee_proposed: 2000, fee_agreed: null, address: 'Salão de Festas Jardins', venue_id: null, artist_id: 'art-4', contractor_id: 'con-1' }
  ],
  contracts: [],
  payments: [
    { id: 'pay-1', event_id: 'evt-1', payer_id: 'usr-joao', payee_id: 'usr-lucas', amount: 1800, status: 'paid', method: 'Pix', created_at: '2026-05-19T20:00:00Z' }
  ],
  reviews: [
    { id: 'rev-1', reviewer_id: 'usr-joao', reviewee_id: 'usr-lucas', event_id: 'evt-1', rating: 5, comment: 'Show incrível! Lotou a casa e o público cantou junto.', created_at: '2026-05-20T00:00:00Z' }
  ],
  messages: [
    { id: 'msg-1', sender_id: 'usr-joao', receiver_id: 'usr-lucas', text: 'Olá Lucas, o cachê Pix foi liberado. Excelente show ontem!', created_at: '2026-05-20T10:00:00Z' },
    { id: 'msg-2', sender_id: 'usr-lucas', receiver_id: 'usr-joao', text: 'Valeu João! Pessoal super animado. Vamos fechar outra data em breve!', created_at: '2026-05-20T10:05:00Z' }
  ],
  notifications: [
    { id: 'not-1', user_id: 'usr-lucas', title: 'Cachê Recebido!', content: 'R$ 1.800 foi depositado em sua conta para o show de ontem.', read: false, type: 'payment', created_at: '2026-05-20T10:00:00Z' },
    { id: 'not-2', user_id: 'usr-joao', title: 'Proposta Enviada', content: 'Sua proposta de contratação foi enviada ao artista.', read: false, type: 'proposal', created_at: '2026-05-20T09:00:00Z' }
  ],
  agendas: [
    { id: 'age-1', artist_id: 'art-1', busy_date: '2026-05-22', note: 'Casamento particular' }
  ],
  favorites: [
    { id: 'fav-1', user_id: 'usr-maria', artist_id: 'art-1' },
    { id: 'fav-2', user_id: 'usr-maria', artist_id: 'art-3' }
  ]
};

// LocalStorage Helper functions
const loadStorage = (key, defaultVal) => {
  try {
    const val = localStorage.getItem(`tocamais_${key}`);
    if (!val) {
      localStorage.setItem(`tocamais_${key}`, JSON.stringify(defaultVal));
      return defaultVal;
    }
    return JSON.parse(val);
  } catch (e) {
    return defaultVal;
  }
};

const saveStorage = (key, val) => {
  try {
    localStorage.setItem(`tocamais_${key}`, JSON.stringify(val));
  } catch (e) {
    console.error('Error saving storage', e);
  }
};

// Database state
let db = {};
Object.keys(initialDb).forEach(k => {
  db[k] = loadStorage(k, initialDb[k]);
});

// A robust mock chain builder to emulate Supabase's fluent API
class MockSupabaseQueryBuilder {
  constructor(tableName) {
    this.tableName = tableName;
    this.filters = [];
    this.orderByVal = null;
    this.isSingle = false;
  }

  select(cols) {
    // Fluent chaining
    return this;
  }

  eq(column, value) {
    this.filters.push({ column, value, type: 'eq' });
    return this;
  }

  neq(column, value) {
    this.filters.push({ column, value, type: 'neq' });
    return this;
  }

  order(column, { ascending = true } = {}) {
    this.orderByVal = { column, ascending };
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  async insert(data) {
    const tableData = db[this.tableName] || [];
    const rows = Array.isArray(data) ? data : [data];
    const newRows = rows.map(r => ({
      id: r.id || `${this.tableName.substring(0,3)}-${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      ...r
    }));

    db[this.tableName] = [...tableData, ...newRows];
    saveStorage(this.tableName, db[this.tableName]);

    return { data: Array.isArray(data) ? newRows : newRows[0], error: null };
  }

  async update(data) {
    const tableData = db[this.tableName] || [];
    let updatedRows = [];

    db[this.tableName] = tableData.map(row => {
      // Check filters match
      const matches = this.filters.every(f => row[f.column] === f.value);
      if (matches) {
        const updated = { ...row, ...data };
        updatedRows.push(updated);
        return updated;
      }
      return row;
    });

    saveStorage(this.tableName, db[this.tableName]);
    return { data: this.isSingle ? updatedRows[0] : updatedRows, error: null };
  }

  async delete() {
    const tableData = db[this.tableName] || [];
    const remaining = tableData.filter(row => {
      return !this.filters.every(f => row[f.column] === f.value);
    });
    db[this.tableName] = remaining;
    saveStorage(this.tableName, remaining);
    return { error: null };
  }

  // To support thenable/async await
  async then(onfulfilled) {
    let result = [...(db[this.tableName] || [])];

    // Apply filters
    this.filters.forEach(f => {
      if (f.type === 'eq') {
        result = result.filter(row => row[f.column] === f.value);
      } else if (f.type === 'neq') {
        result = result.filter(row => row[f.column] !== f.value);
      }
    });

    // Apply sorting
    if (this.orderByVal) {
      const { column, ascending } = this.orderByVal;
      result.sort((a, b) => {
        if (a[column] < b[column]) return ascending ? -1 : 1;
        if (a[column] > b[column]) return ascending ? 1 : -1;
        return 0;
      });
    }

    const output = this.isSingle ? (result[0] || null) : result;
    return onfulfilled({ data: output, error: null });
  }
}

// Build mock client instance matching Supabase JS structure
const mockSupabase = {
  from: (tableName) => new MockSupabaseQueryBuilder(tableName),
  auth: {
    getUser: async () => {
      const current = loadStorage('auth_session', null);
      return { data: { user: current }, error: null };
    },
    getSession: async () => {
      const current = loadStorage('auth_session', null);
      return { data: { session: current ? { user: current } : null }, error: null };
    },
    signInWithPassword: async ({ email, password }) => {
      const users = db.users;
      const user = users.find(u => u.email === email);
      if (user) {
        saveStorage('auth_session', user);
        return { data: { user }, error: null };
      }
      return { data: null, error: { message: 'Usuário não encontrado.' } };
    },
    signUp: async ({ email, password, options }) => {
      const users = db.users;
      if (users.some(u => u.email === email)) {
        return { data: null, error: { message: 'E-mail já cadastrado.' } };
      }
      const newUser = {
        id: `usr-${Math.random().toString(36).substr(2, 9)}`,
        email,
        name: options?.data?.name || 'Novo Usuário',
        role: options?.data?.role || 'contractor',
        avatar_url: options?.data?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop'
      };
      
      // Save user to lists
      db.users.push(newUser);
      saveStorage('users', db.users);

      // Create profile table entry based on role
      if (newUser.role === 'artist') {
        db.artists.push({
          id: `art-${Math.random().toString(36).substr(2, 9)}`,
          user_id: newUser.id,
          artistic_name: newUser.name,
          genre: 'Pop',
          city: 'São Paulo',
          bio: 'Perfil de artista recém criado. Edite a biografia para atrair contratantes.',
          base_fee: 1000,
          rating: 5.0,
          followers: 0,
          photo_url: newUser.avatar_url,
          verified: false
        });
        saveStorage('artists', db.artists);
      } else if (newUser.role === 'venue') {
        db.venues.push({
          id: `ven-${Math.random().toString(36).substr(2, 9)}`,
          user_id: newUser.id,
          venue_name: `${newUser.name} Showhouse`,
          city: 'São Paulo',
          address: 'Av. Paulista, 1000',
          capacity: 100,
          average_budget: 2000
        });
        saveStorage('venues', db.venues);
      } else {
        db.contractors.push({
          id: `con-${Math.random().toString(36).substr(2, 9)}`,
          user_id: newUser.id,
          phone: '',
          preferences: {}
        });
        saveStorage('contractors', db.contractors);
      }

      saveStorage('auth_session', newUser);
      return { data: { user: newUser }, error: null };
    },
    signOut: async () => {
      saveStorage('auth_session', null);
      return { error: null };
    }
  }
};

// Check if credentials are set to choose either real Supabase or Local Simulator
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : mockSupabase;
