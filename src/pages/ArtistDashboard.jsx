import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, DollarSign, Calendar, Star, Users, CheckCircle, Play, Pause,
  Volume2, UploadCloud, ToggleLeft, ToggleRight, X
} from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line
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

export default function ArtistDashboard() {
  const [proposals, setProposals] = useState([
    { id: 'evt-2', venue: 'Sunset Lounge', date: '2026-05-23', fee: 2200, status: 'pending', avatar: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100&h=100&fit=crop' },
    { id: 'evt-3', venue: 'Espaço Jardins', date: '2026-05-30', fee: 2000, status: 'pending', avatar: 'https://images.unsplash.com/photo-1540039155733-5bb30b4f1519?w=100&h=100&fit=crop' }
  ]);
  
  const [shows, setShows] = useState([
    { id: 'evt-1', venue: 'Bar do João', date: 'Hoje', time: '21:00', city: 'São Paulo', fee: 1800 }
  ]);

  // Audio Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState('Modão Sertanejo - Demo');
  
  // Media Upload State
  const [mediaList, setMediaList] = useState([
    { id: 1, type: 'video', name: 'Show_Ao_Vivo_Pinheiros.mp4', size: '24MB' },
    { id: 2, type: 'audio', name: 'Autoral_Estudio_Gravacao.wav', size: '8MB' }
  ]);
  const [uploading, setUploading] = useState(false);

  // Availability calendar state
  const [busyDates, setBusyDates] = useState(['2026-05-22', '2026-05-25']);
  const [newBusyDate, setNewBusyDate] = useState('');
  const [availabilityAuto, setAvailabilityAuto] = useState(true);

  const handleAcceptProposal = (id) => {
    const prop = proposals.find(p => p.id === id);
    if (!prop) return;
    
    // Move to shows list
    setShows(prev => [...prev, {
      id: prop.id,
      venue: prop.venue,
      date: prop.date,
      time: '21:00',
      city: 'São Paulo',
      fee: prop.fee
    }]);

    // Remove from proposals
    setProposals(prev => prev.filter(p => p.id !== id));
  };

  const handleRejectProposal = (id) => {
    setProposals(prev => prev.filter(p => p.id !== id));
  };

  const handleUploadMedia = (e) => {
    e.preventDefault();
    setUploading(true);
    setTimeout(() => {
      setMediaList(prev => [
        ...prev,
        { id: Date.now(), type: 'audio', name: 'Nova_Musica_Demo.mp3', size: '5.2MB' }
      ]);
      setUploading(false);
    }, 1500);
  };

  const handleAddBusyDate = () => {
    if (!newBusyDate) return;
    if (busyDates.includes(newBusyDate)) return;
    setBusyDates(prev => [...prev, newBusyDate]);
    setNewBusyDate('');
  };

  const handleRemoveBusyDate = (date) => {
    setBusyDates(prev => prev.filter(d => d !== date));
  };

  return (
    <div className="space-y-8 pb-10">
      
      {/* TOP ROW: PROFILE HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img 
              src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop" 
              alt="Avatar" 
              className="w-16 h-16 rounded-2xl object-cover border-2 border-neon-purple/50"
            />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-neon-green rounded-full border-2 border-[#08041A] flex items-center justify-center">
              <span className="text-[8px] font-black text-black">LIVE</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-2xl font-black text-white">Lucas Volta</h1>
              <CheckCircle className="w-5 h-5 text-neon-purple" />
            </div>
            <p className="text-xs text-gray-400">Sertanejo Universitário • São Paulo</p>
          </div>
        </div>

        {/* Availability Toggle */}
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10">
          <span className="text-xs text-gray-300 font-bold uppercase tracking-wider">Status Agenda</span>
          <button onClick={() => setAvailabilityAuto(!availabilityAuto)}>
            {availabilityAuto ? (
              <ToggleRight className="w-9 h-9 text-neon-green" />
            ) : (
              <ToggleLeft className="w-9 h-9 text-gray-500" />
            )}
          </button>
          <span className="text-[10px] text-gray-400 font-semibold">{availabilityAuto ? 'Disponível' : 'Ocupado'}</span>
        </div>
      </div>

      {/* HERO EARNINGS */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative p-6 rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-[#0c1f10] to-[#08041A]"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-neon-green/10 rounded-full blur-[50px] pointer-events-none" />
        
        <div className="grid md:grid-cols-2 gap-6 items-center">
          <div>
            <span className="text-[10px] uppercase font-black text-neon-green tracking-widest">Ganhos do Mês</span>
            <h2 className="text-4xl font-black text-white mt-1">R$ 13.000,00</h2>
            <div className="flex items-center gap-1 text-neon-green text-xs font-bold mt-1">
              <TrendingUp className="w-4 h-4" />
              <span>+31.4% vs. mês anterior</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { title: 'Shows Feitos', val: '7 Gigs', icon: '🎤' },
              { title: 'Gorjetas Fãs', val: 'R$ 940', icon: '💝' },
              { title: 'Pendentes', val: proposals.length.toString(), icon: '📩' }
            ].map((item, idx) => (
              <div key={idx} className="p-3 rounded-2xl bg-white/5 border border-white/5">
                <div className="text-lg mb-1">{item.icon}</div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">{item.title}</p>
                <p className="text-sm font-bold text-white mt-0.5">{item.val}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Seguidores" value="103K" change={15} icon={Users} iconColor="purple" />
        <StatCard title="Avaliação Fãs" value="4.9 / 5" icon={Star} iconColor="green" />
        <StatCard title="Visualizações" value="18K" icon={Play} iconColor="purple" />
        <StatCard title="Próximo Show" value="Hoje, 21:00" icon={Calendar} iconColor="green" />
      </div>

      {/* GRAPHS */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Earnings Growth Chart */}
        <div className="p-5 rounded-2xl bg-[#0F0926] border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Crescimento de Cachês</h3>
            <DollarSign className="w-4 h-4 text-neon-green" />
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={earningsData}>
                <defs>
                  <linearGradient id="colorEarning" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#39FF6A" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#39FF6A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="week" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                <Tooltip />
                <Area type="monotone" dataKey="ganhos" stroke="#39FF6A" fillOpacity={1} fill="url(#colorEarning)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Followers Chart */}
        <div className="p-5 rounded-2xl bg-[#0F0926] border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Engajamento Audiência</h3>
            <Users className="w-4 h-4 text-neon-purple" />
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="seguidores" stroke="#7B2EFF" strokeWidth={2.5} dot={true} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* PROPOSALS LIST */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4">Propostas de Shows</h3>
        
        <div className="grid gap-3">
          {proposals.length > 0 ? (
            proposals.map(p => (
              <div key={p.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img src={p.avatar} alt="Proposer" className="w-12 h-12 rounded-xl object-cover" />
                  <div>
                    <h4 className="font-bold text-sm text-white">{p.venue}</h4>
                    <p className="text-xs text-gray-400">Data: {p.date} • Proposta Cachê: <span className="text-neon-green font-bold">R$ {p.fee.toLocaleString()}</span></p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleRejectProposal(p.id)}
                    className="p-2 px-3 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-bold transition-all"
                  >
                    Recusar
                  </button>
                  <button 
                    onClick={() => handleAcceptProposal(p.id)}
                    className="p-2 px-4 rounded-lg bg-neon-purple text-white text-xs font-bold hover:shadow-[0_0_10px_rgba(123,46,255,0.4)] transition-all"
                  >
                    Aceitar Show
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center bg-white/5 rounded-xl border border-white/5">
              <p className="text-gray-400 text-xs">Nenhuma proposta pendente no momento.</p>
            </div>
          )}
        </div>
      </div>

      {/* SMART CALENDAR AND BUSY DATES SECTION */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Calendar dates list */}
        <div className="p-5 rounded-2xl bg-white/5 border border-white/5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Bloqueio Inteligente de Agenda</h3>
          <p className="text-[10px] text-gray-400 mb-4">Adicione datas ocupadas para que contratantes não possam enviar propostas.</p>

          <div className="flex gap-2 mb-4">
            <input 
              type="date" 
              value={newBusyDate}
              onChange={e => setNewBusyDate(e.target.value)}
              className="flex-1 p-2 bg-[#0F0926] border border-white/10 rounded-xl text-xs text-white" 
            />
            <button 
              onClick={handleAddBusyDate}
              className="p-2 px-3 rounded-xl bg-neon-purple text-white text-xs font-bold"
            >
              Bloquear Data
            </button>
          </div>

          <div className="space-y-2">
            {busyDates.map(date => (
              <div key={date} className="flex justify-between items-center p-2.5 bg-black/20 rounded-xl border border-white/5">
                <span className="text-xs font-semibold text-gray-300">📅 Ocupado em {date}</span>
                <button onClick={() => handleRemoveBusyDate(date)} className="p-1 rounded hover:bg-white/10 text-red-400">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Audio player & portfolio */}
        <div className="p-5 rounded-2xl bg-white/5 border border-white/5 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Portfólio & Player</h3>
            <p className="text-[10px] text-gray-400 mb-4">Gerencie as músicas exibidas no seu perfil.</p>

            {/* Music Player Bar */}
            <div className="p-3 bg-neon-purple/10 border border-neon-purple/20 rounded-xl flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-8 h-8 rounded-full bg-neon-purple flex items-center justify-center text-white"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
                </button>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{currentTrack}</p>
                  <span className="text-[9px] text-gray-500">Duração: 2:45m</span>
                </div>
              </div>
              <Volume2 className="w-4 h-4 text-neon-purple" />
            </div>

            {/* Media List */}
            <div className="space-y-2">
              {mediaList.map(m => (
                <div key={m.id} className="flex justify-between items-center p-2 bg-black/10 rounded-lg text-[10px] text-gray-300">
                  <span>{m.type === 'video' ? '📹' : '🎵'} {m.name}</span>
                  <span className="text-gray-500">{m.size}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Media Uploader Form */}
          <form onSubmit={handleUploadMedia} className="mt-4 pt-3 border-t border-white/5">
            <button 
              type="submit" 
              disabled={uploading}
              className="w-full py-2.5 rounded-xl border border-dashed border-white/20 hover:border-neon-purple/50 flex items-center justify-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-all"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{uploading ? 'Enviando arquivo...' : 'Upload de Portfólio'}</span>
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}