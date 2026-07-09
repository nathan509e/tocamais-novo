import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, MapPin, Music, Star, Heart, Calendar } from 'lucide-react';
import AppLayout from '../../components/shared/AppLayout';
import { useAuth } from '../../lib/AuthContext';
import StatCard from '../../components/ui/StatCard';
import { supabase } from '../../lib/supabaseClient';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts';

export default function ArtistMetrics() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [artistProfile, setArtistProfile] = useState(null);

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

  const topSongs = [
    { song: 'Asa Branca', plays: Math.round((artistProfile?.followers || 150) * 2.4), trend: '+12%' },
    { song: 'O Xote das Meninas', plays: Math.round((artistProfile?.followers || 150) * 1.8), trend: '+5%' },
    { song: 'Que Nem Jiló', plays: Math.round((artistProfile?.followers || 150) * 1.2), trend: '-2%' }
  ];

  const performanceData = [
    { subject: 'Presença', A: artistProfile?.rating ? Math.round(artistProfile.rating * 20) : 80, fullMark: 100 },
    { subject: 'Pontualidade', A: 95, fullMark: 100 },
    { subject: 'Engajamento', A: artistProfile?.followers ? Math.min(100, Math.round(artistProfile.followers / 20)) : 70, fullMark: 100 },
    { subject: 'Repertório', A: 85, fullMark: 100 },
    { subject: 'Comunicação', A: 90, fullMark: 100 }
  ];

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
              <div className="space-y-3">
                {topSongs.map((song, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                    className="flex items-center gap-3">
                    <span className="text-gray-500 font-bold text-xs w-4">#{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-white text-sm font-medium">{song.song}</p>
                        <div className="flex items-center gap-1.5">
                          <span className="text-neon-green text-xs font-semibold">{song.trend}</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${song.plays > 0 ? (song.plays / ((artistProfile?.followers || 150) * 2.5)) * 100 : 0}%` }}
                          transition={{ delay: 0.3 + i * 0.08, duration: 0.8 }}
                          className="h-full rounded-full"
                          style={{ background: 'linear-gradient(90deg, #7B2EFF, #39FF6A)' }}
                        />
                      </div>
                      <p className="text-gray-500 text-[10px] mt-0.5">{song.plays.toLocaleString()} reproduções</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Performance Radar */}
            <div className="bg-white/5 border border-white/8 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-neon-purple" />
                <h3 className="text-white font-semibold text-sm">Score de Performance</h3>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={performanceData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                  <Radar dataKey="A" stroke="#7B2EFF" fill="#7B2EFF" fillOpacity={0.25} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}