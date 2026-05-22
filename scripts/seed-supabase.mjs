import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://byghtatgozsthshmxaem.supabase.co';
const serviceRoleKey = process.argv[2];

if (!serviceRoleKey) {
  console.error('Uso: node scripts/seed-supabase.mjs <service_role_key>');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const demoUsers = [
  {
    email: 'lucas@gmail.com',
    password: '123456',
    id: 'a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e1',
    name: 'Lucas Volta',
    role: 'artist',
    avatar_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop',
    profile: {
      table: 'artists',
      id: 'b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b1',
      artistic_name: 'Lucas Volta',
      genre: 'Sertanejo',
      city: 'São Paulo',
      bio: 'Cantor solo de sertanejo universitário, tocando o melhor do modão e hits atuais.',
      base_fee: 2800.00,
      rating: 4.9,
      followers: 103000,
      photo_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
      verified: true,
      live_now: false,
      featured: true,
      video_portfolio_urls: ['https://www.youtube.com/watch?v=mock1', 'https://www.youtube.com/watch?v=mock2'],
      music_playlist_urls: ['https://open.spotify.com/playlist/mock'],
    },
  },
  {
    email: 'joao@gmail.com',
    password: '123456',
    id: 'a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e2',
    name: 'João Silva',
    role: 'venue',
    avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop',
    profile: {
      table: 'venues',
      id: 'c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c0c1',
      venue_name: 'Bar do João',
      city: 'São Paulo',
      address: 'Rua das Flores, 123 - Pinheiros',
      capacity: 250,
      bio: 'O melhor bar com música ao vivo da região de Pinheiros.',
      average_budget: 8000.00,
      logo_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100&h=100&fit=crop',
    },
  },
  {
    email: 'maria@gmail.com',
    password: '123456',
    id: 'a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e3',
    name: 'Maria Santos',
    role: 'contractor',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
    profile: {
      table: 'contractors',
      id: 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d1',
      phone: '+5511999999999',
      preferences: { preferred_genre: 'Pop', event_type: 'Casamento' },
    },
  },
];

console.log('\nIniciando seed do Supabase...\n');

for (const user of demoUsers) {
  console.log(`Criando usuário: ${user.email}...`);

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true,
    user_metadata: { name: user.name, role: user.role },
  });

  if (authError) {
    if (authError.message?.includes('already exists')) {
      console.log(`  -> Usuário já existe em auth.users`);
    } else {
      console.error(`  -> Erro auth: ${authError.message}`);
      continue;
    }
  } else {
    console.log(`  -> Criado em auth.users (id: ${authUser.user.id})`);
  }

  const userId = authUser?.user?.id || user.id;

  const { error: publicError } = await supabase.from('users').upsert({
    id: userId,
    email: user.email,
    name: user.name,
    role: user.role,
    avatar_url: user.avatar_url,
  }, { onConflict: 'email' });

  if (publicError) {
    console.error(`  -> Erro public.users: ${publicError.message}`);
    continue;
  }
  console.log(`  -> Inserido em public.users`);

  const profileData = { user_id: userId, ...user.profile };
  delete profileData.table;

  const { error: profileError } = await supabase
    .from(user.profile.table)
    .upsert(profileData, { onConflict: 'user_id' });

  if (profileError) {
    console.error(`  -> Erro ${user.profile.table}: ${profileError.message}`);
    continue;
  }
  console.log(`  -> Inserido em ${user.profile.table}`);
  console.log('');
}

console.log('Seed concluído!\n');
