import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, DollarSign, Users, Calendar, Music,
  Star, ChevronRight, Flame, Clock, BarChart3, ArrowRight
} from 'lucide-react';
import AppLayout from '../../components/shared/AppLayout';
import StatCard from '../../components/ui/StatCard';
import ArtistCard from '../../components/shared/ArtistCard';
import NeonButton from '../../components/ui/NeonButton';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart
} from 'recharts';

const revenueData = [
  { month: 'Jan', faturamento: 18000, gastos: 4200 },
  { month: 'Fev', faturamento: 22000, gastos: 5500 },
  { month: 'Mar', faturamento: 19500, gastos: 4800 },
  { month: 'Abr', faturamento: 28000, gastos: 7200 },
  { month: 'Mai', faturamento: 34000, gastos: 8800 },
  { month: 'Jun', faturamento: 31000, gastos: 7900 },
];

const topArtists = [
  { id: '1', artistic_name: 'Lucas Volta', genre: 'Sertanejo', city: 'São Paulo', photo_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop', rating: 4.9, total_reviews: 48, followers: 125000, base_fee: 2800, verified: true, total_shows: 24, total_hires: 12 },
  { id: '2', artistic_name: 'Laxy Music', genre: 'Pop', city: 'Rio de Janeiro', photo_url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=200&h=200&fit=crop', rating: 4.7, total_reviews: 32, followers: 89000, base_fee: 2200, verified: true, total_shows: 18, total_hires: 9 },
  { id: '3', artistic_name: 'Banda Nova Era', genre: 'Rock', city: 'Belo Horizonte', photo_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=crop', rating: 4.8, total_reviews: 41, followers: 67000, base_fee: 4500, verified: true, total_shows: 31, total_hires: 8 },
];

const recommendedArtists = [
  { id: '4', artistic_name: 'Sofia Neon', genre: 'Pop', city: 'São Paulo', photo_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&h=200&fit=crop', rating: 4.6, total_reviews: 28, followers: 54000, base_fee: 1800, verified: true, total_shows: 14, live_now: false, featured: true },
  { id: '5', artistic_name: 'Dj Matteus', genre: 'Eletrônico', city: 'São Paulo', photo_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=200&fit=crop', rating: 4.8, total_reviews: 36, followers: 112000, base_fee: 3200, verified: true, total_shows: 42, live_now: true, featured: false },
  { id: '6', artistic_name: 'Trio Samba Amor', genre: 'Samba', city: 'Rio de Janeiro', photo_url: 'https://images.unsplash.com/photo-1504898770365-14faca6a7320?w=200&h=200&fit=crop', rating: 4.9, total_reviews: 55, followers: 78000, base_fee: 2500, verified: true, total_shows: 60, live_now: false, featured: true },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-card-dark border border-white/10 rounded-xl p-3 text-xs">
        <p className="text-gray-400 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="font-semibold">
            {p.name}: R$ {p.value?.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function VenueDashboard() {
  const [selectedMonth] = useState('Maio 2026');

  return (
    <AppLayout role="venue" userName="João Silva" venueName="Bar do João">
      <div className="px-4 py-5 space-y-6">

        {/* Month selector */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white font-bold text-xl">Painel da Casa</h1>
            <p className="text-gray-400 text-sm">Visão geral do seu negócio</p>
          </div>
          <div className="px-4 py-2 rounded-full bg-neon-purple/15 border border-neon-purple/30 text-neon-purple text-sm font-semibold cursor-pointer flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {selectedMonth}
          </div>
        </div>

        {/* Hero Investment Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative p-6 rounded-3xl overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(123,46,255,0.3) 0%, rgba(57,255,106,0.15) 100%)', border: '1px solid rgba(123,46,255,0.4)' }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/10 to-transparent" />
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-gray-300 text-sm">Total investido em música ao vivo</p>
                <div className="flex items-end gap-2 mt-1">
                  <h2 className="text-white font-black text-4xl">R$ 8.800</h2>
                  <div className="flex items-center gap-1 text-neon-green text-sm font-semibold mb-1">
                    <TrendingUp className="w-4 h-4" />
                    +22%
                  </div>
                </div>
                <p className="text-gray-400 text-xs">vs. mês anterior: R$ 7.200</p>
              </div>
              <div className="p-3 rounded-2xl bg-neon-purple/20">
                <Music className="w-7 h-7 text-neon-purple" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-5">
              {[
                { label: 'Gorjetas', value: 'R$ 1.240', icon: '🎵' },
                { label: 'Cachês', value: 'R$ 7.560', icon: '💰' },
                { label: 'Eventos', value: '14', icon: '🎤' },
              ].map((m, i) => (
                <div key={i} className="bg-black/30 rounded-xl p-3 text-center">
                  <div className="text-lg mb-1">{m.icon}</div>
                  <p className="text-white font-bold text-sm">{m.value}</p>
                  <p className="text-gray-400 text-[10px]">{m.label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard title="Faturamento noites" value="R$ 34.000" change={18} changeLabel="vs. mês anterior" icon={DollarSign} iconColor="green" delay={0.1} />
          <StatCard title="Artistas contratados" value="8" change={12} changeLabel="este mês" icon={Music} iconColor="purple" delay={0.15} />
          <StatCard title="Eventos futuros" value="6" icon={Calendar} iconColor="purple" delay={0.2} />
          <StatCard title="Média de público" value="187 pessoas" change={8} icon={Users} iconColor="green" delay={0.25} />
        </div>

        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 border border-white/8 rounded-2xl p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-semibold text-sm">Faturamento vs. Gastos</h3>
              <p className="text-gray-400 text-xs">Últimos 6 meses</p>
            </div>
            <BarChart3 className="w-4 h-4 text-neon-purple" />
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorFat" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#39FF6A" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#39FF6A" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorGas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7B2EFF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7B2EFF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: '#9CA3AF', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="faturamento" name="Faturamento" stroke="#39FF6A" strokeWidth={2} fill="url(#colorFat)" />
              <Area type="monotone" dataKey="gastos" name="Gastos com artistas" stroke="#7B2EFF" strokeWidth={2} fill="url(#colorGas)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Top Artists Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-neon-purple" />
              <h3 className="text-white font-semibold text-sm">Artistas Mais Contratados</h3>
            </div>
            <Link to="/venue/artists" className="flex items-center gap-1 text-neon-purple text-xs font-semibold">
              Ver todos <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {topArtists.map((artist, i) => (
              <motion.div
                key={artist.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i }}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/8 hover:border-neon-purple/30 transition-all"
              >
                <span className="text-gray-500 font-bold text-xs w-4">#{i + 1}</span>
                <img src={artist.photo_url} alt={artist.artistic_name} className="w-12 h-12 rounded-xl object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="text-white font-semibold text-sm truncate">{artist.artistic_name}</p>
                    {artist.verified && <div className="w-3.5 h-3.5 bg-neon-purple rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-[7px]">✓</span>
                    </div>}
                  </div>
                  <p className="text-gray-400 text-xs">{artist.genre}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex items-center gap-0.5">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-gray-300 text-xs">{artist.rating}</span>
                    </div>
                    <span className="text-gray-500 text-xs">{artist.total_hires} contratações</span>
                  </div>
                </div>
                <NeonButton variant="purple" size="sm">Contratar</NeonButton>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recommended Artists */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-neon-green" />
              <h3 className="text-white font-semibold text-sm">Artistas Recomendados</h3>
            </div>
            <Link to="/venue/artists" className="flex items-center gap-1 text-neon-purple text-xs font-semibold">
              Ver mais <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="overflow-x-auto scrollbar-none -mx-4 px-4">
            <div className="flex gap-3 pb-2" style={{ width: 'max-content' }}>
              {recommendedArtists.map((artist, i) => (
                <div key={artist.id} style={{ width: 200 }}>
                  <ArtistCard artist={artist} key={artist.id} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Peak Hours */}
        <div className="bg-white/5 border border-white/8 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-neon-purple" />
            <h3 className="text-white font-semibold text-sm">Horários Mais Lucrativos</h3>
          </div>
          <div className="space-y-2">
            {[
              { hour: '22h - 23h', revenue: 'R$ 5.800', bar: 95 },
              { hour: '21h - 22h', revenue: 'R$ 4.200', bar: 72 },
              { hour: '23h - 00h', revenue: 'R$ 3.900', bar: 65 },
              { hour: '20h - 21h', revenue: 'R$ 2.100', bar: 38 },
            ].map((h, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-gray-400 text-xs w-20">{h.hour}</span>
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${h.bar}%` }}
                    transition={{ delay: 0.1 * i, duration: 0.8 }}
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, #7B2EFF, #39FF6A)' }}
                  />
                </div>
                <span className="text-neon-green text-xs font-semibold w-20 text-right">{h.revenue}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Hire Artist */}
        <Link to="/venue/artists">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="p-5 rounded-2xl text-center cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #7B2EFF, #39FF6A)', boxShadow: '0 0 40px rgba(123,46,255,0.4)' }}
          >
            <p className="text-white font-bold text-base mb-1">Contratar Artista</p>
            <p className="text-white/80 text-sm flex items-center justify-center gap-1">
              Encontre o talento perfeito <ArrowRight className="w-4 h-4" />
            </p>
          </motion.div>
        </Link>
      </div>
    </AppLayout>
  );
}