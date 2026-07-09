import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, DollarSign, Users, Calendar, Music,
  Star, Flame, BarChart3,
  SlidersHorizontal, CheckCircle, Shield, FileText, Send, X, Filter, Award, Edit3,
  CalendarCheck, Trash2, MapPin
} from 'lucide-react';
import AppLayout from '../../components/shared/AppLayout';
import StatCard from '../../components/ui/StatCard';
import NeonButton from '../../components/ui/NeonButton';
import { supabase } from '../../lib/supabaseClient';
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

import { useTheme } from '../../lib/ThemeContext';
import { useAuth } from '../../lib/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function VenueDashboard() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user, userProfile, refreshProfile } = useAuth();
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('Maio 2026');
  
  // Profile editing state
  const [isEditingVenue, setIsEditingVenue] = useState(false);
  const [editVenueForm, setEditVenueForm] = useState({ venue_name: '', city: '', address: '', bio: '', capacity: '', logo_url: '' });
  const [saveStatus, setSaveStatus] = useState('');
  
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
  const [paymentMethod, setPaymentMethod] = useState('');
  const [createdEventId, setCreatedEventId] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentQrCode, setPaymentQrCode] = useState('');
  const [paymentQrCodeBase64, setPaymentQrCodeBase64] = useState('');
  const [paymentPixCode, setPaymentPixCode] = useState('');
  const [paymentTicketUrl, setPaymentTicketUrl] = useState('');
  const [mpPaymentId, setMpPaymentId] = useState(null);
  const [paymentCreated, setPaymentCreated] = useState(false);
  const [eventMessage, setEventMessage] = useState('');
  const [eventAddress, setEventAddress] = useState('');
  const [precisaEquipamento, setPrecisaEquipamento] = useState(false);
  const [quantidadePessoas, setQuantidadePessoas] = useState(100);

  // Proposals state
  const [proposals, setProposals] = useState([]);
  const [proposalsLoading, setProposalsLoading] = useState(true);
  const [proposalArtistsMap, setProposalArtistsMap] = useState({});

  // Tabs
  const [activeTab, setActiveTab] = useState('painel');

  // Confirmed shows state
  const [confirmedShows, setConfirmedShows] = useState([]);
  const [confirmedShowsLoading, setConfirmedShowsLoading] = useState(true);
  const [confirmedArtistsMap, setConfirmedArtistsMap] = useState({});

  // Fetch Artists
  useEffect(() => {
    async function loadArtists() {
      try {
        const { data } = await supabase.from('artists').select('*');
        if (data) {
          setArtists(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadArtists();
  }, []);

  // Fetch proposals sent by this venue
  const fetchProposals = async () => {
    if (!userProfile?.id) { setProposalsLoading(false); return; }
    try {
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('venue_id', userProfile.id)
        .in('status', ['pending', 'pending_artist_approval', 'proposed', 'confirmed', 'rejected'])
        .order('date', { ascending: false });
      if (data) {
        const artistIds = [...new Set(data.map(p => p.artist_id).filter(Boolean))];
        let artists = {};
        if (artistIds.length > 0) {
          const { data: artistsData } = await supabase
            .from('artists')
            .select('id, artistic_name, photo_url, genre')
            .in('id', artistIds);
          if (artistsData) {
            artists = artistsData.reduce((acc, a) => { acc[a.id] = a; return acc; }, {});
          }
        }
        setProposalArtistsMap(artists);
        setProposals(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProposalsLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, [userProfile]);

  // Fetch confirmed shows for this venue
  const fetchConfirmedShows = async () => {
    if (!userProfile?.id) { setConfirmedShowsLoading(false); return; }
    try {
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('venue_id', userProfile.id)
        .eq('status', 'confirmed')
        .order('date', { ascending: false });
      if (data) {
        const artistIds = [...new Set(data.map(p => p.artist_id).filter(Boolean))];
        let artists = {};
        if (artistIds.length > 0) {
          const { data: artistsData } = await supabase
            .from('artists')
            .select('id, artistic_name, photo_url, genre')
            .in('id', artistIds);
          if (artistsData) {
            artists = artistsData.reduce((acc, a) => { acc[a.id] = a; return acc; }, {});
          }
        }
        setConfirmedArtistsMap(artists);
        setConfirmedShows(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setConfirmedShowsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfirmedShows();
  }, [userProfile]);

  const handleDeleteProposal = async (proposalId) => {
    try {
      await supabase.from('events').delete().eq('id', proposalId);
      setProposals(prev => prev.filter(p => p.id !== proposalId));
    } catch (err) {
      console.error('Erro ao deletar proposta:', err);
    }
  };

  // Poll for proposal status changes
  useEffect(() => {
    const interval = setInterval(fetchProposals, 5000);
    return () => clearInterval(interval);
  }, [userProfile]);

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

  // Calculate dynamic metrics from proposals (which are events)
  const confirmedEvents = proposals.filter(p => p.status === 'confirmed');
  const totalCaches = confirmedEvents.reduce((sum, p) => sum + (p.fee_proposed || p.fee_agreed || 0), 0);
  const totalEvents = confirmedEvents.length;
  
  // Calculate average audience
  const totalAudience = confirmedEvents.reduce((sum, p) => sum + (p.quantidade_pessoas || 0), 0);
  const avgAudience = totalEvents > 0 ? Math.round(totalAudience / totalEvents) : 0;
  
  // Occupancy rate based on average audience divided by venue capacity
  const capacity = userProfile?.capacity || 100;
  const occupancyRate = capacity > 0 ? Math.min(100, Math.round((avgAudience / capacity) * 100)) : 0;
  
  // Future events count
  const futureEvents = confirmedEvents.filter(p => new Date(p.date) >= new Date()).length;
  
  // Unique artists count
  const hiredArtistsCount = new Set(confirmedEvents.map(p => p.artist_id)).size;
  
  // Total investment / faturamento noites (caches + bar sales / ticket sales simulated at R$ 40 per ticket)
  const simulatedRevenue = confirmedEvents.reduce((sum, p) => sum + ((p.quantidade_pessoas || 0) * 40), 0);
  
  // Total tips received (simulated based on audience size)
  const simulatedTips = confirmedEvents.reduce((sum, p) => sum + Math.round((p.quantidade_pessoas || 0) * 1.5), 0);

  const startHiringFlow = (artist) => {
    setHiringArtist(artist);
    setProposalFee(artist.base_fee);
    setHireStep(1);
    setChatHistory([
      { sender: 'artist', text: `Olá! Fico muito feliz pelo interesse. Meu cachê padrão para São Paulo é de R$ ${artist.base_fee.toLocaleString()}, com som e equipamentos inclusos. O que acha?` }
    ]);
    setEventAddress(userProfile?.address || '');
    setPrecisaEquipamento(false);
    setQuantidadePessoas(100);
    setSigned(false);
    setPaymentDone(false);
    setCreatedEventId(null);
    setPaymentMethod('');
    setPaymentLoading(false);
    setPaymentError('');
    setPaymentQrCode('');
    setPaymentQrCodeBase64('');
    setPaymentPixCode('');
    setPaymentTicketUrl('');
    setMpPaymentId(null);
    setPaymentCreated(false);
    setEventMessage('');
  };

  const handleConfirmBooking = async () => {
    if (!hiringArtist || !user) {
      console.error('handleConfirmBooking: missing hiringArtist or user', { hiringArtist, user });
      setPaymentError('Erro: dados do artista ou usuário não encontrados.');
      return;
    }
    // Garantir que temos o venue_id
    let venueId = userProfile?.id;
    if (!venueId && user?.id) {
      const { data: vData } = await supabase.from('venues').select('id').eq('user_id', user.id).maybeSingle();
      venueId = vData?.id;
      if (!venueId) {
        const { data: newVenue } = await supabase.from('venues').insert({
          user_id: user.id,
          venue_name: user?.user_metadata?.name || 'Minha Casa de Show',
          city: 'São Paulo',
          address: 'Endereço não definido',
          capacity: 100,
          average_budget: 0
        }).select('id').single();
        venueId = newVenue?.id;
      }
    }
    console.log('handleConfirmBooking: starting', { artistId: hiringArtist.id, userId: user.id, proposalFee, eventDate, eventMessage, venueId });
    try {
      const { data: eventData, error: eventErr } = await supabase.from('events').insert({
        title: `Show: ${hiringArtist.artistic_name}`,
        description: eventMessage || `Evento no dia ${eventDate} às ${eventTime}`,
        date: eventDate,
        time: eventTime,
        duration: 120,
        status: 'pending',
        fee_proposed: proposalFee,
        address: eventAddress || 'A definir',
        precisa_equipamento: precisaEquipamento,
        quantidade_pessoas: quantidadePessoas,
        artist_id: hiringArtist.id,
        venue_id: venueId
      }).select();
      console.log('events insert result:', { eventData, eventErr });
      if (eventErr) throw new Error('Erro ao criar evento: ' + eventErr.message);

      if (eventData && eventData[0]) {
        setCreatedEventId(eventData[0].id);
      }

      const senderName = user?.user_metadata?.name || user?.email || 'Casa de Show';
      const msg = eventMessage.trim() || `Olá! Proposta para show no dia ${eventDate} às ${eventTime}. Cachê: R$ ${proposalFee}.`;

      const { data: notifData, error: notifErr } = await supabase.from('notifications').insert({
        user_id: hiringArtist.user_id,
        title: 'Nova Proposta de Show',
        content: `${senderName} enviou uma proposta para ${eventDate}.`,
        type: 'proposal'
      }).select();
      console.log('notifications insert result:', { notifData, notifErr });
      if (notifErr) throw new Error('Erro ao criar notificação: ' + notifErr.message);

      const { data: msgData, error: msgErr } = await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: hiringArtist.user_id,
        text: msg
      }).select();
      console.log('messages insert result:', { msgData, msgErr });
      if (msgErr) throw new Error('Erro ao criar mensagem: ' + msgErr.message);
    } catch (e) {
      console.error('Failed to book venue:', e);
      setPaymentError(e.message);
    }
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

  const saveVenueField = async (field, value) => {
    if (!user) return;
    setSaveStatus('Salvando...');
    try {
      const { error } = await supabase.from('venues').update({ [field]: value }).eq('user_id', user.id);
      if (error) throw error;
      if (refreshProfile) refreshProfile();
      setSaveStatus('');
    } catch (err) {
      console.error(`Erro ao salvar ${field}:`, err);
      setSaveStatus(`Erro: ${err.message || 'desconhecido'}`);
    }
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
            {activeTab === 'painel' && (
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all text-neon-purple"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Filtros Avançados</span>
              </button>
            )}
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex gap-1 p-1 rounded-2xl bg-white/5 border border-white/5 w-fit">
          <button
            onClick={() => setActiveTab('painel')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'painel'
                ? 'bg-neon-purple text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Painel</span>
          </button>
          <button
            onClick={() => setActiveTab('shows')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'shows'
                ? 'bg-neon-purple text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Shows Agendados</span>
          </button>
        </div>

        {activeTab === 'painel' ? (
          <>
        {/* EDIT VENUE PROFILE */}
        {!isEditingVenue ? (
          <button
            onClick={() => {
              setEditVenueForm({
                venue_name: userProfile?.venue_name || '',
                city: userProfile?.city || '',
                address: userProfile?.address || '',
                bio: userProfile?.bio || '',
                capacity: userProfile?.capacity || '',
                logo_url: userProfile?.logo_url || ''
              });
              setIsEditingVenue(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all text-gray-300"
          >
            <Edit3 className="w-4 h-4" />
            <span>Editar Perfil</span>
          </button>
        ) : (
          <div className={`p-4 rounded-2xl border transition-all space-y-3 ${
            theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-white border-gray-200 shadow-xs'
          }`}>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Editar Perfil</h3>
              <button
                onClick={() => setIsEditingVenue(false)}
                className="p-1 rounded bg-white/5 hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="text-[10px] text-gray-400 font-bold block mb-1">Logo / Foto</label>
              <input
                type="file"
                accept="image/*"
                onChange={async e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setSaveStatus('Enviando imagem...');
                  try {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `venue_${user.id}_${Date.now()}.${fileExt}`;
                    const { data, error: uploadErr } = await supabase.storage.from('media').upload(`logos/${fileName}`, file);
                    if (uploadErr) throw uploadErr;
                    const publicUrl = supabase.storage.from('media').getPublicUrl(`logos/${fileName}`).data.publicUrl;
                    setEditVenueForm(f => ({ ...f, logo_url: publicUrl }));
                    setSaveStatus('Salvando...');
                    const updResp = await supabase.from('venues').update({ logo_url: publicUrl }).eq('user_id', user.id);
                    if (updResp.error) throw updResp.error;
                    if (refreshProfile) refreshProfile();
                    setSaveStatus('');
                  } catch (err) {
                    console.error(err);
                    setSaveStatus('Erro ao enviar logo');
                  }
                }}
                className="w-full text-xs text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-neon-purple file:text-white hover:file:opacity-90 cursor-pointer"
              />
              {editVenueForm.logo_url && (
                <img src={editVenueForm.logo_url} alt="Logo" className="w-16 h-16 rounded-xl object-cover mt-2 border border-white/10"
                  onError={e => e.target.style.display = 'none'}
                />
              )}
            </div>
            <div>
              <label className="text-[10px] text-gray-400 font-bold block mb-1">Nome do Estabelecimento</label>
              <input type="text" value={editVenueForm.venue_name}
                onChange={e => setEditVenueForm(f => ({ ...f, venue_name: e.target.value }))}
                onBlur={e => saveVenueField('venue_name', e.target.value)}
                className={`w-full p-2.5 rounded-xl border text-xs outline-none ${
                  theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'
                }`}
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 font-bold block mb-1">Cidade</label>
              <input type="text" value={editVenueForm.city}
                onChange={e => setEditVenueForm(f => ({ ...f, city: e.target.value }))}
                onBlur={e => saveVenueField('city', e.target.value)}
                className={`w-full p-2.5 rounded-xl border text-xs outline-none ${
                  theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'
                }`}
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 font-bold block mb-1">Endereço</label>
              <input type="text" value={editVenueForm.address}
                onChange={e => setEditVenueForm(f => ({ ...f, address: e.target.value }))}
                onBlur={e => saveVenueField('address', e.target.value)}
                className={`w-full p-2.5 rounded-xl border text-xs outline-none ${
                  theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'
                }`}
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 font-bold block mb-1">Sobre (Bio)</label>
              <textarea value={editVenueForm.bio}
                onChange={e => setEditVenueForm(f => ({ ...f, bio: e.target.value }))}
                onBlur={e => saveVenueField('bio', e.target.value)}
                rows={2}
                className={`w-full p-2.5 rounded-xl border text-xs outline-none resize-none ${
                  theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'
                }`}
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 font-bold block mb-1">Capacidade (pessoas)</label>
              <input type="number" value={editVenueForm.capacity}
                onChange={e => setEditVenueForm(f => ({ ...f, capacity: e.target.value }))}
                onBlur={e => saveVenueField('capacity', Number(e.target.value))}
                className={`w-full p-2.5 rounded-xl border text-xs outline-none ${
                  theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'
                }`}
              />
            </div>
            {saveStatus && (
              <p className={`text-[10px] font-bold text-center ${saveStatus.startsWith('Erro') ? 'text-red-400' : 'text-neon-green'}`}>{saveStatus}</p>
            )}
          </div>
        )}

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
                <h2 className="text-4xl md:text-5xl font-black text-white">R$ {(totalCaches + simulatedTips).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
                <div className="flex items-center gap-0.5 text-neon-green text-xs font-bold">
                  <TrendingUp className="w-4 h-4" />
                  <span>+{totalEvents > 0 ? '100' : '0'}%</span>
                </div>
              </div>
              
              <p className="text-[10px] text-gray-500 mt-1">Cachês + Gorjetas extras</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { title: 'Cachês Pagos', value: `R$ ${totalCaches.toLocaleString('pt-BR')}`, icon: DollarSign, color: 'border-neon-purple/20', iconColor: 'text-neon-purple' },
                { title: 'Gorjetas Extras', value: `R$ ${simulatedTips.toLocaleString('pt-BR')}`, icon: Star, color: 'border-neon-green/20', iconColor: 'text-neon-green' },
                { title: 'Total Eventos', value: `${totalEvents} Shows`, icon: Music, color: 'border-white/5', iconColor: 'text-white' },
                { title: 'Média de Público', value: `${avgAudience} pessoas`, icon: Users, color: 'border-white/5', iconColor: 'text-gray-400' }
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
          <StatCard title="Faturamento noites" value={`R$ ${simulatedRevenue.toLocaleString('pt-BR')}`} change={totalEvents > 0 ? 10 : 0} changeLabel="vs. período anterior" icon={DollarSign} iconColor="green" />
          <StatCard title="Artistas contratados" value={`${hiredArtistsCount}`} change={hiredArtistsCount} changeLabel="músicos únicos" icon={Music} iconColor="purple" />
          <StatCard title="Eventos futuros" value={`${futureEvents}`} icon={Calendar} iconColor="green" />
          <StatCard title="Ocupação média" value={`${occupancyRate}%`} change={avgAudience} icon={Users} iconColor="purple" />
        </div>

        {/* PROPOSTAS ENVIADAS */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-neon-purple" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">Propostas Enviadas</h3>
              {!proposalsLoading && (
                <span className="text-[10px] text-gray-500 font-semibold">({proposals.length})</span>
              )}
            </div>
          </div>

          {proposalsLoading ? (
            <div className="h-32 flex items-center justify-center bg-white/5 rounded-2xl border border-white/5">
              <div className="w-5 h-5 border-2 border-neon-purple border-t-transparent rounded-full animate-spin" />
            </div>
          ) : proposals.length === 0 ? (
            <div className="p-6 text-center bg-white/5 rounded-2xl border border-white/5">
              <p className="text-gray-500 text-xs">Nenhuma proposta enviada ainda. Comece contratando artistas acima!</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {proposals.map(p => {
                const artist = proposalArtistsMap[p.artist_id];
                const statusConfig = {
                  pending: { label: 'Pendente', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
                  pending_artist_approval: { label: 'Aguardando Artista', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
                  proposed: { label: 'Proposto', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
                  confirmed: { label: 'Aceito', color: 'text-neon-green bg-neon-green/10 border-neon-green/20' },
                  rejected: { label: 'Recusado', color: 'text-red-400 bg-red-400/10 border-red-400/20' },
                };
                const sc = statusConfig[p.status] || { label: p.status, color: 'text-gray-400 bg-white/5 border-white/10' };
                return (
                  <div key={p.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-4 hover:border-white/10 transition-all">
                    <img
                      src={artist?.photo_url || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop'}
                      alt={artist?.artistic_name || 'Artista'}
                      className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white truncate">{artist?.artistic_name || 'Artista'}</h4>
                        {artist?.genre && <span className="text-[10px] text-gray-500 hidden sm:inline">{artist.genre}</span>}
                      </div>
                      <p className="text-xs text-gray-400">
                        {new Date(p.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                        {p.time && <> às {p.time.substring(0, 5)}</>}
                        <span className="mx-1.5 text-gray-600">•</span>
                        R$ {Number(p.fee_proposed).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-bold border ${sc.color}`}>
                        {sc.label}
                      </span>
                      <button
                        onClick={() => handleDeleteProposal(p.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-all"
                        title="Excluir proposta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
                        onClick={() => navigate('/venue/artists', { state: { hireArtist: a } })}
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
                          onClick={() => navigate('/venue/artists', { state: { hireArtist: a } })}
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
                    onClick={() => navigate('/venue/artists', { state: { hireArtist: artist } })}
                    className="px-2.5 py-1.5 rounded-lg border border-neon-purple/20 text-neon-purple hover:bg-neon-purple/10 text-[10px] font-bold transition-all"
                  >
                    Chamar
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

          </>
        ) : (
          <>
        {/* SHOWS AGENDADOS */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-neon-green" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">Shows Agendados</h3>
              {confirmedShows.length > 0 && (
                <span className="text-[10px] text-gray-500 font-semibold">({confirmedShows.length})</span>
              )}
            </div>
          </div>

          {confirmedShowsLoading ? (
            <div className="h-40 flex items-center justify-center bg-white/5 rounded-2xl border border-white/5">
              <div className="w-5 h-5 border-2 border-neon-purple border-t-transparent rounded-full animate-spin" />
            </div>
          ) : confirmedShows.length === 0 ? (
            <div className="p-8 text-center bg-white/5 rounded-2xl border border-white/5">
              <CalendarCheck className="w-10 h-10 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400 text-sm font-semibold">Nenhum show agendado ainda</p>
              <p className="text-gray-500 text-xs mt-1">As propostas aceitas pelos artistas aparecerão aqui.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {confirmedShows.map(s => {
                const artist = confirmedArtistsMap[s.artist_id];
                const formattedDate = new Date(s.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
                return (
                  <div key={s.id} className="p-5 bg-white/5 border border-neon-green/10 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-4 hover:border-neon-green/20 transition-all">
                    <img
                      src={artist?.photo_url || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop'}
                      alt={artist?.artistic_name || 'Artista'}
                      className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white">{artist?.artistic_name || 'Artista'}</h4>
                        <CheckCircle className="w-4 h-4 text-neon-green" />
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-neon-green/10 text-neon-green border border-neon-green/20">Confirmado</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{artist?.genre || ''}</p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-neon-green" /> {formattedDate}
                          {s.time && <> às {s.time.substring(0, 5)}</>}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-neon-green" /> {s.address || 'Local não informado'}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5 text-neon-green" /> R$ {Number(s.fee_proposed || s.fee_agreed).toLocaleString('pt-BR')}
                        </span>
                        {s.quantidade_pessoas && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-neon-green" /> {s.quantidade_pessoas} pessoas
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
          </>
        )}

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
                      <label className="text-xs text-gray-400 font-bold block mb-1">Valor do Show (R$)</label>
                      <input 
                        type="number"
                        value={proposalFee}
                        onChange={e => setProposalFee(parseInt(e.target.value))}
                        className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs" 
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-400 font-bold block mb-1">Local do Evento</label>
                      <input 
                        type="text"
                        value={eventAddress}
                        onChange={e => setEventAddress(e.target.value)}
                        placeholder="Ex: Rua das Flores, 123 - Pinheiros"
                        className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs" 
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-400 font-bold block mb-1">Público Médio</label>
                        <input 
                          type="number"
                          value={quantidadePessoas}
                          onChange={e => setQuantidadePessoas(parseInt(e.target.value) || 0)}
                          placeholder="Nº de pessoas"
                          className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs" 
                        />
                      </div>
                      <div className="flex items-end pb-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={precisaEquipamento}
                            onChange={e => setPrecisaEquipamento(e.target.checked)}
                            className="w-4 h-4 rounded bg-white/5 border-white/10 text-neon-purple focus:ring-0 cursor-pointer"
                          />
                          <span className="text-xs text-gray-300 font-semibold">Precisa levar equipamento?</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-gray-400 font-bold block mb-1">Mensagem para o Artista</label>
                      <textarea 
                        value={eventMessage}
                        onChange={e => setEventMessage(e.target.value)}
                        placeholder="Escreva sua proposta... (data, valores, condições)"
                        rows={3}
                        className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs resize-none" 
                      />
                    </div>

                    <NeonButton variant="purple" className="w-full py-3 mt-4" onClick={async () => {
                      await handleConfirmBooking();
                      setHireStep(2);
                    }}>
                      Avançar para Negociação
                    </NeonButton>
                  </div>
                )}

                {/* STEP 2: NEGOTIATION CHAT */}
                {hireStep === 2 && (
                  <div className="space-y-4">
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {chatHistory.map((msg, i) => (
                        <div key={i} className={`flex ${msg.sender === 'venue' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] p-2.5 rounded-xl text-xs ${
                            msg.sender === 'venue' 
                              ? 'bg-neon-purple text-white rounded-tr-sm' 
                              : 'bg-white/5 text-gray-300 rounded-tl-sm'
                          }`}>
                            <p>{msg.text}</p>
                            <span className="text-[9px] opacity-60 mt-1 block">{msg.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={chatMessage}
                        onChange={e => setChatMessage(e.target.value)}
                        placeholder="Digite sua mensagem..."
                        className="flex-1 p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs"
                      />
                      <button 
                        onClick={() => {
                          if (chatMessage.trim()) {
                            setChatHistory([...chatHistory, {
                              sender: 'venue',
                              text: chatMessage,
                              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            }]);
                            setChatMessage('');
                          }
                        }}
                        className="px-4 rounded-xl bg-neon-purple text-white"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => setHireStep(1)} className="flex-1 py-2.5 border border-white/10 text-xs rounded-xl hover:bg-white/5">
                        Voltar
                      </button>
                      <button onClick={() => setHireStep(3)} className="flex-1 py-2.5 bg-neon-green text-black font-bold text-xs rounded-xl">
                        Avançar para Assinatura
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: SIGNATURE */}
                {hireStep === 3 && (
                  <div className="space-y-4">
                    <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-3">
                      <div className="flex items-center gap-3">
                        <img src={hiringArtist.photo_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        <div>
                          <h4 className="text-sm font-bold text-white">{hiringArtist.artistic_name}</h4>
                          <p className="text-xs text-gray-400">R$ {proposalFee.toLocaleString()} • {eventDate}</p>
                        </div>
                      </div>
                      <div className="border-t border-white/5 pt-3">
                        <h5 className="text-xs font-bold text-neon-green uppercase tracking-wider">Termos do Contrato</h5>
                        <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                          O contratante compromete-se a pagar o valor acordado de R$ {proposalFee.toLocaleString()} 
                          para o show no dia {eventDate}. O artista compromete-se a realizar a apresentação 
                          conforme combinado.
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-gray-400 font-bold block mb-1">Assinatura Digital</label>
                      <input 
                        type="text"
                        value={signatureName}
                        onChange={e => setSignatureName(e.target.value)}
                        placeholder="Digite seu nome completo para assinar"
                        className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => setHireStep(2)} className="flex-1 py-2.5 border border-white/10 text-xs rounded-xl hover:bg-white/5">
                        Voltar
                      </button>
                      <button 
                        onClick={() => {
                          if (signatureName.trim()) {
                            setSigned(true);
                            setHireStep(4);
                          }
                        }}
                        className="flex-1 py-2.5 bg-neon-green text-black font-bold text-xs rounded-xl"
                      >
                        Assinar Contrato
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 4: PAYMENT */}
                {hireStep === 4 && (
                  <div className="space-y-4">
                    <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                      <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Resumo do Pagamento</h5>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-300">Cachê Artístico</span>
                        <span className="text-sm font-bold text-neon-green">R$ {proposalFee.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-gray-400">Taxa de Serviço (10%)</span>
                        <span className="text-xs text-gray-400">R$ {Math.round(proposalFee * 0.1).toLocaleString()}</span>
                      </div>
                      <div className="border-t border-white/5 mt-2 pt-2 flex justify-between items-center">
                        <span className="text-sm font-bold text-white">Total</span>
                        <span className="text-sm font-bold text-white">R$ {Math.round(proposalFee * 1.1).toLocaleString()}</span>
                      </div>
                    </div>

                    {!paymentCreated ? (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          {['pix', 'credit', 'boleto'].map(method => (
                            <button key={method} onClick={() => setPaymentMethod(method)} className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                              paymentMethod === method 
                                ? 'border-neon-purple bg-neon-purple/10 text-neon-purple' 
                                : 'border-white/10 text-gray-400 hover:border-white/20'
                            }`}>
                              {method === 'pix' ? 'Pix' : method === 'credit' ? 'Cartão' : 'Boleto'}
                            </button>
                          ))}
                        </div>

                        {paymentError && (
                          <p className="text-xs text-red-400 text-center">{paymentError}</p>
                        )}

                        <div className="flex gap-2">
                          <button onClick={() => setHireStep(3)} className="flex-1 py-2.5 border border-white/10 text-xs rounded-xl hover:bg-white/5">
                            Voltar
                          </button>
                          <button
                            disabled={!paymentMethod || paymentLoading}
                            onClick={async () => {
                              if (!createdEventId) {
                                setPaymentError('Evento ainda não foi criado. Volte e envie a proposta primeiro.');
                                return;
                              }
                              setPaymentLoading(true);
                              setPaymentError('');
                              try {
                                const { data, error } = await supabase.functions.invoke('asaas-create-payment', {
                                  body: {
                                    event_id: createdEventId,
                                    amount: Math.round(proposalFee * 1.1),
                                    method: paymentMethod,
                                    payer_email: user?.email,
                                    description: `Show: ${hiringArtist?.artistic_name} - ${eventDate}`
                                  }
                                });

                                if (error || data?.error) {
                                  throw new Error(data?.error || error?.message || 'Erro ao criar pagamento');
                                }

                                setPaymentQrCode(data.qrCode || '');
                                setPaymentQrCodeBase64(data.qrCodeBase64 || '');
                                setPaymentPixCode(data.qrCode || '');
                                setPaymentTicketUrl(data.ticketUrl || '');
                                setMpPaymentId(data.mpPaymentId);
                                setPaymentCreated(true);
                              } catch (err) {
                                console.error('Payment error:', err);
                                setPaymentError(err.message || 'Erro ao processar pagamento');
                              } finally {
                                setPaymentLoading(false);
                              }
                            }}
                            className="flex-1 py-2.5 bg-neon-green text-black font-bold text-xs rounded-xl disabled:opacity-50"
                          >
                            {paymentLoading ? 'Processando...' : `Pagar R$ ${Math.round(proposalFee * 1.1).toLocaleString()}`}
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="p-4 rounded-xl border border-neon-green/30 bg-neon-green/5 space-y-3">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-neon-green" />
                            <span className="text-xs font-bold text-neon-green">Cobrança gerada com sucesso!</span>
                          </div>

                          {paymentMethod === 'pix' && paymentQrCodeBase64 && (
                            <div className="flex flex-col items-center gap-3">
                              <img
                                src={`data:image/png;base64,${paymentQrCodeBase64}`}
                                alt="QR Code PIX"
                                className="w-48 h-48 rounded-xl bg-white p-2"
                              />
                              <div className="w-full">
                                <label className="text-[10px] text-gray-500 font-bold block mb-1">Código PIX (Copiar e Colar)</label>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    readOnly
                                    value={paymentPixCode}
                                    className="flex-1 p-2 bg-white/5 border border-white/10 rounded-xl text-[10px] text-gray-300 truncate"
                                  />
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(paymentPixCode);
                                    }}
                                    className="px-3 py-2 bg-neon-purple/20 border border-neon-purple/30 text-neon-purple text-[10px] font-bold rounded-xl whitespace-nowrap"
                                  >
                                    Copiar
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {paymentMethod === 'boleto' && paymentTicketUrl && (
                            <div className="text-center">
                              <p className="text-xs text-gray-400 mb-2">Clique no botão abaixo para visualizar o boleto:</p>
                              <a
                                href={paymentTicketUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block px-6 py-2.5 bg-neon-purple text-white font-bold text-xs rounded-xl"
                              >
                                Ver Boleto
                              </a>
                            </div>
                          )}

                          {paymentMethod === 'credit' && (
                            <p className="text-xs text-gray-400 text-center">Pagamento com cartão será processado automaticamente.</p>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setPaymentCreated(false);
                              setPaymentQrCode('');
                              setPaymentQrCodeBase64('');
                              setPaymentPixCode('');
                              setPaymentTicketUrl('');
                              setMpPaymentId(null);
                              setPaymentError('');
                            }}
                            className="flex-1 py-2.5 border border-white/10 text-xs rounded-xl hover:bg-white/5"
                          >
                            Alterar Método
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                const { data, error } = await supabase.functions.invoke('asaas-check-payment', {
                                  body: { payment_id: mpPaymentId }
                                });

                                if (!error && data?.mpStatus === 'approved') {
                                  setPaymentDone(true);
                                  setHireStep(5);
                                } else {
                                  setPaymentError('Pagamento ainda não foi confirmado. Após realizar o PIX, clique novamente.');
                                }
                              } catch (err) {
                                console.error('Check payment error:', err);
                                setPaymentError('Erro ao verificar pagamento');
                              }
                            }}
                            className="flex-1 py-2.5 bg-neon-green text-black font-bold text-xs rounded-xl"
                          >
                            Já Realizei o Pagamento
                          </button>
                        </div>

                        <button
                          onClick={() => {
                            setPaymentDone(true);
                            setHireStep(5);
                          }}
                          className="w-full py-2 border border-white/10 text-[10px] text-gray-500 rounded-xl hover:text-gray-300"
                        >
                          Pular verificação (pagamento confirmado manualmente)
                        </button>

                        {paymentError && (
                          <p className="text-xs text-red-400 text-center">{paymentError}</p>
                        )}
                      </>
                    )}
                  </div>
                )}

                {hireStep === 5 && (
                  <div className="space-y-4 text-center">
                    <CheckCircle className="w-16 h-16 text-neon-green mx-auto" />
                    <h3 className="text-white font-bold text-lg">Contratação Concluída!</h3>
                    <p className="text-gray-400 text-xs">O contrato foi assinado e o pagamento processado com sucesso.</p>
                    <button 
                      onClick={() => { setHiringArtist(null); setHireStep(1); setPaymentDone(false); setSigned(false); setChatHistory([]); setCreatedEventId(null); setPaymentCreated(false); setPaymentMethod(''); setPaymentQrCode(''); setPaymentQrCodeBase64(''); setPaymentPixCode(''); setPaymentTicketUrl(''); setMpPaymentId(null); setPaymentError(''); }}
                      className="w-full py-3 bg-neon-green text-black font-bold text-xs rounded-xl hover:opacity-90 transition-opacity"
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
                        const artist = selectedArtistProfile;
                        setSelectedArtistProfile(null);
                        navigate('/venue/artists', { state: { hireArtist: artist } });
                      }}
                      className="flex-1 py-3 rounded-xl bg-neon-purple text-white text-xs font-bold hover:shadow-[0_0_15px_rgba(123,46,255,0.4)] transition-all"
                    >
                      Iniciar Contratação de Show
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
