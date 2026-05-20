import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  TrendingUp, DollarSign, Calendar, Star, Users, Music,
  Bell, ChevronRight, CheckCircle, Clock, MapPin, Play, Mic
} from 'lucide-react';
import AppLayout from '../../components/shared/AppLayout';
import StatCard from '../../components/ui/StatCard';
import NeonButton from '../../components/ui/NeonButton';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart
} from 'recharts';

const earningsData = [
  { week: 'S1', ganhos: 1200 },
  { week: 'S2', ganhos: 1800 },
  { week: 'S3', ganhos: 2200 },
  { week: 'S4', ganhos: 1900 },
  { week: 'S5', ganhos: 3100 },
  { week: 'S6', ganhos: 2800 },
];

const growthData = [
  { month: 'Jan', seguidores: 45000 },
  { month: 'Fev', seguidores: 52000 },
  { month: 'Mar', seguidores: 61000 },
  { month: 'Abr', seguidores: 74000 },
  { month: 'Mai', seguidores: 89000 },
  { month: 'Jun', seguidores: 103000 },
];

const proposals = [
  { id: '1', venue: 'Bar do Zeca', date: '15 Jun 2026', fee: 2800, status: 'pending', avatar: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100&h=100&fit=crop' },
  { id: '2', venue: 'Casa Noturna SP', date: '22 Jun 2026', fee: 4500, status: 'confirmed', avatar: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100&h=100&fit=crop' },
  { id: '3', venue: 'Espaço Eventos RJ', date: '30 Jun 2026', fee: 3200, status: 'pending', avatar: 'https://images.unsplash.com/photo-1540039155733-5bb30b4f1519?w=100&h=100&fit=crop' },
];

const upcomingShows = [
  { id: '1', venue: 'Bar Maresias', date: 'Hoje', time: '21h', city: 'São Paulo', fee: 1800 },
  { id: '2', venue: 'Sunset Lounge', date: 'Sex 14 Jun', time: '22h', city: 'Campinas', fee: 2200 },
  { id: '3', venue: 'Ao Vivo Club', date: 'Sáb 15 Jun', time: '21:30h', city: 'São Paulo', fee: 3000 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-card-dark border border-white/10 rounded-xl p-3 text-xs">
        <p className="text-gray-400 mb-1">{label}</p>
        <p style={{ color: '#39FF6A' }} className="font-semibold">
          R$ {payload[0]?.value?.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

export default function ArtistDashboard() {
  return (
    <AppLayout role="artist" userName="Lucas Volta">
      <div className="px-4 py-5 space-y-6">

        {/* Greeting */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Olá, artista 🎵</p>
              <h1 className="text-white font-bold text-2xl">Lucas Volta</h1>
              <div className="flex items-center gap-1.5 mt-1">
                <CheckCircle className="w-4 h-4 text-neon-purple" />
                <span className="text-neon-purple text-xs font-semibold">Artista Verificado</span>
              </div>
            </div>
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-neon-purple/60" style={{ boxShadow: '0 0 20px rgba(123,46,255,0.4)' }}>
                <img src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop" alt="Artista" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-neon-green rounded-full border-2 border-app-dark flex items-center justify-center">
                <span className="text-[7px] font-bold text-black">AO VIVO</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Hero Earnings Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative p-6 rounded-3xl overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(57,255,106,0.2) 0%, rgba(123,46,255,0.2) 100%)', border: '1px solid rgba(57,255,106,0.3)' }}
        >
          <p className="text-gray-300 text-sm">Ganhos em Maio 2026</p>
          <div className="flex items-end gap-2 mt-1 mb-4">
            <h2 className="text-white font-black text-4xl">R$ 13.000</h2>
            <div className="flex items-center gap-1 text-neon-green text-sm font-semibold mb-1">
              <TrendingUp className="w-4 h-4" />
              +31%
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[{ label: 'Shows', value: '7', icon: '🎤' }, { label: 'Gorjetas', value: 'R$ 940', icon: '💝' }, { label: 'Propostas', value: '3', icon: '📩' }].map((m, i) => (
              <div key={i} className="bg-black/30 rounded-xl p-2.5 text-center">
                <div className="text-base mb-0.5">{m.icon}</div>
                <p className="text-white font-bold text-sm">{m.value}</p>
                <p className="text-gray-400 text-[10px]">{m.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard title="Seguidores" value="103K" change={15} icon={Users} iconColor="purple" delay={0.1} />
          <StatCard title="Avaliação" value="4.9 ⭐" icon={Star} iconColor="green" delay={0.15} />
          <StatCard title="Shows este mês" value="7" change={17} icon={Music} iconColor="purple" delay={0.2} />
          <StatCard title="Próx. evento" value="Hoje, 21h" icon={Calendar} iconColor="green" delay={0.25} />
        </div>

        {/* Earnings Chart */}
        <div className="bg-white/5 border border-white/8 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-semibold text-sm">Crescimento de Ganhos</h3>
              <p className="text-gray-400 text-xs">Últimas 6 semanas</p>
            </div>
            <TrendingUp className="w-4 h-4 text-neon-green" />
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={earningsData}>
              <defs>
                <linearGradient id="colorGanhos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#39FF6A" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#39FF6A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="week" tick={{ fill: '#9CA3AF', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${v / 1000}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="ganhos" stroke="#39FF6A" strokeWidth={2.5} fill="url(#colorGanhos)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Follower Growth */}
        <div className="bg-white/5 border border-white/8 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-semibold text-sm">Crescimento de Seguidores</h3>
              <p className="text-gray-400 text-xs">Últimos 6 meses</p>
            </div>
            <Users className="w-4 h-4 text-neon-purple" />
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: '#9CA3AF', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v / 1000}K`} />
              <Tooltip content={({ active, payload }) => active && payload?.length ? (
                <div className="bg-card-dark border border-white/10 rounded-xl p-3 text-xs">
                  <p style={{ color: '#7B2EFF' }} className="font-semibold">{payload[0]?.value?.toLocaleString()} seguidores</p>
                </div>
              ) : null} />
              <Line type="monotone" dataKey="seguidores" stroke="#7B2EFF" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Proposals */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-neon-purple" />
              <h3 className="text-white font-semibold text-sm">Propostas Recebidas</h3>
              <span className="bg-neon-purple/20 text-neon-purple text-xs font-bold px-2 py-0.5 rounded-full">3</span>
            </div>
          </div>
          <div className="space-y-3">
            {proposals.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/8 hover:border-neon-purple/30 transition-all">
                <img src={p.avatar} alt={p.venue} className="w-12 h-12 rounded-xl object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{p.venue}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-400 text-xs">{p.date}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-neon-green font-bold text-sm">R$ {p.fee.toLocaleString()}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.status === 'confirmed' ? 'bg-neon-green/15 text-neon-green' : 'bg-yellow-500/15 text-yellow-400'}`}>
                    {p.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Upcoming Shows */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-neon-green" />
              <h3 className="text-white font-semibold text-sm">Próximos Shows</h3>
            </div>
            <Link to="/artist/agenda" className="flex items-center gap-1 text-neon-purple text-xs font-semibold">
              Ver agenda <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingShows.map((show, i) => (
              <motion.div key={show.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/8">
                <div className="w-12 h-12 rounded-xl bg-neon-purple/20 flex flex-col items-center justify-center flex-shrink-0">
                  <Mic className="w-5 h-5 text-neon-purple" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">{show.venue}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-gray-400 text-xs">{show.date} • {show.time}</span>
                    <span className="text-gray-600">•</span>
                    <MapPin className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-400 text-xs">{show.city}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-neon-green font-bold text-sm">R$ {show.fee.toLocaleString()}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Live Button */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="p-5 rounded-2xl text-center cursor-pointer flex items-center justify-center gap-3"
          style={{ background: 'linear-gradient(135deg, rgba(123,46,255,0.3), rgba(57,255,106,0.2))', border: '1px solid rgba(123,46,255,0.4)' }}
        >
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <div>
            <p className="text-white font-bold text-base">Iniciar Live</p>
            <p className="text-gray-300 text-xs">Transmita para seus fãs agora</p>
          </div>
          <Play className="w-6 h-6 text-neon-green" />
        </motion.div>
      </div>
    </AppLayout>
  );
}