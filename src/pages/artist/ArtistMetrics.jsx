import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, MapPin, Music, Star, Heart, Calendar } from 'lucide-react';
import AppLayout from '../../components/shared/AppLayout';
import { useAuth } from '../../lib/AuthContext';
import StatCard from '../../components/ui/StatCard';
import { supabase } from '../../lib/supabaseClient';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export default function ArtistMetrics() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [artistProfile, setArtistProfile] = useState(null);
  const [musicRequests, setMusicRequests] = useState([]);

  useEffect(() => {
    async function loadArtistData() {
      if (!user?.id) return;
      try {
        const { data: profile } = await supabase
          .from('artists')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (profile) {
          setArtistProfile(profile);
          const { data: eventsData } = await supabase
            .from('events')
            .select('*')
            .eq('artist_id', profile.id);

          if (eventsData) {
            setEvents(eventsData);
          }

          const { data: requestsData } = await supabase
            .from('music_requests')
            .select('musica_titulo, musica_artista, amount, user_name, requested_at')
            .eq('artist_id', profile.id);

          if (requestsData) {
            setMusicRequests(requestsData);
          }
        }
      } catch (err) {
        console.error('Error loading metrics data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadArtistData();
  }, [user]);

  const confirmedEvents = events.filter(e => e.status === 'confirmed' || e.status === 'paid');
  const totalEarned = confirmedEvents.reduce((sum, e) => sum + (e.fee_proposed || 0), 0);

  // Group by city
  const cityCounts = {};
  confirmedEvents.forEach(e => {
    const city = e.address?.split(',')[1]?.trim() || 'São Paulo';
    cityCounts[city] = (cityCounts[city] || 0) + 1;
  });
  const cityData = Object.entries(cityCounts).map(([city, count]) => ({ city, shows: count }));
  if (cityData.length === 0) {
    cityData.push({ city: 'São Paulo', shows: 0 });
  }

  // Top pedidos reais, agrupados por música (music_requests)
  const songCounts = {};
  musicRequests.forEach(r => {
    const title = r.musica_titulo || 'Música não identificada';
    if (!songCounts[title]) songCounts[title] = { song: title, plays: 0, tips: 0 };
    songCounts[title].plays += 1;
    songCounts[title].tips += r.amount || 0;
  });
  const topSongs = Object.values(songCounts)
    .sort((a, b) => b.plays - a.plays)
    .slice(0, 3);
  const maxPlays = topSongs.length > 0 ? topSongs[0].plays : 0;

  // Gorjetas: total acumulado, total do mês atual e maior doador (dados reais de music_requests)
  const totalTips = musicRequests.reduce((sum, r) => sum + (r.amount || 0), 0);
  const now = new Date();
  const monthTips = musicRequests
    .filter(r => {
      if (!r.requested_at) return false;
      const d = new Date(r.requested_at);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    })
    .reduce((sum, r) => sum + (r.amount || 0), 0);

  const donorTotals = {};
  musicRequests.forEach(r => {
    if (!r.amount) return;
    const name = r.user_name || 'Fã anônimo';
    donorTotals[name] = (donorTotals[name] || 0) + r.amount;
  });
  const topDonor = Object.entries(donorTotals).sort((a, b) => b[1] - a[1])[0];

  return (
    <AppLayout role="artist" userName={user?.name || ''}>
      <div className="px-4 py-5 space-y-6">
        <div>
          <h1 className="text-white font-bold text-xl">Métricas de Performance</h1>
          <p className="text-gray-400 text-sm">Acompanhe seu crescimento</p>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center bg-white/5 rounded-2xl border border-white/5">
            <div className="w-6 h-6 border-2 border-neon-purple border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard title="Seguidores totais" value={artistProfile?.followers?.toLocaleString() || '0'} icon={Users} iconColor="purple" delay={0.0} />
              <StatCard title="Cachês Recebidos" value={`R$ ${totalEarned.toLocaleString()}`} icon={TrendingUp} iconColor="green" delay={0.1} />
              <StatCard title="Avaliação média" value={`${artistProfile?.rating || '0.0'} ⭐`} icon={Star} iconColor="purple" delay={0.2} />
              <StatCard title="Shows Confirmados" value={`${confirmedEvents.length} Shows`} icon={Calendar} iconColor="green" delay={0.3} />
            </div>

            {/* Cities Chart */}
            <div className="bg-white/5 border border-white/8 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-4 h-4 text-neon-purple" />
                <h3 className="text-white font-semibold text-sm">Cidades com Maior Audiência</h3>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={cityData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#9CA3AF', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="city" tick={{ fill: '#9CA3AF', fontSize: 10 }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip
                    content={({ active, payload }) => active && payload?.length ? (
                      <div className="bg-[#0F0926] border border-white/10 rounded-xl p-3 text-xs">
                        <p style={{ color: '#7B2EFF' }} className="font-semibold">{payload[0]?.value} shows</p>
                      </div>
                    ) : null}
                  />
                  <Bar dataKey="shows" fill="url(#barGrad)" radius={[0, 6, 6, 0]} />
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#7B2EFF" />
                      <stop offset="100%" stopColor="#39FF6A" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top Songs */}
            <div className="bg-white/5 border border-white/8 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <Music className="w-4 h-4 text-neon-green" />
                <h3 className="text-white font-semibold text-sm">Músicas Mais Tocadas</h3>
              </div>
              {topSongs.length === 0 ? (
                <p className="text-gray-500 text-xs text-center py-4">Nenhum pedido de música recebido ainda.</p>
              ) : (
              <div className="space-y-3">
                {topSongs.map((song, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                    className="flex items-center gap-3">
                    <span className="text-gray-500 font-bold text-xs w-4">#{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-white text-sm font-medium">{song.song}</p>
                        <div className="flex items-center gap-1.5">
                          <span className="text-neon-green text-xs font-semibold">{song.tips > 0 ? `R$ ${song.tips.toLocaleString('pt-BR')}` : ''}</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${maxPlays > 0 ? (song.plays / maxPlays) * 100 : 0}%` }}
                          transition={{ delay: 0.3 + i * 0.08, duration: 0.8 }}
                          className="h-full rounded-full"
                          style={{ background: 'linear-gradient(90deg, #7B2EFF, #39FF6A)' }}
                        />
                      </div>
                      <p className="text-gray-500 text-[10px] mt-0.5">{song.plays.toLocaleString()} pedido{song.plays === 1 ? '' : 's'}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              )}
            </div>

            {/* Gorjetas & Engajamento */}
            <div className="bg-white/5 border border-white/8 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <Heart className="w-4 h-4 text-neon-purple" />
                <h3 className="text-white font-semibold text-sm">Gorjetas & Engajamento</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <p className="text-gray-500 text-[10px] uppercase font-bold">Gorjetas acumuladas</p>
                  <p className="text-white font-bold text-base mt-1">R$ {totalTips.toLocaleString('pt-BR')}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <p className="text-gray-500 text-[10px] uppercase font-bold">Gorjetas este mês</p>
                  <p className="text-white font-bold text-base mt-1">R$ {monthTips.toLocaleString('pt-BR')}</p>
                </div>
              </div>
              {topDonor ? (
                <div className="mt-3 p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-[10px] uppercase font-bold">Maior doador</p>
                    <p className="text-white text-sm font-medium mt-0.5">{topDonor[0]}</p>
                  </div>
                  <p className="text-neon-green text-sm font-bold">R$ {topDonor[1].toLocaleString('pt-BR')}</p>
                </div>
              ) : (
                <p className="text-gray-500 text-xs text-center mt-3">Nenhuma gorjeta recebida ainda.</p>
              )}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}