// Supabase Client Wrapper with LocalStorage Fallback for local testing/development
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Define mock initial database records
const initialDb = {
  users: [
    { id: 'usr-lucas', email: 'lucas@gmail.com', password: '123456', name: 'Lucas Volta', role: 'artist', avatar_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop' },
    { id: 'usr-joao', email: 'joao@gmail.com', password: '123456', name: 'João Silva', role: 'venue', avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop' },
    { id: 'usr-maria', email: 'maria@gmail.com', password: '123456', name: 'Maria Santos', role: 'contractor', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop' }
  ],
  artist_profiles: [],
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
      cover_url: 'https://images.unsplash.com/photo-1540039155733-5bb30b4f1519?w=800&h=400&fit=crop',
      photo_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop', 
      verified: true, 
      live_now: false, 
      featured: true, 
      video_portfolio_urls: ['https://www.youtube.com/watch?v=mock1', 'https://www.youtube.com/watch?v=mock2'],
      music_playlist_urls: ['https://open.spotify.com/playlist/mock'],
      presentation_video_url: 'https://assets.mixkit.co/videos/preview/mixkit-singer-singing-into-a-microphone-in-a-studio-41712-large.mp4',
      selected_musicas_ids: []
    },
    { id: 'art-2', user_id: 'usr-laxy', artistic_name: 'Laxy Music', genre: 'Pop', city: 'Rio de Janeiro', bio: 'Show pop acústico e eletrizante para animar noites de estabelecimentos e festas.', base_fee: 2200, rating: 4.7, followers: 89000, photo_url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=400&fit=crop', cover_url: '', verified: true, live_now: true, featured: false, presentation_video_url: 'https://assets.mixkit.co/videos/preview/mixkit-musician-playing-acoustic-guitar-41584-large.mp4', selected_musicas_ids: [] },
    { id: 'art-3', user_id: 'usr-novaera', artistic_name: 'Banda Nova Era', genre: 'Rock', city: 'Belo Horizonte', bio: 'Banda cover de clássicos do rock nacional e internacional.', base_fee: 4500, rating: 4.8, followers: 67000, photo_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop', cover_url: '', verified: true, featured: true, live_now: false, presentation_video_url: 'https://assets.mixkit.co/videos/preview/mixkit-guitarist-performing-on-stage-at-a-concert-41589-large.mp4', selected_musicas_ids: [] },
    { id: 'art-4', user_id: 'usr-sofia', artistic_name: 'Sofia Neon', genre: 'Pop', city: 'São Paulo', bio: 'Cantora e compositora pop, ideal para bares refinados e eventos intimistas.', base_fee: 1800, rating: 4.6, followers: 54000, photo_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop', cover_url: '', verified: true, featured: false, live_now: false, presentation_video_url: 'https://assets.mixkit.co/videos/preview/mixkit-singer-singing-into-a-microphone-in-a-studio-41712-large.mp4', selected_musicas_ids: [] },
    { id: 'art-5', user_id: 'usr-matteus', artistic_name: 'Dj Matteus', genre: 'Eletrônico', city: 'São Paulo', bio: 'Set moderno de house music, deep house e hits remixados.', base_fee: 3200, rating: 4.8, followers: 112000, photo_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop', cover_url: '', verified: true, featured: true, live_now: true, presentation_video_url: 'https://assets.mixkit.co/videos/preview/mixkit-electronic-music-producer-working-in-his-studio-41724-large.mp4', selected_musicas_ids: [] },
    { id: 'art-6', user_id: 'usr-samba', artistic_name: 'Trio Samba Amor', genre: 'Samba', city: 'Rio de Janeiro', bio: 'A essência do samba carioca e pagode noventista para animar seu final de semana.', base_fee: 2500, rating: 4.9, followers: 78000, photo_url: 'https://images.unsplash.com/photo-1504898770365-14faca6a7320?w=400&h=400&fit=crop', cover_url: '', verified: true, featured: false, live_now: false, presentation_video_url: 'https://assets.mixkit.co/videos/preview/mixkit-musician-playing-acoustic-guitar-41584-large.mp4', selected_musicas_ids: [] }
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
    { id: 'evt-3', title: 'Aniversário da Maria', description: 'Show particular pop', date: '2026-05-30', time: '20:00', duration: 120, status: 'proposed', fee_proposed: 2000, fee_agreed: null, address: 'Salão de Festas Jardins', venue_id: null, artist_id: 'art-4', contractor_id: 'con-1' },
    { 
      id: 'evt-test-proposal', 
      title: 'Sextaneja no Bar do João', 
      description: 'Show de Sertanejo Universitário animado', 
      date: '2026-06-12', 
      time: '21:00:00', 
      duration: 120, 
      status: 'pending_artist_approval', 
      fee_proposed: 3500, 
      fee_agreed: null, 
      address: 'Rua das Flores, 123 - Pinheiros', 
      venue_id: 'ven-1', 
      artist_id: 'art-1', 
      contractor_id: null,
      message: 'Olá Lucas Volta! Vimos o seu perfil no TocaMais e ficamos impressionados com o seu engajamento e repertório. Gostaríamos muito de contratá-lo para comandar a nossa "Sextaneja" no dia 12 de Junho no Bar do João. Oferecemos um cachê de R$ 3.500 com toda a estrutura de som inclusa!'
    }
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
  ],
  musicas_repertorio: [
    { id: 'mus-1', artista_id: 'art-1', titulo: 'Erro Planejado', artista_nome: 'Luan Santana', genero: 'Sertanejo', duracao_seg: 210 },
    { id: 'mus-2', artista_id: 'art-1', titulo: 'Namorando Ou Não', artista_nome: 'Luan Santana', genero: 'Sertanejo', duracao_seg: 195 },
    { id: 'mus-3', artista_id: 'art-1', titulo: 'Zona de Perigo', artista_nome: 'Luan Santana', genero: 'Sertanejo', duracao_seg: 200 },
    { id: 'mus-4', artista_id: 'art-1', titulo: 'Aquela Pessoa', artista_nome: 'Henrique & Juliano', genero: 'Sertanejo', duracao_seg: 185 },
    { id: 'mus-5', artista_id: 'art-1', titulo: 'Rancorosa', artista_nome: 'Henrique & Juliano', genero: 'Sertanejo', duracao_seg: 190 },
    { id: 'mus-6', artista_id: 'art-1', titulo: 'A Maior Saudade', artista_nome: 'Henrique & Juliano', genero: 'Sertanejo', duracao_seg: 205 },
    { id: 'mus-7', artista_id: 'art-1', titulo: 'Vai Dar PT', artista_nome: 'Guilherme & Benuto', genero: 'Sertanejo', duracao_seg: 215 },
    { id: 'mus-8', artista_id: 'art-1', titulo: 'Coração Na Cama', artista_nome: 'Hugo & Guilherme', genero: 'Sertanejo', duracao_seg: 198 },
    { id: 'mus-9', artista_id: 'art-1', titulo: 'Leão', artista_nome: 'Marília Mendonça', genero: 'Sertanejo', duracao_seg: 175 },
    { id: 'mus-10', artista_id: 'art-1', titulo: 'Amava Nada', artista_nome: 'Marília Mendonça', genero: 'Sertanejo', duracao_seg: 188 },
    { id: 'mus-11', artista_id: 'art-1', titulo: 'Folgado', artista_nome: 'Marília Mendonça', genero: 'Sertanejo', duracao_seg: 192 },
    { id: 'mus-12', artista_id: 'art-1', titulo: 'Não Me Envergonha', artista_nome: 'Gusttavo Lima', genero: 'Sertanejo', duracao_seg: 202 },
    { id: 'mus-13', artista_id: 'art-1', titulo: 'Bloqueado', artista_nome: 'Gusttavo Lima', genero: 'Sertanejo', duracao_seg: 195 },
    { id: 'mus-14', artista_id: 'art-1', titulo: 'Ficha Limpa', artista_nome: 'Zé Neto & Cristiano', genero: 'Sertanejo', duracao_seg: 210 },
    { id: 'mus-15', artista_id: 'art-1', titulo: 'Notificação Preferida', artista_nome: 'Zé Neto & Cristiano', genero: 'Sertanejo', duracao_seg: 185 },
    { id: 'mus-16', artista_id: 'art-1', titulo: 'Meu Bem', artista_nome: 'Jorge & Mateus', genero: 'Sertanejo', duracao_seg: 178 },
    { id: 'mus-17', artista_id: 'art-1', titulo: 'Cheirosa', artista_nome: 'Jorge & Mateus', genero: 'Sertanejo', duracao_seg: 195 },
    { id: 'mus-18', artista_id: 'art-1', titulo: 'Hackearam-Me', artista_nome: 'Jorge & Mateus', genero: 'Sertanejo', duracao_seg: 200 },
    { id: 'mus-19', artista_id: 'art-1', titulo: 'Canudinho', artista_nome: 'Simone Mendes', genero: 'Sertanejo', duracao_seg: 188 },
    { id: 'mus-20', artista_id: 'art-1', titulo: 'Erro Gostoso', artista_nome: 'Simone Mendes', genero: 'Sertanejo', duracao_seg: 192 }
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

// Force insert the test proposal if it is not present in local storage (guarantees simulator matches expectations)
const hasTestProposal = db.events?.some(e => e.id === 'evt-test-proposal');
if (!hasTestProposal && db.events) {
  const testProposal = initialDb.events.find(e => e.id === 'evt-test-proposal');
  if (testProposal) {
    db.events.push(testProposal);
    saveStorage('events', db.events);
  }
}

const makeMockId = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 11)}`;

const upsertIntoTable = (tableName, rows, conflictColumns = ['id']) => {
  const tableData = [...(db[tableName] || [])];
  const insertedRows = [];

  rows.forEach((row) => {
    const newRow = {
      id: row.id || makeMockId(tableName.substring(0, 3)),
      created_at: row.created_at || new Date().toISOString(),
      ...row
    };

    const matchIndex = tableData.findIndex((existing) =>
      conflictColumns.every((column) => existing[column] === newRow[column])
    );

    if (matchIndex >= 0) {
      tableData[matchIndex] = { ...tableData[matchIndex], ...newRow };
      insertedRows.push(tableData[matchIndex]);
    } else {
      tableData.push(newRow);
      insertedRows.push(newRow);
    }
  });

  db[tableName] = tableData;
  saveStorage(tableName, db[tableName]);
  return insertedRows;
};

const createMockAccount = ({ email, password, name, role, avatar_url }) => {
  const users = db.users;
  if (users.some(u => u.email === email)) {
    return { data: null, error: { message: 'E-mail já cadastrado.' } };
  }

  const newUser = {
    id: makeMockId('usr'),
    email,
    password,
    name: name || 'Novo Usuário',
    role: role || 'contractor',
    avatar_url: avatar_url || ''
  };

  db.users.push(newUser);
  saveStorage('users', db.users);

  if (newUser.role === 'artist') {
    const newArtistId = makeMockId('art');
    db.artist_profiles.push({
      id: newArtistId,
      user_id: newUser.id,
      artistic_name: newUser.name,
      genre: '',
      city: '',
      bio: '',
      base_fee: 0,
      rating: 0,
      followers: 0,
      photo_url: '',
      verified: false,
      selected_musicas_ids: []
    });
    db.artists.push({
      id: newArtistId,
      user_id: newUser.id,
      artistic_name: newUser.name,
      genre: '',
      city: '',
      bio: '',
      base_fee: 0,
      rating: 0,
      followers: 0,
      photo_url: '',
      cover_url: '',
      verified: false,
      live_now: false,
      featured: false,
      video_portfolio_urls: [],
      music_playlist_urls: [],
      presentation_video_url: '',
      selected_musicas_ids: []
    });
    saveStorage('artist_profiles', db.artist_profiles);
    saveStorage('artists', db.artists);
  } else if (newUser.role === 'venue') {
    db.venues.push({
      id: makeMockId('ven'),
      user_id: newUser.id,
      venue_name: '',
      city: '',
      address: '',
      capacity: 0,
      average_budget: 0
    });
    saveStorage('venues', db.venues);
  } else {
    db.contractors.push({
      id: makeMockId('con'),
      user_id: newUser.id,
      phone: '',
      preferences: {}
    });
    saveStorage('contractors', db.contractors);
  }

  saveStorage('auth_session', newUser);
  return { data: { user: newUser }, error: null };
};

const buildAdminOrders = () => {
  const requests = [...(db.music_requests || [])].sort((a, b) => new Date(b.requested_at || 0) - new Date(a.requested_at || 0));
  const artistsByUserId = new Map((db.artists || []).map(a => [a.user_id, a]));

  return requests.map((request) => ({
    ...request,
    artist: artistsByUserId.get(request.artist_id) || null
  }));
};

const createMockPixResponse = (body = {}) => {
  const amount = Number(body.amount) || 0;
  const pendingTip = {
    artist_id: body.artistUserId || null,
    user_name: body.userName || body.customerName || 'Cliente',
    user_message: body.userMessage || null,
    amount,
    status: 'pending',
    musica_id: body.musicaId || null,
    musica_titulo: body.musicaTitulo || null,
    musica_artista: body.musicaArtista || null,
    rating: body.rating || null
  };

  const inserted = upsertIntoTable('pending_tips', [pendingTip]);
  const pendingTipId = inserted[0]?.id || null;
  const pixPayload = `mock-pix-${pendingTipId || makeMockId('pix')}`;
  const pixQrCode = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO8F8iUAAAAASUVORK5CYII=';

  return {
    success: true,
    mode: 'static',
    pixQrCode,
    pixKey: pixPayload,
    pixPayload,
    pendingTipId
  };
};

const createMockPaymentResponse = (body = {}) => {
  const amount = Number(body.amount) || 0;
  const eventId = body.event_id || body.eventId || null;
  const event = (db.events || []).find(e => e.id === eventId) || null;
  const paymentId = makeMockId('pay');
  const paymentRow = {
    id: paymentId,
    event_id: eventId,
    payer_id: body.payer_id || body.payerId || 'usr-mock',
    payee_id: event?.artist_id || null,
    amount,
    status: 'paid',
    method: body.method || 'pix',
    transaction_hash: paymentId,
    created_at: new Date().toISOString()
  };

  db.payments.push(paymentRow);
  saveStorage('payments', db.payments);

  return {
    success: true,
    paymentId,
    mpPaymentId: paymentId,
    status: 'RECEIVED',
    qrCode: `mock-pix-${paymentId}`,
    qrCodeBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO8F8iUAAAAASUVORK5CYII=',
    ticketUrl: 'https://example.com/mock-boleto.pdf',
    bankSlipUrl: 'https://example.com/mock-boleto.pdf'
  };
};

const createMockSubaccountResponse = (body = {}) => {
  const artistUserId = body.artistUserId || null;
  const artist = (db.artists || []).find(a => a.user_id === artistUserId) || null;
  const walletId = makeMockId('wallet');

  if (artist) {
    const updatedArtist = {
      ...artist,
      asaas_wallet_id: walletId,
      asaas_account_status: 'pending_verification',
      cpf_cnpj: (body.cpfCnpj || '').replace(/\D/g, '')
    };
    db.artists = db.artists.map(a => (a.user_id === artistUserId ? updatedArtist : a));
    saveStorage('artists', db.artists);
  }

  return {
    success: true,
    walletId,
    message: 'Conta Asaas criada com sucesso! Verifique seu email para ativar a conta.',
    accountStatus: 'pending_verification'
  };
};

// A robust mock chain builder to emulate Supabase's fluent API
class MockSupabaseQueryBuilder {
  constructor(tableName) {
    this.tableName = tableName;
    this.filters = [];
    this.orderByVal = null;
    this.isSingle = false;
    this.maybeSingleMode = false;
    this.limitVal = null;
    this.pendingOp = null;
  }

  select(cols) {
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

  in(column, values) {
    this.filters.push({ column, value: values, type: 'in' });
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

  maybeSingle() {
    this.maybeSingleMode = true;
    return this;
  }

  limit(count) {
    this.limitVal = count;
    return this;
  }

  update(data) {
    this.pendingOp = { type: 'update', data };
    return this;
  }

  upsert(data, options = {}) {
    this.pendingOp = { type: 'upsert', data, options };
    return this;
  }

  insert(data) {
    this.pendingOp = { type: 'insert', data };
    return this;
  }

  delete() {
    this.pendingOp = { type: 'delete' };
    return this;
  }

  async then(onfulfilled, onrejected) {
    try {
      let filtered = [...(db[this.tableName] || [])];

      this.filters.forEach(f => {
        if (f.type === 'eq') {
          filtered = filtered.filter(row => row[f.column] === f.value);
        } else if (f.type === 'neq') {
          filtered = filtered.filter(row => row[f.column] !== f.value);
        } else if (f.type === 'in') {
          const set = new Set(f.value || []);
          filtered = filtered.filter(row => set.has(row[f.column]));
        }
      });

      if (this.pendingOp?.type === 'update') {
        const updatedRows = [];
        const ids = new Set(filtered.map(r => r.id));
        db[this.tableName] = db[this.tableName].map(row => {
          if (ids.has(row.id)) {
            const updated = { ...row, ...this.pendingOp.data };
            updatedRows.push(updated);
            return updated;
          }
          return row;
        });
        saveStorage(this.tableName, db[this.tableName]);
        const output = this.isSingle ? (updatedRows[0] || null) : updatedRows;
        return onfulfilled({ data: output, error: null });
      }

      if (this.pendingOp?.type === 'upsert') {
        const rows = Array.isArray(this.pendingOp.data) ? this.pendingOp.data : [this.pendingOp.data];
        const conflictColumns = String(this.pendingOp.options?.onConflict || 'id')
          .split(',')
          .map(column => column.trim())
          .filter(Boolean);
        const upsertedRows = upsertIntoTable(this.tableName, rows, conflictColumns);
        const output = this.isSingle ? (upsertedRows[0] || null) : upsertedRows;
        return onfulfilled({ data: output, error: null });
      }

      if (this.pendingOp?.type === 'insert') {
        const rows = Array.isArray(this.pendingOp.data) ? this.pendingOp.data : [this.pendingOp.data];
        const insertedRows = rows.map(r => ({
          id: r.id || makeMockId(this.tableName.substring(0, 3)),
          created_at: new Date().toISOString(),
          ...r
        }));

        db[this.tableName] = [...(db[this.tableName] || []), ...insertedRows];
        saveStorage(this.tableName, db[this.tableName]);

        const output = this.isSingle ? (insertedRows[0] || null) : insertedRows;
        return onfulfilled({ data: output, error: null });
      }

      if (this.pendingOp?.type === 'delete') {
        const ids = new Set(filtered.map(r => r.id));
        db[this.tableName] = db[this.tableName].filter(row => !ids.has(row.id));
        saveStorage(this.tableName, db[this.tableName]);
        return onfulfilled({ error: null, data: null });
      }

      if (this.orderByVal) {
        const { column, ascending } = this.orderByVal;
        filtered.sort((a, b) => {
          if (a[column] < b[column]) return ascending ? -1 : 1;
          if (a[column] > b[column]) return ascending ? 1 : -1;
          return 0;
        });
      }

      if (this.limitVal !== null) {
        filtered = filtered.slice(0, this.limitVal);
      }

      const output = this.isSingle || this.maybeSingleMode ? (filtered[0] || null) : filtered;
      if (this.isSingle && filtered.length === 0) {
        return onfulfilled({ data: null, error: { message: 'Row not found' } });
      }
      return onfulfilled({ data: output, error: null });
    } catch (error) {
      if (onrejected) {
        return onrejected(error);
      }
      throw error;
    }
  }
}

// Build mock client instance matching Supabase JS structure
const mockSupabase = {
  from: (tableName) => new MockSupabaseQueryBuilder(tableName),
  rpc: async (functionName, args = {}) => {
    if (functionName === 'create_user_direct') {
      return createMockAccount({
        email: args.user_email,
        password: args.user_password,
        name: args.user_name,
        role: args.user_role,
        avatar_url: ''
      });
    }

    if (functionName === 'increment_sync_count') {
      return { data: 1, error: null };
    }

    return { data: null, error: null };
  },
  auth: {
    getUser: async () => {
      const current = loadStorage('auth_session', null);
      return { data: { user: current }, error: null };
    },
    getSession: async () => {
      const current = loadStorage('auth_session', null);
      return { data: { session: current ? { user: current, access_token: 'mock-access-token' } : null }, error: null };
    },
    signInWithPassword: async ({ email, password }) => {
      const users = db.users;
      const user = users.find(u => u.email === email);
      if (user && user.password === password) {
        saveStorage('auth_session', user);
        return { data: { user, session: { user, access_token: 'mock-access-token' } }, error: null };
      }
      return { data: null, error: { message: 'E-mail ou senha inválidos.' } };
    },
    signUp: async ({ email, password, options }) => {
      return createMockAccount({
        email,
        password,
        name: options?.data?.name,
        role: options?.data?.role,
        avatar_url: options?.data?.avatar_url || ''
      });
    },
    signOut: async () => {
      saveStorage('auth_session', null);
      return { error: null };
    }
  },
  channel: () => ({
    on: () => ({
      on: () => ({
        subscribe: () => ({})
      }),
      subscribe: () => ({})
    }),
    subscribe: () => ({})
  }),
  removeChannel: async () => ({ error: null }),
  functions: {
    invoke: async (functionName, { body } = {}) => {
      if (functionName === 'get-admin-orders') {
        return { data: { success: true, data: buildAdminOrders() }, error: null };
      }

      if (functionName === 'asaas-create-pix') {
        return { data: createMockPixResponse(body), error: null };
      }

      if (functionName === 'asaas-create-payment') {
        return { data: createMockPaymentResponse(body), error: null };
      }

      if (functionName === 'asaas-check-payment') {
        return {
          data: {
            success: true,
            mpPaymentId: body?.payment_id || null,
            mpStatus: 'approved',
            asaasStatus: 'RECEIVED',
            statusDetail: 'RECEIVED',
            paidAt: new Date().toISOString()
          },
          error: null
        };
      }

      if (functionName === 'asaas-create-subaccount') {
        return { data: createMockSubaccountResponse(body), error: null };
      }

      if (functionName === 'asaas-process-tip') {
        return { data: createMockPixResponse(body), error: null };
      }

      if (functionName === 'stripe-process-tip') {
        return { data: { success: true }, error: null };
      }

      return { data: { success: true }, error: null };
    }
  },
  storage: {
    from: (bucketName) => ({
      upload: async (path, file) => {
        try {
          const reader = new FileReader();
          const base64Promise = new Promise((resolve, reject) => {
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = (e) => reject(e);
            reader.readAsDataURL(file);
          });
          const base64Data = await base64Promise;

          let mockStorage = {};
          try {
            mockStorage = JSON.parse(localStorage.getItem('tocamais_mock_storage') || '{}');
          } catch(e) {
            mockStorage = window.mockStorageData || {};
          }
          mockStorage[path] = base64Data;
          window.mockStorageData = mockStorage;
          try {
            localStorage.setItem('tocamais_mock_storage', JSON.stringify(mockStorage));
          } catch(e) {
            console.warn('Storage limit reached, keeping mock file in memory only');
          }

          return { data: { path }, error: null };
        } catch (e) {
          return { data: null, error: e };
        }
      },
      getPublicUrl: (path) => {
        let mockStorage = {};
        try {
          mockStorage = JSON.parse(localStorage.getItem('tocamais_mock_storage') || '{}');
        } catch(e) {
          mockStorage = window.mockStorageData || {};
        }
        const url = mockStorage[path] || 'https://images.unsplash.com/photo-1540039155733-5bb30b4f1519?w=800&h=400&fit=crop';
        return { data: { publicUrl: url } };
      }
    })
  }
};

// Check if credentials are set to choose either real Supabase or Local Simulator
// Use VITE_USE_MOCK=true env var to force mock mode (for demo accounts)
export const supabase = (supabaseUrl && supabaseAnonKey && !import.meta.env.VITE_USE_MOCK)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : mockSupabase;
