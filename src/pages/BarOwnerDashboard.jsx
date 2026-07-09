import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, DollarSign, Users, Calendar, Music,
  Star, Flame, BarChart3,
  SlidersHorizontal, CheckCircle, Shield, Send, Landmark, X, Filter, Check, Award
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import StatCard from '@/components/ui/StatCard';
import NeonButton from '@/components/ui/NeonButton';
import { supabase } from '@/integrations/supabase/client';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend
} from 'recharts';

// Mock charts data
const chartData = [
  { month: 'Jan', faturamento: 18000, gastos: 4200, ocupacao: 65 },
  { month: 'Fev', faturamento: 22000, gastos: 5500, ocupacao: 72 },
  { month: 'Mar', faturamento: 19500, gastos: 4800, ocupacao: 68 },
  { month: 'Abr', faturamento: 28000, gastos: 7200, ocupacao: 85 },
  { month: 'Mai', faturamento: 34000, gastos: 8800, ocupacao: 90 },
  { month: 'Jun', faturamento: 31000, gastos: 7900, ocupacao: 88 },
];



export default function VenueDashboard() {
  const theme = 'dark';
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('Maio 2026');
  
  // Advanced filters state
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState('Todos');
  const [selectedCity, setSelectedCity] = useState('Todas');
  const [maxBudget, setMaxBudget] = useState(10000);
  const [minRating, setMinRating] = useState(4.0);
  const [filterVerified, setFilterVerified] = useState(false);

  // Profile overlay state
  const [selectedArtistProfile, setSelectedArtistProfile] = useState(null);

  // Hiring Flow State
  const [hiringArtist, setHiringArtist] = useState(null);
  const [hireStep, setHireStep] = useState(1); // 1: Form, 2: Negotiation Chat, 3: Signature, 4: Payment, 5: Success
  const [eventDate, setEventDate] = useState('2026-05-28');
  const [eventTime, setEventTime] = useState('21:00');
  const [proposalFee, setProposalFee] = useState(0);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [signatureName, setSignatureName] = useState('');
  const [signed, setSigned] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);

  // Fetch Artists
  useEffect(() => {
    async function loadArtists() {
      try {
        const { data } = await supabase.from('artists').select('*');
        if (data) {
          const sorted = [...data].sort((a, b) => (b.is_pro ? 1 : 0) - (a.is_pro ? 1 : 0));
          setArtists(sorted);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadArtists();
  }, []);

  // Filtered artists logic
  const filteredArtists = artists.filter(artist => {
    const matchGenre = selectedGenre === 'Todos' || artist.genre === selectedGenre;
    const matchCity = selectedCity === 'Todas' || artist.city === selectedCity;
    const matchBudget = artist.base_fee <= maxBudget;
    const matchRating = artist.rating >= minRating;
    const matchVerified = !filterVerified || artist.verified;
    return matchGenre && matchCity && matchBudget && matchRating && matchVerified;
  });

  // Top Hired Artists List
  const topHired = [...artists]
    .sort((a, b) => (b.followers || 0) - (a.followers || 0))
    .slice(0, 3);

  // Recommended Artists based on Venue parameters
  const recommended = [...artists]
    .filter(a => a.rating >= 4.7 && a.base_fee <= 5000)
    .slice(0, 4);

  // Featured Carousel artists
  const featured = [...artists].filter(a => a.featured || a.live_now);

  const startHiringFlow = (artist) => {
    setHiringArtist(artist);
    setProposalFee(artist.base_fee);
    setHireStep(1);
    setChatHistory([
      { sender: 'artist', text: `Olá! Fico muito feliz pelo interesse. Meu cachê padrão para São Paulo é de R$ ${artist.base_fee.toLocaleString()}, com som e equipamentos inclusos. O que acha?` }
    ]);
    setSigned(false);
    setPaymentDone(false);
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    const userMsg = { sender: 'venue', text: chatMessage };
    
    // Simple mock response simulation
    let replyText = `Perfeito! O valor de R$ ${proposalFee} está ótimo para o dia ${eventDate} às ${eventTime}. Vamos para a assinatura do contrato?`;
    if (proposalFee < hiringArtist.base_fee * 0.8) {
      replyText = `Hum, R$ ${proposalFee} está um pouco abaixo do que costumo cobrar. Podemos fechar em R$ ${(hiringArtist.base_fee * 0.9).toFixed(0)}?`;
    }

    setChatHistory(prev => [...prev, userMsg]);
    setChatMessage('');

    setTimeout(() => {
      setChatHistory(prev => [...prev, { sender: 'artist', text: replyText }]);
    }, 1000);
  };

  return (
    <AppLayout role="venue">
      <div className="space-y-8 pb-10">

        {/* HERO HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Painel Executivo</h1>
            <p className="text-gray-400 text-xs mt-1">Gestão inteligente e contratação rápida de música ao vivo</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all text-neon-purple"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filtros Avançados</span>
            </button>
          </div>
        </div>

        {/* HERO INVESTMENT CARD */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative p-6 md:p-8 rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-[#120836] to-[#08041A] shadow-2xl"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#7B2EFF]/10 rounded-full blur-[60px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#39FF6A]/5 rounded-full blur-[50px] pointer-events-none" />

          <div className="relative z-10 grid md:grid-cols-2 gap-6 items-center">
            <div>
              <span className="text-[10px] uppercase font-black text-neon-purple tracking-widest">Investimento ao Vivo</span>
              <p className="text-gray-400 text-xs mt-1">Total investido no estabelecimento ({selectedMonth})</p>
              
              <div className="flex items-baseline gap-3 mt-2">
                <h2 className="text-4xl md:text-5xl font-black text-white">R$ 8.800,00</h2>
                <div className="flex items-center gap-0.5 text-neon-green text-xs font-bold">
                  <TrendingUp className="w-4 h-4" />
                  <span>+18.4%</span>
                </div>
              </div>
              
              <p className="text-[10px] text-gray-500 mt-1">vs. período anterior: R$ 7.430,00</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { title: 'Cachês Pagos', value: 'R$ 7.560', icon: DollarSign, color: 'border-neon-purple/20', iconColor: 'text-neon-purple' },
                { title: 'Gorjetas Extras', value: 'R$ 1.240', icon: Star, color: 'border-neon-green/20', iconColor: 'text-neon-green' },
                { title: 'Total Eventos', value: '14 Shows', icon: Music, color: 'border-white/5', iconColor: 'text-white' },
                { title: 'Média de Público', value: '187 pessoas', icon: Users, color: 'border-white/5', iconColor: 'text-gray-400' }
              ].map((m, i) => (
                <div key={i} className={`p-3.5 rounded-2xl bg-white/5 border ${m.color} backdrop-blur-sm`}>
                  <div className="flex items-center gap-2 mb-1">
                    <m.icon className={`w-4 h-4 ${m.iconColor}`} />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{m.title}</span>
                  </div>
                  <p className="text-sm md:text-base font-bold text-white">{m.value}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Faturamento noites" value="R$ 34.000" change={22} changeLabel="vs. mês anterior" icon={DollarSign} iconColor="green" />
          <StatCard title="Artistas contratados" value="8 bandas" change={12} changeLabel="novos músicos" icon={Music} iconColor="purple" />
          <StatCard title="Eventos futuros" value="6 agendados" icon={Calendar} iconColor="green" />
          <StatCard title="Ocupação média" value="90% casa" change={8} icon={Users} iconColor="purple" />
        </div>

        {/* ADVANCED FILTERS PANEL */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-6 rounded-2xl bg-[#0F0926] border border-white/5 space-y-6 overflow-hidden shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-neon-green" />
                  <h3 className="text-sm font-bold uppercase tracking-wider">Configuração de Busca</h3>
                </div>
                <button onClick={() => setShowFilters(false)} className="p-1 rounded bg-white/5 hover:bg-white/10">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {/* Genre */}
                <div>
                  <label className="text-xs text-gray-400 block mb-2 font-bold uppercase tracking-wider">Estilo Musical</label>
                  <select 
                    value={selectedGenre} 
                    onChange={e => setSelectedGenre(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs"
                  >
                    <option value="Todos" className="bg-[#0F0926]">Todos os estilos</option>
                    <option value="Sertanejo" className="bg-[#0F0926]">Sertanejo</option>
                    <option value="Pop" className="bg-[#0F0926]">Pop</option>
                    <option value="Rock" className="bg-[#0F0926]">Rock</option>
                    <option value="Samba" className="bg-[#0F0926]">Samba</option>
                    <option value="Eletrônico" className="bg-[#0F0926]">Eletrônico</option>
                  </select>
                </div>

                {/* City */}
                <div>
                  <label className="text-xs text-gray-400 block mb-2 font-bold uppercase tracking-wider">Cidade</label>
                  <select 
                    value={selectedCity} 
                    onChange={e => setSelectedCity(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs"
                  >
                    <option value="Todas" className="bg-[#0F0926]">Todas as cidades</option>
                    <option value="São Paulo" className="bg-[#0F0926]">São Paulo</option>
                    <option value="Rio de Janeiro" className="bg-[#0F0926]">Rio de Janeiro</option>
                    <option value="Belo Horizonte" className="bg-[#0F0926]">Belo Horizonte</option>
                  </select>
                </div>

                {/* Min Rating */}
                <div>
                  <label className="text-xs text-gray-400 block mb-2 font-bold uppercase tracking-wider">Avaliação Mínima: {minRating} ⭐</label>
                  <input 
                    type="range" 
                    min="3.5" 
                    max="5.0" 
                    step="0.1" 
                    value={minRating} 
                    onChange={e => setMinRating(parseFloat(e.target.value))}
                    className="w-full accent-neon-purple"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 pt-2">
                {/* Max Fee */}
                <div>
                  <label className="text-xs text-gray-400 block mb-2 font-bold uppercase tracking-wider">Cachê Máximo: R$ {maxBudget.toLocaleString()}</label>
                  <input 
                    type="range" 
                    min="1000" 
                    max="10000" 
                    step="500" 
                    value={maxBudget} 
                    onChange={e => setMaxBudget(parseInt(e.target.value))}
                    className="w-full accent-neon-green"
                  />
                </div>

                {/* Verified Toggle */}
                <div className="flex items-center gap-3 self-center mt-4">
                  <input 
                    type="checkbox" 
                    id="chk-verified" 
                    checked={filterVerified} 
                    onChange={e => setFilterVerified(e.target.checked)}
                    className="w-4 h-4 rounded bg-white/5 border-white/10 text-neon-purple focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="chk-verified" className="text-xs text-gray-300 font-semibold cursor-pointer flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-neon-purple" />
                    <span>Mostrar apenas músicos verificados</span>
                  </label>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* GRAPHS AND CHARTS SECTIONS */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 p-5 rounded-2xl bg-white/5 border border-white/5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">Fluxo de Caixa Musical</h3>
                <p className="text-[10px] text-gray-400">Faturamento noites ao vivo vs. gastos de contratação</p>
              </div>
              <BarChart3 className="w-4 h-4 text-neon-green" />
            </div>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorFaturamento" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#39FF6A" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#39FF6A" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7B2EFF" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#7B2EFF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0F0926', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Area type="monotone" dataKey="faturamento" name="Faturamento Noite" stroke="#39FF6A" fillOpacity={1} fill="url(#colorFaturamento)" />
                  <Area type="monotone" dataKey="gastos" name="Gastos Artistas" stroke="#7B2EFF" fillOpacity={1} fill="url(#colorGastos)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Ocupation chart */}
          <div className="p-5 rounded-2xl bg-white/5 border border-white/5 shadow-lg flex flex-col">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">Média de Ocupação</h3>
              <p className="text-[10px] text-gray-400">Porcentagem de capacidade alcançada</p>
            </div>
            
            <div className="h-48 flex-1 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                  <YAxis unit="%" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0F0926', border: '1px solid rgba(255,255,255,0.1)' }} />
                  <Bar dataKey="ocupacao" name="Ocupação" fill="#39FF6A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ARTISTS EM DESTAQUE (CAROUSEL) */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">Músicos Em Destaque</h3>
            </div>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none">
            {featured.map(a => (
              <motion.div 
                key={a.id}
                whileHover={{ y: -5 }}
                className="w-72 flex-shrink-0 bg-[#0F0926] border border-white/5 rounded-2xl overflow-hidden relative group"
              >
                <img src={a.photo_url} alt={a.artistic_name} className="w-full h-40 object-cover group-hover:scale-105 transition-all duration-300" />
                
                {a.live_now && (
                  <span className="absolute top-3 left-3 bg-red-500 text-white font-bold text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                    LIVE AGORA
                  </span>
                )}

                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-white">{a.artistic_name}</h4>
                    {a.verified && <CheckCircle className="w-4 h-4 text-neon-purple" />}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{a.genre} • {a.city}</p>
                  
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                    <div>
                      <p className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">Cachê Base</p>
                      <p className="text-xs font-bold text-neon-green">R$ {a.base_fee?.toLocaleString()}</p>
                    </div>
                    <div className="flex gap-1.5">
                      <button 
                        onClick={() => setSelectedArtistProfile(a)}
                        className="px-2.5 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-[10px] font-bold text-gray-300 transition-colors"
                      >
                        Ver Perfil
                      </button>
                      <button 
                        onClick={() => startHiringFlow(a)}
                        className="px-3 py-1.5 rounded-lg bg-neon-purple text-white text-xs font-bold hover:shadow-[0_0_10px_rgba(123,46,255,0.4)] transition-all"
                      >
                        Contratar
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* SEARCH FILTER RESULTS / MAIN LIST */}
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Main search and hire list */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">Artistas Recomendados</h3>
              <span className="text-[10px] text-gray-400 font-semibold">{filteredArtists.length} músicos disponíveis</span>
            </div>

            <div className="grid gap-3">
              {filteredArtists.length > 0 ? (
                filteredArtists.map(a => (
                  <div 
                    key={a.id} 
                    className="p-4 bg-white/5 border border-white/5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-neon-purple/20 transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <img src={a.photo_url} alt={a.artistic_name} className="w-14 h-14 rounded-xl object-cover" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-sm text-white">{a.artistic_name}</h4>
                          {a.verified && <CheckCircle className="w-3.5 h-3.5 text-neon-purple" />}
                        </div>
                        <p className="text-xs text-gray-400">{a.genre} • {a.city}</p>
                        <div className="flex items-center gap-1 mt-1 text-yellow-400">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs text-gray-300 font-bold">{a.rating}</span>
                          <span className="text-gray-500 text-[10px] font-medium">({a.followers?.toLocaleString()} seguidores)</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-white/5">
                      <div>
                        <span className="text-[9px] text-gray-500 uppercase font-semibold block text-right">Preço Sugerido</span>
                        <p className="text-sm font-bold text-neon-green">R$ {a.base_fee?.toLocaleString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setSelectedArtistProfile(a)}
                          className="px-3 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-bold text-gray-300 transition-colors"
                        >
                          Ver Perfil
                        </button>
                        <button 
                          onClick={() => startHiringFlow(a)}
                          className="px-4 py-2 rounded-xl bg-neon-purple text-white text-xs font-bold hover:shadow-[0_0_15px_rgba(123,46,255,0.3)] transition-all"
                        >
                          Contratar Show
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-gray-400 text-sm">Nenhum artista corresponde aos filtros aplicados.</p>
                </div>
              )}
            </div>
          </div>

          {/* SIDEBAR: ARTISTAS MAIS CONTRATADOS */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">Mais Chamados</h3>
            
            <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-4 shadow-xl">
              {topHired.map((artist, idx) => (
                <div key={artist.id} className="flex items-center gap-3 pb-3 border-b border-white/5 last:border-0 last:pb-0">
                  <span className="text-xs font-black text-neon-purple">0{idx + 1}</span>
                  <div 
                    onClick={() => setSelectedArtistProfile(artist)}
                    className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer group/item"
                  >
                    <img src={artist.photo_url} alt={artist.artistic_name} className="w-10 h-10 rounded-lg object-cover group-hover/item:opacity-85 transition-opacity" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-white truncate group-hover/item:text-neon-purple transition-colors">{artist.artistic_name}</h4>
                      <p className="text-[10px] text-gray-400">{artist.genre} • {artist.city}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => startHiringFlow(artist)}
                    className="px-2.5 py-1.5 rounded-lg border border-neon-purple/20 text-neon-purple hover:bg-neon-purple/10 text-[10px] font-bold transition-all"
                  >
                    Chamar
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* STEP-BY-STEP HIRING FLOW MODAL */}
        <AnimatePresence>
          {hiringArtist && (
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-y-auto"
              onClick={() => setHiringArtist(null)}
            >
              <div className="min-h-full flex items-center justify-center p-4">
                <motion.div
                  key="card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  onClick={e => e.stopPropagation()}
                  className="w-full sm:max-w-xl bg-[#0F0926] rounded-2xl border border-white/10 p-6 shadow-2xl"
                >
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-neon-purple" />
                    <h3 className="font-black text-white text-lg">Fluxo de Contratação</h3>
                  </div>
                  <button onClick={() => setHiringArtist(null)} className="p-1 rounded bg-white/5 hover:bg-white/10">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Stepper Status Indicators */}
                <div className="flex items-center justify-between mb-6 text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                  <span className={hireStep >= 1 ? 'text-neon-purple' : ''}>1. Detalhes</span>
                  <span className="w-4 h-[1px] bg-white/10" />
                  <span className={hireStep >= 2 ? 'text-neon-purple' : ''}>2. Negociar</span>
                  <span className="w-4 h-[1px] bg-white/10" />
                  <span className={hireStep >= 3 ? 'text-neon-purple' : ''}>3. Assinatura</span>
                  <span className="w-4 h-[1px] bg-white/10" />
                  <span className={hireStep >= 4 ? 'text-neon-purple' : ''}>4. Pagamento</span>
                </div>

                {/* STEP 1: EVENT FORM DETAILS */}
                {hireStep === 1 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                      <img src={hiringArtist.photo_url} alt="Hiring" className="w-12 h-12 rounded-lg object-cover" />
                      <div>
                        <h4 className="text-sm font-bold text-white">{hiringArtist.artistic_name}</h4>
                        <p className="text-xs text-gray-400">Gênero: {hiringArtist.genre} • Cachê: R$ {hiringArtist.base_fee?.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-400 font-bold block mb-1">Data do Evento</label>
                        <input 
                          type="date" 
                          value={eventDate}
                          onChange={e => setEventDate(e.target.value)}
                          className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs" 
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 font-bold block mb-1">Horário de Início</label>
                        <input 
                          type="time" 
                          value={eventTime}
                          onChange={e => setEventTime(e.target.value)}
                          className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs" 
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-gray-400 font-bold block mb-1">Cachê Proposto (R$)</label>
                      <input 
                        type="number" 
                        value={proposalFee}
                        onChange={e => setProposalFee(parseInt(e.target.value))}
                        className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-neon-green font-bold" 
                      />
                    </div>

                    <NeonButton variant="purple" className="w-full py-3 mt-4" onClick={() => setHireStep(2)}>
                      Avançar para Negociação
                    </NeonButton>
                  </div>
                )}

                {/* STEP 2: CHAT NEGOTIATION */}
                {hireStep === 2 && (
                  <div className="space-y-4">
                    <div className="h-60 overflow-y-auto bg-black/20 border border-white/5 rounded-xl p-3 space-y-2 flex flex-col">
                      {chatHistory.map((m, i) => (
                        <div 
                          key={i} 
                          className={`max-w-[80%] p-3 rounded-2xl text-xs ${
                            m.sender === 'venue' 
                              ? 'bg-neon-purple text-white self-end rounded-tr-none' 
                              : 'bg-white/5 text-gray-300 self-start rounded-tl-none border border-white/5'
                          }`}
                        >
                          {m.text}
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={chatMessage}
                        onChange={e => setChatMessage(e.target.value)}
                        placeholder="Envie uma mensagem..."
                        className="flex-1 p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs"
                      />
                      <button onClick={handleSendMessage} className="p-2.5 rounded-xl bg-neon-purple hover:bg-neon-purple/80">
                        <Send className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex gap-3 pt-3">
                      <button onClick={() => setHireStep(1)} className="flex-1 py-2.5 border border-white/10 text-xs rounded-xl hover:bg-white/5">
                        Voltar
                      </button>
                      <button onClick={() => setHireStep(3)} className="flex-1 py-2.5 bg-neon-green text-black font-bold text-xs rounded-xl">
                        Avançar Contrato
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: DIGITAL SIGNATURE */}
                {hireStep === 3 && (
                  <div className="space-y-4">
                    <div className="p-4 bg-white/5 border border-white/5 rounded-xl text-xs text-gray-300 space-y-2">
                      <p className="font-bold text-white border-b border-white/5 pb-1">CONTRATO DE APRESENTAÇÃO MUSICAL</p>
                      <p><strong>Contratante:</strong> Bar do João</p>
                      <p><strong>Contratado:</strong> {hiringArtist.artistic_name}</p>
                      <p><strong>Serviço:</strong> Apresentação musical ao vivo de 2 horas.</p>
                      <p><strong>Data:</strong> {eventDate} às {eventTime}</p>
                      <p><strong>Valor acordado:</strong> R$ {proposalFee.toLocaleString()}</p>
                    </div>

                    <div>
                      <label className="text-xs text-gray-400 font-bold block mb-1">Assinatura Digital (Digite seu Nome)</label>
                      <input 
                        type="text" 
                        value={signatureName}
                        onChange={e => setSignatureName(e.target.value)}
                        placeholder="Nome completo para assinar"
                        className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs"
                      />
                    </div>

                    <div className="flex gap-3 pt-3">
                      <button onClick={() => setHireStep(2)} className="flex-1 py-2.5 border border-white/10 text-xs rounded-xl hover:bg-white/5">
                        Voltar
                      </button>
                      <button 
                        onClick={() => {
                          if (signatureName) {
                            setSigned(true);
                            setHireStep(4);
                          }
                        }}
                        disabled={!signatureName}
                        className="flex-1 py-2.5 bg-neon-purple text-white font-bold text-xs rounded-xl disabled:opacity-50"
                      >
                        Assinar Contrato
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 4: PAYMENT SIMULATION */}
                {hireStep === 4 && (
                  <div className="space-y-4 text-center">
                    <Landmark className="w-12 h-12 text-neon-green mx-auto mb-2" />
                    <h4 className="font-bold text-white text-sm">Garantia de Cachê Integrado</h4>
                    <p className="text-xs text-gray-400 max-w-sm mx-auto">
                      O TocaMais garante o cachê seguro do artista. O dinheiro ficará retido na plataforma e será transferido automaticamente no encerramento da apresentação.
                    </p>

                    <div className="p-4 bg-white/5 border border-white/5 rounded-xl text-left max-w-sm mx-auto">
                      <div className="flex justify-between text-xs py-1">
                        <span className="text-gray-400">Cachê do Evento</span>
                        <span className="text-white font-bold">R$ {proposalFee.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs py-1">
                        <span className="text-gray-400">Taxa de Serviço</span>
                        <span className="text-white font-bold">R$ 0,00</span>
                      </div>
                      <div className="border-t border-white/5 mt-2 pt-2 flex justify-between text-sm font-bold">
                        <span className="text-white">Total</span>
                        <span className="text-neon-green">R$ {proposalFee.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-3 max-w-sm mx-auto">
                      <button onClick={() => setHireStep(3)} className="flex-1 py-2.5 border border-white/10 text-xs rounded-xl hover:bg-white/5">
                        Voltar
                      </button>
                      <button 
                        onClick={() => {
                          setPaymentDone(true);
                          setHireStep(5);
                        }}
                        className="flex-1 py-2.5 bg-neon-green text-black font-black text-xs rounded-xl"
                      >
                        Autorizar Pix
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 5: SUCCESS */}
                {hireStep === 5 && (
                  <div className="space-y-4 text-center py-4">
                    <div className="w-16 h-16 bg-neon-green/20 rounded-full flex items-center justify-center mx-auto mb-3 shadow-[0_0_20px_rgba(57,255,106,0.3)]">
                      <Check className="w-8 h-8 text-neon-green" />
                    </div>
                    <h4 className="font-black text-white text-lg">Contratação Concluída!</h4>
                    <p className="text-xs text-gray-400 max-w-sm mx-auto">
                      O show de {hiringArtist.artistic_name} foi agendado para o dia {eventDate}. O contrato assinado foi enviado para o e-mail cadastrado.
                    </p>

                    <button 
                      onClick={() => setHiringArtist(null)}
                      className="px-6 py-2.5 bg-neon-purple text-white font-bold text-xs rounded-xl mt-4"
                    >
                      Voltar ao Painel
                    </button>
                  </div>
                )}

                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ARTIST PROFILE OVERLAY MODAL */}
        <AnimatePresence>
          {selectedArtistProfile && (
            <>
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedArtistProfile(null)}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[90]"
              />

              {/* Modal Container */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`fixed top-4 left-0 right-0 mx-auto w-[90%] max-w-sm sm:max-w-2xl z-[100] border p-4 sm:p-6 shadow-2xl rounded-2xl max-h-[85vh] overflow-y-auto transition-colors duration-300 ${
                  theme === 'dark' ? 'bg-[#0F0926] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-800'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                  <h3 className="font-black text-lg">Perfil do Artista</h3>
                  <button onClick={() => setSelectedArtistProfile(null)} className={`p-1.5 rounded-lg transition-colors ${
                    theme === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'
                  }`}>
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Profile Card Body */}
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-center gap-5">
                    <img 
                      src={selectedArtistProfile.photo_url} 
                      alt={selectedArtistProfile.artistic_name} 
                      className="w-28 h-28 rounded-2xl object-cover border-2 border-neon-purple shadow-lg"
                    />
                    <div className="text-center sm:text-left flex-1 space-y-1">
                      <div className="flex items-center justify-center sm:justify-start gap-2">
                        <h4 className="font-black text-2xl">{selectedArtistProfile.artistic_name}</h4>
                        {selectedArtistProfile.verified && <CheckCircle className="w-5 h-5 text-neon-purple" />}
                      </div>
                      <p className="text-sm text-neon-green font-bold">{selectedArtistProfile.genre} • {selectedArtistProfile.city}</p>
                      <div className="flex items-center justify-center sm:justify-start gap-1.5 text-yellow-400 text-sm">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-bold">{selectedArtistProfile.rating}</span>
                        <span className="text-gray-500 font-semibold">({selectedArtistProfile.followers?.toLocaleString()} seguidores)</span>
                      </div>
                    </div>
                    
                    <div className="text-center sm:text-right">
                      <span className="text-[10px] text-gray-500 uppercase font-bold block">Cachê Base</span>
                      <p className="text-xl font-bold text-neon-green">R$ {selectedArtistProfile.base_fee?.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Presentation Video Player */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500">Vídeo de Apresentação</h5>
                    <div className="rounded-xl overflow-hidden bg-black/40 border border-white/5 relative" style={{ aspectRatio: '9/16', maxWidth: '320px', margin: '0 auto' }}>
                      {selectedArtistProfile.presentation_video_url ? (
                        selectedArtistProfile.presentation_video_url.includes('youtube.com') || selectedArtistProfile.presentation_video_url.includes('youtu.be') ? (
                          <iframe 
                            src={selectedArtistProfile.presentation_video_url.replace('watch?v=', 'embed/').split('&')[0]} 
                            className="w-full h-full" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowFullScreen 
                            title="Vídeo de Apresentação"
                          />
                        ) : (
                          <video src={selectedArtistProfile.presentation_video_url} controls className="w-full h-full object-cover" />
                        )
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                          <p className="text-xs text-gray-500">Este artista ainda não cadastrou um vídeo de apresentação.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500">Biografia</h5>
                    <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      {selectedArtistProfile.bio || 'Sem biografia disponível.'}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t border-white/5">
                    <button 
                      onClick={() => {
                        setSelectedArtistProfile(null);
                        startHiringFlow(selectedArtistProfile);
                      }}
                      className="flex-1 py-3 rounded-xl bg-neon-purple text-white text-xs font-bold hover:shadow-[0_0_15px_rgba(123,46,255,0.4)] transition-all"
                    >
                      Iniciar Contratração de Show
                    </button>
                    <button 
                      onClick={() => setSelectedArtistProfile(null)}
                      className={`px-6 py-3 rounded-xl text-xs font-bold border transition-colors ${
                        theme === 'dark' ? 'border-white/10 hover:bg-white/5 text-gray-300' : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      Fechar Perfil
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </div>
    </AppLayout>
  );
}