import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, DollarSign, Calendar, Star, Users, Music, Crown,
  CheckCircle, Play, Pause,
  Volume2, UploadCloud, ToggleLeft, ToggleRight, Check, X, Search,
  Bot, FileText, Plus, Trash2, Clock, Sparkles, RefreshCw, XCircle, MessageCircle, ChevronUp
} from 'lucide-react';
import AppLayout from '../../components/shared/AppLayout';
import StatCard from '../../components/ui/StatCard';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/AuthContext';
import { useTheme } from '../../lib/ThemeContext';

const earningsData = [];

const growthData = [];

export default function ArtistDashboard() {
  const { user, userProfile, isLoadingAuth, refreshProfile } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [shows, setShows] = useState([]);
  const [musicasRepertorio, setMusicasRepertorio] = useState([]);
  const [selectedMusicasIds, setSelectedMusicasIds] = useState([]);

  const [availabilityAuto, setAvailabilityAuto] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const [tipPeriod, setTipPeriod] = useState('day'); // 'day' | 'month'

  useEffect(() => {
    if (userProfile) {
      setAvailabilityAuto(!!userProfile.live_now);
    }
  }, [userProfile]);

  const handleToggleLive = async () => {
    if (!user?.id) return;
    const nextLiveState = !availabilityAuto;
    setAvailabilityAuto(nextLiveState);
    try {
      await supabase
        .from('artists')
        .update({ live_now: nextLiveState })
        .eq('user_id', user.id);
      if (refreshProfile) refreshProfile();
    } catch (e) {
      console.error('Error toggling live status:', e);
    }
  };

  // Requests System States
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Auto-archive requests from playing to completed status after 1 minute
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      requests.forEach(async (req) => {
        if (req.status === 'playing' && req.played_at) {
          const playedTime = new Date(req.played_at);
          const diffMs = now - playedTime;
          const diffMins = diffMs / 1000 / 60;
          if (diffMins >= 1) {
            // Auto archive to completed (Tocado)
            await supabase
              .from('music_requests')
              .update({ status: 'completed' })
              .eq('id', req.id);
            setRequests(prev =>
              prev.map(r => r.id === req.id ? { ...r, status: 'completed' } : r)
            );
          }
        }
      });
    }, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [requests]);

  const loadRequests = async () => {
    if (!user?.id) return;
    const isFirstLoad = requests.length === 0;
    if (isFirstLoad) setLoadingRequests(true);
    try {
      const { data } = await supabase
        .from('music_requests')
        .select('*')
        .eq('artist_id', user.id)
        .order('requested_at', { ascending: false });
      
      setRequests(data || []);
    } catch (e) {
      console.log('music_requests table not ready');
    }
    if (isFirstLoad) setLoadingRequests(false);
  };

  const updateRequestStatus = async (requestId, newStatus) => {
    const updates = { status: newStatus };
    if (newStatus === 'playing') {
      updates.played_at = new Date().toISOString();
    }

    await supabase
      .from('music_requests')
      .update(updates)
      .eq('id', requestId);

    setRequests(prev =>
      prev.map(r => r.id === requestId ? { ...r, ...updates } : r)
    );

    // Auto-archive (set to cancelled) 1 minute after status becomes 'playing'
    if (newStatus === 'playing') {
      setTimeout(async () => {
        const archiveUpdates = { status: 'cancelled' };
        await supabase
          .from('music_requests')
          .update(archiveUpdates)
          .eq('id', requestId);

        setRequests(prev =>
          prev.map(r => r.id === requestId ? { ...r, ...archiveUpdates } : r)
        );
      }, 60000);
    }
  };

  const deleteRequest = async (requestId) => {
    await supabase
      .from('music_requests')
      .delete()
      .eq('id', requestId);

    setRequests(prev => prev.filter(r => r.id !== requestId));
  };

  useEffect(() => {
    if (user?.id) {
      loadRequests();
    }
  }, [user?.id]);

  useEffect(() => {
    if (!autoRefresh || !user?.id) return;
    const interval = setInterval(loadRequests, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, user?.id]);

  useEffect(() => {
    async function loadRepertorio() {
      const { data: musicas } = await supabase
        .from('musicas_repertorio')
        .select('*')
        .order('artista_nome', { ascending: true });
      if (musicas) setMusicasRepertorio(musicas);
    }
    loadRepertorio();
  }, []);

  useEffect(() => {
    async function fetchShows() {
      if (!userProfile?.id) return;
      const { data: showsData } = await supabase
        .from('events')
        .select('*')
        .eq('artist_id', userProfile.id)
        .eq('status', 'confirmed')
        .order('date', { ascending: true });
      if (showsData) setShows(showsData);
    }
    fetchShows();
  }, [userProfile]);

  useEffect(() => {
    if (userProfile?.selected_musicas_ids) {
      setSelectedMusicasIds(userProfile.selected_musicas_ids);
    }
  }, [userProfile]);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editingSetlist, setEditingSetlist] = useState(null); // { id, name, musicas_ids, active } | null
  const [newSetlistName, setNewSetlistName] = useState('');
  const [newSetlistFileText, setNewSetlistFileText] = useState('');
  const [newSetlistFileName, setNewSetlistFileName] = useState('');
  const [newSetlistSongs, setNewSetlistSongs] = useState([]);
  const [newSetlistSearch, setNewSetlistSearch] = useState('');

  const toggleMusica = (musicaId) => {
    setSaved(false);
    if (editingSetlist) {
      const musicas_ids = editingSetlist.musicas_ids.includes(musicaId)
        ? editingSetlist.musicas_ids.filter(id => id !== musicaId)
        : [...editingSetlist.musicas_ids, musicaId];
      setEditingSetlist({ ...editingSetlist, musicas_ids });
    } else {
      setSelectedMusicasIds(prev =>
        prev.includes(musicaId)
          ? prev.filter(id => id !== musicaId)
          : [...prev, musicaId]
      );
    }
  };

  const salvarRepertorio = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      if (editingSetlist) {
        const updatedSetlists = (userProfile?.setlists || []).map(s => {
          if (s.id === editingSetlist.id) {
            return editingSetlist;
          }
          return s;
        });
        const updates = { setlists: updatedSetlists };
        if (editingSetlist.active) {
          updates.selected_musicas_ids = editingSetlist.musicas_ids;
          setSelectedMusicasIds(editingSetlist.musicas_ids);
        }
        await supabase.from('artists').update(updates).eq('user_id', user.id);
        setEditingSetlist(null);
      } else {
        await supabase.from('artists').update({ selected_musicas_ids: selectedMusicasIds }).eq('user_id', user.id);
      }
    } catch (e) { console.error('Erro ao salvar:', e); }
    if (refreshProfile) refreshProfile();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const parseAndRegisterSongs = async (text) => {
    const parsed = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const parsedSongs = parsed.map(line => {
      let titulo = line;
      let artista_nome = 'Vários';
      const parts = line.split(/ - | – | — /);
      if (parts.length > 1) {
        titulo = parts[0].trim();
        artista_nome = parts[1].trim();
      } else {
        const parts2 = line.split(/\s{2,}/);
        if (parts2.length > 1) {
          titulo = parts2[0].trim();
          artista_nome = parts2[1].trim();
        }
      }
      return { titulo, artista_nome };
    });

    const { data: allGlobalSongs } = await supabase
      .from('musicas_repertorio')
      .select('id, titulo, artista_nome');

    const newSongIds = [];
    const songsToInsert = [];

    // Deduplicate parsedSongs by case-insensitive title
    const uniqueParsedSongs = [];
    const seenTitles = new Set();
    for (const song of parsedSongs) {
      const cleanTitle = song.titulo.toLowerCase().trim();
      if (!seenTitles.has(cleanTitle)) {
        seenTitles.add(cleanTitle);
        uniqueParsedSongs.push(song);
      }
    }

    for (const song of uniqueParsedSongs) {
      const matched = allGlobalSongs?.find(s => 
        s.titulo.toLowerCase().trim() === song.titulo.toLowerCase().trim()
      );
      if (matched) {
        newSongIds.push(matched.id);
      } else {
        songsToInsert.push({
          titulo: song.titulo,
          artista_nome: song.artista_nome,
          duracao_seg: 180,
          genero: userProfile?.genre || 'Sertanejo'
        });
      }
    }

    if (songsToInsert.length > 0) {
      const { data: insertedSongs, error: insertError } = await supabase
        .from('musicas_repertorio')
        .insert(songsToInsert)
        .select('id');
      if (insertError) throw insertError;
      if (insertedSongs) {
        newSongIds.push(...insertedSongs.map(s => s.id));
      }
    }

    const { data: musicas } = await supabase
      .from('musicas_repertorio')
      .select('*')
      .order('artista_nome', { ascending: true });
    if (musicas) setMusicasRepertorio(musicas);

    return newSongIds;
  };

  const handleCreateSetlist = async () => {
    if (!newSetlistName.trim() || !user?.id) return;
    setIsProcessingFile(true);
    try {
      let musicasIds = [...newSetlistSongs];
      const updates = {};

      if (newSetlistFileText.trim()) {
        const newSongIds = await parseAndRegisterSongs(newSetlistFileText);
        musicasIds = Array.from(new Set([...musicasIds, ...newSongIds]));
        // Also add them to the artist's general repertoire (selectedMusicasIds)
        const updatedIds = Array.from(new Set([...selectedMusicasIds, ...newSongIds]));
        setSelectedMusicasIds(updatedIds);
        updates.selected_musicas_ids = updatedIds;
      }

      const newSetlist = {
        id: 'set-' + Date.now(),
        name: newSetlistName.trim(),
        musicas_ids: musicasIds,
        active: false
      };
      const updatedSetlists = [...(userProfile?.setlists || []), newSetlist];
      updates.setlists = updatedSetlists;
      
      await supabase.from('artists').update(updates).eq('user_id', user.id);
      setNewSetlistName('');
      setNewSetlistFileText('');
      setNewSetlistFileName('');
      setNewSetlistSongs([]);
      setNewSetlistSearch('');
      if (refreshProfile) refreshProfile();
    } catch (e) {
      console.error(e);
      alert('Erro ao criar setlist: ' + e.message);
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleDeleteSetlist = async (setlistId) => {
    if (!user?.id) return;
    const updatedSetlists = (userProfile?.setlists || []).filter(s => s.id !== setlistId);
    try {
      await supabase.from('artists').update({ setlists: updatedSetlists }).eq('user_id', user.id);
      if (editingSetlist?.id === setlistId) setEditingSetlist(null);
      if (refreshProfile) refreshProfile();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleSetlistActive = async (setlistId) => {
    if (!user?.id) return;
    let activeSetlistSongs = null;
    let nextActiveState = false;
    const updatedSetlists = (userProfile?.setlists || []).map(s => {
      if (s.id === setlistId) {
        const active = !s.active;
        nextActiveState = active;
        if (active) {
          activeSetlistSongs = s.musicas_ids || [];
        }
        return { ...s, active };
      }
      return { ...s, active: false };
    });

    try {
      const updates = { setlists: updatedSetlists };
      // If we activated a playlist, sync its songs to the general active repertoire
      if (nextActiveState && activeSetlistSongs !== null) {
        updates.selected_musicas_ids = activeSetlistSongs;
        setSelectedMusicasIds(activeSetlistSongs);
      }
      await supabase.from('artists').update(updates).eq('user_id', user.id);
      if (refreshProfile) refreshProfile();
    } catch (e) {
      console.error(e);
    }
  };

  const handleImportPlaylistFromText = async (text) => {
    setIsProcessingFile(true);
    try {
      const newSongIds = await parseAndRegisterSongs(text);
      const updatedIds = Array.from(new Set([...selectedMusicasIds, ...newSongIds]));
      setSelectedMusicasIds(updatedIds);
      
      await supabase.from('artists').update({ selected_musicas_ids: updatedIds }).eq('user_id', user.id);
      if (refreshProfile) refreshProfile();

      alert(`Sucesso! Adicionei ${newSongIds.length} músicas ao seu repertório.`);
    } catch (err) {
      console.error('Erro na importação:', err);
      alert('Erro: ' + err.message);
    } finally {
      setIsProcessingFile(false);
    }
  };
  const pendingRequests = requests
    .filter(request => request.status === 'pending' || request.status === 'playing')
    .sort((a, b) => {
      const tipA = Number(a.amount) || 0;
      const tipB = Number(b.amount) || 0;

      // 1. Sort by tip value descending if at least one has a tip
      if (tipA > 0 || tipB > 0) {
        return tipB - tipA;
      }

      // 2. If both have no tips, sort by requested_at ascending (first in, first out)
      const dateA = new Date(a.requested_at || 0).getTime();
      const dateB = new Date(b.requested_at || 0).getTime();
      return dateA - dateB;
    });

  const totalTips = requests
    .filter(r => {
      const tipValue = Number(r.amount) || 0;
      if (tipValue <= 0) return false;
      
      const reqDate = new Date(r.requested_at);
      const now = new Date();
      if (tipPeriod === 'day') {
        return reqDate.getDate() === now.getDate() &&
               reqDate.getMonth() === now.getMonth() &&
               reqDate.getFullYear() === now.getFullYear();
      } else {
        return reqDate.getMonth() === now.getMonth() &&
               reqDate.getFullYear() === now.getFullYear();
      }
    })
    .reduce((acc, r) => acc + (Number(r.amount) || 0), 0);

  const getTopDonator = () => {
    const now = new Date();
    const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
    
    const recentTips = requests.filter(r => {
      const tipValue = Number(r.amount) || 0;
      const reqDate = new Date(r.requested_at);
      return tipValue > 0 && reqDate >= twelveHoursAgo;
    });

    const donationsByUser = {};
    recentTips.forEach(r => {
      const name = r.user_name || 'Anônimo';
      donationsByUser[name] = (donationsByUser[name] || 0) + Number(r.amount);
    });

    let topUser = '';
    let topAmount = 0;
    Object.entries(donationsByUser).forEach(([name, amount]) => {
      if (amount > topAmount) {
        topAmount = amount;
        topUser = name;
      }
    });

    return { name: topUser, amount: topAmount };
  };

  const topDonator = getTopDonator();

  return (
    <AppLayout role="artist">
      <div className="space-y-8 pb-10">
        
        {/* TOP ROW: PROFILE HEADER */}
        <div className="flex flex-row justify-between items-center gap-4 w-full">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img 
                src={userProfile?.photo_url || user?.avatar_url || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop'} 
                alt="Avatar" 
                className="w-16 h-16 rounded-2xl object-cover border-2 border-neon-purple/50"
              />
              <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-[#08041A] flex items-center justify-center ${
                availabilityAuto ? 'bg-red-500' : 'bg-gray-500'
              }`}>
                <span className="text-[8px] font-black text-black">LIVE</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg md:text-2xl font-black text-white">{userProfile?.artistic_name || user?.name || 'Artista'}</h1>
                <CheckCircle className="w-5 h-5 text-neon-purple flex-shrink-0" />
              </div>
              <p className="text-xs text-gray-400">{userProfile?.genre ? `${userProfile.genre} • ` : ''}{userProfile?.city || 'Local não definido'}</p>
            </div>
          </div>

          {/* Live Toggle */}
          <div className="flex items-center gap-1.5 md:gap-2.5 p-2 md:p-3 rounded-xl bg-white/5 border border-white/10 flex-shrink-0">
            <span className="text-[10px] md:text-xs text-gray-300 font-bold uppercase tracking-wider">Ao Vivo</span>
            <button onClick={handleToggleLive}>
              {availabilityAuto ? (
                <ToggleRight className="w-7 h-7 md:w-9 md:h-9 text-red-500" />
              ) : (
                <ToggleLeft className="w-7 h-7 md:w-9 md:h-9 text-gray-500" />
              )}
            </button>
            <span className="text-[8px] md:text-[10px] text-gray-400 font-semibold">{availabilityAuto ? 'Ao Vivo' : 'Não Ao Vivo'}</span>
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
              <div className="flex items-center justify-between w-full">
                <span className="text-[10px] uppercase font-black text-neon-green tracking-widest">
                  Gorjetas do {tipPeriod === 'day' ? 'Dia' : 'Mês'}
                </span>
                <button
                  onClick={() => setTipPeriod(prev => prev === 'day' ? 'month' : 'day')}
                  className="px-2.5 py-1 rounded-xl bg-neon-green/20 border border-neon-green/30 hover:bg-neon-green/30 text-neon-green text-[10px] font-bold transition-all"
                >
                  {tipPeriod === 'day' ? 'Mês' : 'Dia'}
                </button>
              </div>
              <h2 className="text-4xl font-black text-white mt-1">R$ {totalTips.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
              <div className="flex items-center gap-1 text-neon-green text-xs font-bold mt-1">
                <TrendingUp className="w-4 h-4" />
                <span>{requests.filter(r => (Number(r.amount) || 0) > 0).length} gorjetas no total</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                  <Crown className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-black tracking-wider block">Maior Doador da Noite (12h)</span>
                  <p className="text-base font-bold text-white mt-0.5">
                    {topDonator.name ? topDonator.name : 'Nenhum doador ainda'}
                  </p>
                </div>
              </div>
              {topDonator.amount > 0 && (
                <div className="text-right">
                  <span className="text-[10px] text-neon-green uppercase font-black tracking-wider block">Total Acumulado</span>
                  <p className="text-lg font-black text-[#39FF6A] mt-0.5">
                    R$ {topDonator.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* REQUESTS LIST / PEDIDOS DE MÚSICAS */}
        <div className="p-5 rounded-3xl bg-[#0F0926] border border-white/5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">Pedidos de Músicas</h3>
              <p className="text-[10px] text-gray-400">Gerencie os pedidos de música em tempo real.</p>
            </div>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`p-2 rounded-xl border transition-all text-xs font-bold flex items-center gap-1.5 ${
                autoRefresh
                  ? 'bg-neon-green/20 border-neon-green/30 text-neon-green'
                  : 'bg-white/5 border-white/10 text-gray-400'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-spin' : ''}`} />
              <span>{autoRefresh ? 'Auto' : 'Manual'}</span>
            </button>
          </div>

          {loadingRequests && pendingRequests.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-neon-purple/30 border-t-neon-purple rounded-full animate-spin" />
            </div>
          ) : pendingRequests.length === 0 ? (
            <p className="text-xs text-gray-500 italic text-center py-6">Nenhum pedido pendente recebido ainda.</p>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map(request => {
                const tipValue = Number(request.amount) || 0;
                const hasTip = tipValue > 0;
                
                // Status styles configuration
                const statusStyles = {
                  pending: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
                  approved: 'bg-neon-green/20 text-neon-green border border-neon-green/30',
                  playing: 'bg-neon-purple/20 text-neon-purple border border-neon-purple/30',
                  completed: 'bg-neon-green/20 text-neon-green border border-neon-green/30',
                  cancelled: 'bg-red-500/20 text-red-400 border border-red-500/30',
                };
                const statusLabels = {
                  pending: 'Pendente',
                  approved: 'Aprovado',
                  playing: 'Tocando',
                  completed: 'Tocado',
                  cancelled: 'Arquivado/Recusado',
                };

                return (
                  <div
                    key={request.id}
                    className={`p-5 rounded-3xl border flex flex-col gap-4 transition-all ${
                      hasTip 
                        ? 'border-[#39FF6A]/30 bg-[#39FF6A]/5' 
                        : 'bg-white/5 border-white/5'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center flex-shrink-0">
                          <Music className="w-6 h-6 text-neon-purple" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-lg font-bold text-white truncate">{request.musica_titulo}</p>
                          <p className="text-sm text-gray-400 mt-0.5 truncate">{request.musica_artista}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${statusStyles[request.status] || statusStyles.pending}`}>
                        {statusLabels[request.status] || 'Pendente'}
                      </span>
                    </div>

                    {request.message && (
                      <div className="flex items-center gap-2.5 bg-white/5 px-4 py-2.5 rounded-xl text-xs text-white">
                        <MessageCircle className="w-4 h-4 text-neon-purple flex-shrink-0" />
                        <span>"{request.message}"</span>
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {new Date(request.requested_at).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      {request.user_name && <span>por {request.user_name}</span>}
                      {hasTip && (
                        <span className="text-[#39FF6A] font-bold flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 fill-[#39FF6A]" />
                          PIX R$ {tipValue.toFixed(2)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 w-full">
                      {request.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateRequestStatus(request.id, 'playing')}
                            className="flex-1 py-3 rounded-2xl bg-[#1B3B2B] text-[#39FF6A] border border-[#39FF6A]/30 text-xs font-bold hover:bg-[#235039] transition-all"
                          >
                            Tocar
                          </button>
                          <button
                            onClick={() => updateRequestStatus(request.id, 'cancelled')}
                            className="flex-1 py-3 rounded-2xl bg-[#28154D] text-[#A855F7] border border-[#A855F7]/30 text-xs font-bold hover:bg-[#381F69] transition-all"
                          >
                            Arquivar
                          </button>
                        </>
                      )}
                    </div>

                    <button
                      onClick={() => deleteRequest(request.id)}
                      className="text-xs text-gray-500 hover:text-red-400 transition-colors flex items-center gap-1.5 px-1 py-0.5 mt-1 self-start"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Excluir</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-24 right-6 p-4 rounded-full bg-neon-purple text-white shadow-[0_0_20px_rgba(123,46,255,0.5)] z-50 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform cursor-pointer border border-white/20"
            title="Ir para o topo"
          >
            <ChevronUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}