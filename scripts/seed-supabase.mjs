import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = readFileSync('.env', 'utf8');
const key = env.match(/SUPABASE_SERVICE_KEY=(.*)/)[1].trim();
const url = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();

const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const userIds = {
  'lucas@gmail.com': 'a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e1',
  'joao@gmail.com': 'a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e2',
  'maria@gmail.com': 'a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e3',
  'laxy@gmail.com': 'a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e4',
  'novaera@gmail.com': 'a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e5',
  'sofia@gmail.com': 'a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e6',
  'matteus@gmail.com': 'a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e7',
  'samba@gmail.com': 'a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e8',
};

const artistIds = {
  'Lucas Volta': 'b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b1',
  'Laxy Music': 'b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b2',
  'Banda Nova Era': 'b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b3',
  'Sofia Neon': 'b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b4',
  'Dj Matteus': 'b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b5',
  'Trio Samba Amor': 'b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b6',
};

const venueId = 'c0c0c0c0-c0c0-c0c0-c0c0-c0c0c0c0c0c1';
const contractorId = 'd0d0d0d0-d0d0-d0d0-d0d0-d0d0d0d0d0d1';

async function main() {
  console.log('Step 1: Find existing auth user for lucas@gmail.com...');
  const { data: users } = await supabase.auth.admin.listUsers();
  const lucasAuthUser = users?.users?.find(u => u.email === 'lucas@gmail.com');
  const venueAuthUser = users?.users?.find(u => u.email === 'maximiano.nathan004@gmail.com');
  const mariaAuthUser = users?.users?.find(u => u.email === 'maria-fernanda-alfarenga@tuamaeaquelaursa.com');

  console.log(`  Lucas auth id: ${lucasAuthUser?.id || 'NOT FOUND'}`);
  console.log(`  Venue auth id: ${venueAuthUser?.id || 'NOT FOUND (need to use hardcoded)'}`);
  console.log(`  Maria auth id: ${mariaAuthUser?.id || 'NOT FOUND'}`);

  // Clear existing data first
  console.log('\nStep 2: Clear existing data...');
  for (const table of ['reviews', 'payments', 'contracts', 'events', 'favorites', 'agendas', 'messages', 'notifications', 'musicas_repertorio', 'contractors', 'venues', 'artists', 'users']) {
    await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
  }
  console.log('  Cleared all tables');

  // Step 3: Insert public.users with hardcoded UUIDs
  console.log('\nStep 3: Create users...');
  const userRows = [
    { id: userIds['lucas@gmail.com'], email: 'lucas@gmail.com', name: 'Lucas Volta', role: 'artist', avatar_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop' },
    { id: userIds['joao@gmail.com'], email: 'joao@gmail.com', name: 'João Silva', role: 'venue', avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop' },
    { id: userIds['maria@gmail.com'], email: 'maria@gmail.com', name: 'Maria Santos', role: 'contractor', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop' },
    { id: userIds['laxy@gmail.com'], email: 'laxy@gmail.com', name: 'Laxy Music', role: 'artist', avatar_url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=200&h=200&fit=crop' },
    { id: userIds['novaera@gmail.com'], email: 'novaera@gmail.com', name: 'Banda Nova Era', role: 'artist', avatar_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=crop' },
    { id: userIds['sofia@gmail.com'], email: 'sofia@gmail.com', name: 'Sofia Neon', role: 'artist', avatar_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&h=200&fit=crop' },
    { id: userIds['matteus@gmail.com'], email: 'matteus@gmail.com', name: 'Dj Matteus', role: 'artist', avatar_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=200&fit=crop' },
    { id: userIds['samba@gmail.com'], email: 'samba@gmail.com', name: 'Trio Samba Amor', role: 'artist', avatar_url: 'https://images.unsplash.com/photo-1504898770365-14faca6a7320?w=200&h=200&fit=crop' },
  ];

  for (const u of userRows) {
    const { error } = await supabase.from('users').upsert(u, { onConflict: 'id' });
    if (error) console.error(`  Error inserting ${u.email}:`, error.message);
    else console.log(`  Created user: ${u.email}`);
  }

  // Step 4: Insert artists
  console.log('\nStep 4: Create artists...');
  const artists = [
    { id: artistIds['Lucas Volta'], user_id: userIds['lucas@gmail.com'], artistic_name: 'Lucas Volta', genre: 'Sertanejo', city: 'São Paulo', bio: 'Cantor solo de sertanejo universitário, tocando o melhor do modão e hits atuais.', base_fee: 2800, rating: 4.9, followers: 103000, photo_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop', verified: true, featured: true, video_portfolio_urls: ['https://www.youtube.com/watch?v=mock1', 'https://www.youtube.com/watch?v=mock2'], music_playlist_urls: ['https://open.spotify.com/playlist/mock'], presentation_video_url: 'https://assets.mixkit.co/videos/preview/mixkit-singer-singing-into-a-microphone-in-a-studio-41712-large.mp4' },
    { id: artistIds['Laxy Music'], user_id: userIds['laxy@gmail.com'], artistic_name: 'Laxy Music', genre: 'Pop', city: 'Rio de Janeiro', bio: 'Show pop acústico e eletrizante para animar noites de estabelecimentos e festas.', base_fee: 2200, rating: 4.7, followers: 89000, photo_url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=400&fit=crop', verified: true, live_now: true, video_portfolio_urls: [], music_playlist_urls: [], presentation_video_url: 'https://assets.mixkit.co/videos/preview/mixkit-musician-playing-acoustic-guitar-41584-large.mp4' },
    { id: artistIds['Banda Nova Era'], user_id: userIds['novaera@gmail.com'], artistic_name: 'Banda Nova Era', genre: 'Rock', city: 'Belo Horizonte', bio: 'Banda cover de clássicos do rock nacional e internacional.', base_fee: 4500, rating: 4.8, followers: 67000, photo_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop', verified: true, featured: true, video_portfolio_urls: [], music_playlist_urls: [], presentation_video_url: 'https://assets.mixkit.co/videos/preview/mixkit-guitarist-performing-on-stage-at-a-concert-41589-large.mp4' },
    { id: artistIds['Sofia Neon'], user_id: userIds['sofia@gmail.com'], artistic_name: 'Sofia Neon', genre: 'Pop', city: 'São Paulo', bio: 'Cantora e compositora pop, ideal para bares refinados e eventos intimistas.', base_fee: 1800, rating: 4.6, followers: 54000, photo_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop', verified: true, video_portfolio_urls: [], music_playlist_urls: [], presentation_video_url: 'https://assets.mixkit.co/videos/preview/mixkit-singer-singing-into-a-microphone-in-a-studio-41712-large.mp4' },
    { id: artistIds['Dj Matteus'], user_id: userIds['matteus@gmail.com'], artistic_name: 'Dj Matteus', genre: 'Eletrônico', city: 'São Paulo', bio: 'Set moderno de house music, deep house e hits remixados.', base_fee: 3200, rating: 4.8, followers: 112000, photo_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop', verified: true, live_now: true, featured: true, video_portfolio_urls: [], music_playlist_urls: [], presentation_video_url: 'https://assets.mixkit.co/videos/preview/mixkit-electronic-music-producer-working-in-his-studio-41724-large.mp4' },
    { id: artistIds['Trio Samba Amor'], user_id: userIds['samba@gmail.com'], artistic_name: 'Trio Samba Amor', genre: 'Samba', city: 'Rio de Janeiro', bio: 'A essência do samba carioca e pagode noventista para animar seu final de semana.', base_fee: 2500, rating: 4.9, followers: 78000, photo_url: 'https://images.unsplash.com/photo-1504898770365-14faca6a7320?w=400&h=400&fit=crop', verified: true, video_portfolio_urls: [], music_playlist_urls: [], presentation_video_url: 'https://assets.mixkit.co/videos/preview/mixkit-musician-playing-acoustic-guitar-41584-large.mp4' },
  ];

  for (const a of artists) {
    const { error } = await supabase.from('artists').upsert(a, { onConflict: 'id' });
    if (error) console.error(`  Error inserting ${a.artistic_name}:`, error.message);
    else console.log(`  Created artist: ${a.artistic_name}`);
  }

  // Step 5: Insert venue
  console.log('\nStep 5: Create venue...');
  await supabase.from('venues').upsert({
    id: venueId,
    user_id: userIds['joao@gmail.com'],
    venue_name: 'Bar do João',
    city: 'São Paulo',
    address: 'Rua das Flores, 123 - Pinheiros',
    capacity: 250,
    bio: 'O melhor bar com música ao vivo da região de Pinheiros.',
    average_budget: 8000,
    logo_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100&h=100&fit=crop'
  }, { onConflict: 'id' });
  console.log('  Created venue');

  // Step 6: Insert contractor
  console.log('\nStep 6: Create contractor...');
  await supabase.from('contractors').upsert({
    id: contractorId,
    user_id: userIds['maria@gmail.com'],
    phone: '+5511999999999',
    preferences: { preferred_genre: 'Pop', event_type: 'Casamento' }
  }, { onConflict: 'id' });
  console.log('  Created contractor');

  // Step 7: Insert musicas_repertorio for Lucas Volta
  console.log('\nStep 7: Create musicas_repertorio...');
  const musicas = [
    { artista_id: artistIds['Lucas Volta'], titulo: 'Erro Planejado', artista_nome: 'Luan Santana', genero: 'Sertanejo', duracao_seg: 210 },
    { artista_id: artistIds['Lucas Volta'], titulo: 'Namorando Ou Não', artista_nome: 'Luan Santana', genero: 'Sertanejo', duracao_seg: 195 },
    { artista_id: artistIds['Lucas Volta'], titulo: 'Zona de Perigo', artista_nome: 'Luan Santana', genero: 'Sertanejo', duracao_seg: 200 },
    { artista_id: artistIds['Lucas Volta'], titulo: 'Aquela Pessoa', artista_nome: 'Henrique & Juliano', genero: 'Sertanejo', duracao_seg: 185 },
    { artista_id: artistIds['Lucas Volta'], titulo: 'Rancorosa', artista_nome: 'Henrique & Juliano', genero: 'Sertanejo', duracao_seg: 190 },
    { artista_id: artistIds['Lucas Volta'], titulo: 'A Maior Saudade', artista_nome: 'Henrique & Juliano', genero: 'Sertanejo', duracao_seg: 205 },
    { artista_id: artistIds['Lucas Volta'], titulo: 'Vai Dar PT', artista_nome: 'Guilherme & Benuto', genero: 'Sertanejo', duracao_seg: 215 },
    { artista_id: artistIds['Lucas Volta'], titulo: 'Coração Na Cama', artista_nome: 'Hugo & Guilherme', genero: 'Sertanejo', duracao_seg: 198 },
    { artista_id: artistIds['Lucas Volta'], titulo: 'Leão', artista_nome: 'Marília Mendonça', genero: 'Sertanejo', duracao_seg: 175 },
    { artista_id: artistIds['Lucas Volta'], titulo: 'Amava Nada', artista_nome: 'Marília Mendonça', genero: 'Sertanejo', duracao_seg: 188 },
    { artista_id: artistIds['Lucas Volta'], titulo: 'Folgado', artista_nome: 'Marília Mendonça', genero: 'Sertanejo', duracao_seg: 192 },
    { artista_id: artistIds['Lucas Volta'], titulo: 'Não Me Envergonha', artista_nome: 'Gusttavo Lima', genero: 'Sertanejo', duracao_seg: 202 },
    { artista_id: artistIds['Lucas Volta'], titulo: 'Bloqueado', artista_nome: 'Gusttavo Lima', genero: 'Sertanejo', duracao_seg: 195 },
    { artista_id: artistIds['Lucas Volta'], titulo: 'Ficha Limpa', artista_nome: 'Zé Neto & Cristiano', genero: 'Sertanejo', duracao_seg: 210 },
    { artista_id: artistIds['Lucas Volta'], titulo: 'Notificação Preferida', artista_nome: 'Zé Neto & Cristiano', genero: 'Sertanejo', duracao_seg: 185 },
    { artista_id: artistIds['Lucas Volta'], titulo: 'Meu Bem', artista_nome: 'Jorge & Mateus', genero: 'Sertanejo', duracao_seg: 178 },
    { artista_id: artistIds['Lucas Volta'], titulo: 'Cheirosa', artista_nome: 'Jorge & Mateus', genero: 'Sertanejo', duracao_seg: 195 },
    { artista_id: artistIds['Lucas Volta'], titulo: 'Hackearam-Me', artista_nome: 'Jorge & Mateus', genero: 'Sertanejo', duracao_seg: 200 },
    { artista_id: artistIds['Lucas Volta'], titulo: 'Canudinho', artista_nome: 'Simone Mendes', genero: 'Sertanejo', duracao_seg: 188 },
    { artista_id: artistIds['Lucas Volta'], titulo: 'Erro Gostoso', artista_nome: 'Simone Mendes', genero: 'Sertanejo', duracao_seg: 192 },
  ];

  const { error: musErr } = await supabase.from('musicas_repertorio').insert(musicas);
  if (musErr) console.error('  Error inserting musicas:', musErr.message);
  else console.log(`  Created ${musicas.length} musicas`);

  // Step 8: Insert events
  console.log('\nStep 8: Create events...');
  await supabase.from('events').upsert({
    title: 'Sertanejo Universitário', description: 'Show principal Lucas Volta',
    date: '2026-05-20', time: '21:00', duration: 120, status: 'confirmed',
    fee_proposed: 1800, fee_agreed: 1800,
    address: 'Rua das Flores, 123 - Pinheiros', artist_id: artistIds['Lucas Volta']
  }, { onConflict: 'id' });
  console.log('  Created event 1');

  await supabase.from('events').upsert({
    title: 'Sunset Party', description: 'Sunset Acoustic Pop',
    date: '2026-05-23', time: '17:00', duration: 180, status: 'pending',
    fee_proposed: 2200, address: 'Praia de Maresias, 500',
    artist_id: artistIds['Lucas Volta']
  }, { onConflict: 'id' });
  console.log('  Created event 2');

  await supabase.from('events').upsert({
    title: 'Aniversário da Maria', description: 'Show particular pop',
    date: '2026-05-30', time: '20:00', duration: 120, status: 'proposed',
    fee_proposed: 2000, address: 'Salão de Festas Jardins',
    artist_id: artistIds['Sofia Neon']
  }, { onConflict: 'id' });
  console.log('  Created event 3');

  // Step 9: Insert favorites
  console.log('\nStep 9: Create favorites...');
  await supabase.from('favorites').upsert({
    user_id: userIds['maria@gmail.com'], artist_id: artistIds['Banda Nova Era']
  }, { onConflict: 'id' });
  await supabase.from('favorites').upsert({
    user_id: userIds['maria@gmail.com'], artist_id: artistIds['Lucas Volta']
  }, { onConflict: 'id' });
  console.log('  Created 2 favorites');

  // Step 10: Insert notifications
  console.log('\nStep 10: Create notifications...');
  await supabase.from('notifications').upsert({
    user_id: userIds['lucas@gmail.com'],
    title: 'Cachê Recebido!',
    content: 'R$ 1.800 foi depositado em sua conta para o show de ontem.',
    type: 'payment', read: false
  }, { onConflict: 'id' });
  await supabase.from('notifications').upsert({
    user_id: userIds['joao@gmail.com'],
    title: 'Proposta Enviada',
    content: 'Sua proposta de contratação foi enviada ao artista.',
    type: 'proposal', read: false
  }, { onConflict: 'id' });
  console.log('  Created 2 notifications');

  // Step 11: Insert review
  console.log('\nStep 11: Create review...');
  await supabase.from('reviews').upsert({
    reviewer_id: userIds['joao@gmail.com'],
    reviewee_id: userIds['lucas@gmail.com'],
    rating: 5, comment: 'Show incrível! Lotou a casa e o público cantou junto.'
  }, { onConflict: 'id' });
  console.log('  Created review');

  console.log('\n=== SEED COMPLETE ===');
  console.log('\nNote: Only lucas@gmail.com has an auth user.');
  console.log('Other demo emails need auth users created (signup not working via API).');
  console.log('The seed artists are VISIBLE to all real logged-in users.');

  // Verify
  console.log('\n=== Verification ===');
  const { data: a } = await supabase.from('artists').select('id, artistic_name, genre');
  console.log(`Total artists: ${a?.length || 0}`);
  for (const artist of a || []) {
    console.log(`  ${artist.artistic_name} (${artist.genre})`);
  }
}
main().catch(e => console.error(e));
