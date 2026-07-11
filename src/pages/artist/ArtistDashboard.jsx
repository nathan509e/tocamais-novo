import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, DollarSign, Calendar, Star, Users, Music,
  CheckCircle, Play, Pause,
  Volume2, UploadCloud, ToggleLeft, ToggleRight, Check, X, Search,
  Bot, FileText, Plus, Trash2
} from 'lucide-react';
import AppLayout from '../../components/shared/AppLayout';
import StatCard from '../../components/ui/StatCard';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/AuthContext';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line
} from 'recharts';

const earningsData = [];

const growthData = [];

export default function ArtistDashboard() {
  const { user, userProfile, isLoadingAuth, refreshProfile } = useAuth();

  const [shows, setShows] = useState([]);

  // Audio Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState('');
  
  // Media Upload State
  const [mediaList, setMediaList] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Repertório state
  const [musicasRepertorio, setMusicasRepertorio] = useState([]);
  const [selectedMusicasIds, setSelectedMusicasIds] = useState([]);
  const [searchRepertorio, setSearchRepertorio] = useState('');
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [filterMinhas, setFilterMinhas] = useState(true);
  const [showCreateSetlistForm, setShowCreateSetlistForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');

  // Availability calendar state
  const [busyDates, setBusyDates] = useState([]);
  const [newBusyDate, setNewBusyDate] = useState('');
  const [availabilityAuto, setAvailabilityAuto] = useState(true);

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
        await supabase.from('artists').update({ setlists: updatedSetlists }).eq('user_id', user.id);
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

  const handleCreateSetlist = async () => {
    if (!newSetlistName.trim() || !user?.id) return;
    const newSetlist = {
      id: 'set-' + Date.now(),
      name: newSetlistName.trim(),
      musicas_ids: [],
      active: false
    };
    const updatedSetlists = [...(userProfile?.setlists || []), newSetlist];
    try {
      await supabase.from('artists').update({ setlists: updatedSetlists }).eq('user_id', user.id);
      setNewSetlistName('');
      if (refreshProfile) refreshProfile();
    } catch (e) {
      console.error(e);
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
    const updatedSetlists = (userProfile?.setlists || []).map(s => {
      if (s.id === setlistId) {
        return { ...s, active: !s.active };
      }
      return { ...s, active: false };
    });
    try {
      await supabase.from('artists').update({ setlists: updatedSetlists }).eq('user_id', user.id);
      if (refreshProfile) refreshProfile();
    } catch (e) {
      console.error(e);
    }
  };

  const handleImportPlaylistFromText = async (text) => {
    setIsProcessingFile(true);
    try {
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

      const updatedIds = Array.from(new Set([...selectedMusicasIds, ...newSongIds]));
      setSelectedMusicasIds(updatedIds);
      
      await supabase.from('artists').update({ selected_musicas_ids: updatedIds }).eq('user_id', user.id);
      if (refreshProfile) refreshProfile();

      const { data: musicas } = await supabase
        .from('musicas_repertorio')
        .select('*')
        .order('artista_nome', { ascending: true });
      if (musicas) setMusicasRepertorio(musicas);

      alert(`Sucesso! Adicionei ${newSongIds.length} músicas ao seu repertório.`);
    } catch (err) {
      console.error('Erro na importação:', err);
      alert('Erro: ' + err.message);
    } finally {
      setIsProcessingFile(false);
    }
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
    <AppLayout role="artist">
      <div className="space-y-8 pb-10">
        
        {/* TOP ROW: PROFILE HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img 
                src={userProfile?.photo_url || user?.avatar_url || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop'} 
                alt="Avatar" 
                className="w-16 h-16 rounded-2xl object-cover border-2 border-neon-purple/50"
              />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-neon-green rounded-full border-2 border-[#08041A] flex items-center justify-center">
                <span className="text-[8px] font-black text-black">LIVE</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-2xl font-black text-white">{userProfile?.artistic_name || user?.name || 'Artista'}</h1>
                <CheckCircle className="w-5 h-5 text-neon-purple" />
              </div>
              <p className="text-xs text-gray-400">{userProfile?.genre ? `${userProfile.genre} • ` : ''}{userProfile?.city || 'Local não definido'}</p>
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
              <span className="text-[10px] uppercase font-black text-neon-green tracking-widest">Cachê Base</span>
              <h2 className="text-4xl font-black text-white mt-1">{userProfile?.base_fee ? `R$ ${userProfile.base_fee.toLocaleString()}` : 'R$ 0'}</h2>
              <div className="flex items-center gap-1 text-neon-green text-xs font-bold mt-1">
                <TrendingUp className="w-4 h-4" />
                <span>{shows.length} shows agendados</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { title: 'Shows Feitos', val: `${shows.length} Gigs`, icon: Music, iconColor: 'text-neon-purple' },
                { title: 'Cachê Médio', val: `R$ ${(userProfile?.base_fee || 0).toLocaleString()}`, icon: DollarSign, iconColor: 'text-neon-green' },
                { title: 'Pendentes', val: '0', icon: Star, iconColor: 'text-yellow-400' }
              ].map((item, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-white/5 border border-white/5">
                  <item.icon className={`w-5 h-5 mx-auto mb-1 ${item.iconColor}`} />
                  <p className="text-xs text-gray-400 uppercase tracking-wider">{item.title}</p>
                  <p className="text-sm font-bold text-white mt-0.5">{item.val}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Seguidores" value={userProfile?.followers ? `${(userProfile.followers / 1000).toFixed(0)}K` : '0'} icon={Users} iconColor="purple" />
          <StatCard title="Avaliação Fãs" value={userProfile?.rating ? `${userProfile.rating} / 5` : '--'} icon={Star} iconColor="green" />
          <StatCard title="Cachê Base" value={userProfile?.base_fee ? `R$ ${userProfile.base_fee.toLocaleString()}` : '--'} icon={DollarSign} iconColor="purple" />
          <StatCard title="Próximo Show" value={shows.length > 0 ? shows[0].date : 'Nenhum'} icon={Calendar} iconColor="green" />
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



        {/* REPERTÓRIO SECTION */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4">Meu Repertório</h3>
          <p className="text-[10px] text-gray-400 mb-4">Selecione as músicas que você canta. Elas aparecerão no seu perfil público.</p>

          {/* Setlists Section */}
          <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">Minhas Setlists</h4>
                <p className="text-[10px] text-gray-500">Crie setlists nomeadas e ative uma delas para o show.</p>
              </div>
              <div className="flex items-center gap-2">
                {showCreateSetlistForm ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nome da setlist..."
                      value={newSetlistName}
                      onChange={e => setNewSetlistName(e.target.value)}
                      className="bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:border-neon-purple/50"
                      autoFocus
                    />
                    <button
                      onClick={() => {
                        handleCreateSetlist();
                        setShowCreateSetlistForm(false);
                      }}
                      className="px-3 py-1.5 bg-neon-purple hover:bg-neon-purple/80 text-white rounded-lg text-xs font-bold"
                    >
                      Criar
                    </button>
                    <button
                      onClick={() => setShowCreateSetlistForm(false)}
                      className="px-2 py-1.5 bg-white/5 hover:bg-white/10 text-gray-400 rounded-lg text-xs font-bold"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => setShowImportModal(true)}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-neon-purple border border-neon-purple/30 rounded-lg text-xs font-bold flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Importar (.txt)
                    </button>
                    <button
                      onClick={() => setShowCreateSetlistForm(true)}
                      className="p-1.5 bg-neon-purple hover:bg-neon-purple/80 text-white rounded-lg text-xs font-bold flex items-center justify-center"
                      title="Criar Nova Setlist"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {(userProfile?.setlists || []).length === 0 ? (
                <p className="text-[10px] text-gray-500 italic text-center py-2">Você ainda não criou nenhuma setlist.</p>
              ) : (
                (userProfile.setlists).map(setlist => {
                  const isEditingThis = editingSetlist?.id === setlist.id;
                  return (
                    <div key={setlist.id} className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/5">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${setlist.active ? 'text-neon-green' : 'text-white'}`}>
                          {setlist.name}
                        </span>
                        <span className="text-[9px] text-gray-500">
                          ({setlist.musicas_ids?.length || 0} músicas)
                        </span>
                        {setlist.active && (
                          <span className="text-[8px] bg-neon-green/20 text-neon-green border border-neon-green/30 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                            Ativa no Show
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleSetlistActive(setlist.id)}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all border ${
                            setlist.active
                              ? 'bg-neon-green/20 border-neon-green/50 text-neon-green'
                              : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30'
                          }`}
                        >
                          {setlist.active ? 'Desativar' : 'Ativar'}
                        </button>
                        <button
                          onClick={() => {
                            if (isEditingThis) {
                              setEditingSetlist(null);
                            } else {
                              setEditingSetlist({ ...setlist });
                            }
                          }}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all border ${
                            isEditingThis
                              ? 'bg-neon-purple/20 border-neon-purple/50 text-neon-purple'
                              : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30'
                          }`}
                        >
                          {isEditingThis ? 'Cancelar' : 'Editar Músicas'}
                        </button>
                        <button
                          onClick={() => handleDeleteSetlist(setlist.id)}
                          className="p-1 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {editingSetlist && (
            <div className="mb-4 p-3 rounded-xl bg-neon-purple/10 border border-neon-purple/30 flex items-center justify-between">
              <p className="text-xs text-neon-purple font-bold">
                Modo Edição: Selecione as músicas da setlist "{editingSetlist.name}" abaixo
              </p>
              <button
                onClick={() => setEditingSetlist(null)}
                className="text-[10px] text-gray-400 hover:text-white uppercase tracking-wider font-bold"
              >
                Voltar ao Geral
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchRepertorio}
                onChange={e => setSearchRepertorio(e.target.value)}
                placeholder="Pesquisar música ou artista..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#0F0926] border border-white/10 rounded-xl text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-neon-purple/50 transition-all"
              />
              {searchRepertorio && (
                <button onClick={() => setSearchRepertorio('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => setFilterMinhas(!filterMinhas)}
              className={`flex items-center gap-1.5 py-2.5 px-4 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all flex-shrink-0 ${
                filterMinhas
                  ? 'bg-neon-purple/20 border-neon-purple/50 text-neon-purple'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              {editingSetlist ? 'Músicas na Setlist' : 'Minhas Músicas'}
              {(editingSetlist ? editingSetlist.musicas_ids.length : selectedMusicasIds.length) > 0 && (
                <span className="ml-1 text-[10px]">({editingSetlist ? editingSetlist.musicas_ids.length : selectedMusicasIds.length})</span>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {musicasRepertorio
              .filter(musica =>
                (!searchRepertorio || 
                musica.titulo.toLowerCase().includes(searchRepertorio.toLowerCase()) ||
                musica.artista_nome.toLowerCase().includes(searchRepertorio.toLowerCase())) &&
                (!filterMinhas || (editingSetlist ? editingSetlist.musicas_ids.includes(musica.id) : selectedMusicasIds.includes(musica.id)))
              )
              .map(musica => {
              const selected = editingSetlist
                ? editingSetlist.musicas_ids.includes(musica.id)
                : selectedMusicasIds.includes(musica.id);
              return (
                <button
                  key={musica.id}
                  onClick={() => toggleMusica(musica.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    selected
                      ? 'bg-neon-green/10 border-neon-green/40 text-white'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    selected ? 'bg-neon-green border-neon-green' : 'border-white/20'
                  }`}>
                    {selected && <Check className="w-3.5 h-3.5 text-black" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">{musica.titulo}</p>
                    <p className="text-[10px] text-gray-500">{musica.artista_nome} • {Math.floor(musica.duracao_seg / 60)}m{musica.duracao_seg % 60}s</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">
                {editingSetlist
                  ? `${editingSetlist.musicas_ids.length} de ${musicasRepertorio.length} músicas na setlist`
                  : `${selectedMusicasIds.length} de ${musicasRepertorio.length} músicas selecionadas`
                }
              </span>
              {saved && (
                <span className="flex items-center gap-1 text-[10px] text-neon-green font-bold">
                  <Check className="w-3 h-3" />
                  Salvo com sucesso!
                </span>
              )}
            </div>
            <button
              onClick={salvarRepertorio}
              disabled={saving}
              className="py-2.5 px-6 rounded-xl bg-neon-green text-black text-xs font-black uppercase tracking-wider hover:shadow-[0_0_20px_rgba(57,255,106,0.3)] transition-all disabled:opacity-50"
            >
              {saving
                ? 'Salvando...'
                : editingSetlist
                  ? `Salvar Setlist "${editingSetlist.name}"`
                  : 'Salvar Repertório Geral'
              }
            </button>
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
                className="flex-1 p-2 bg-[#0F0926] border border-white/10 rounded-xl text-xs" 
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

      {/* Import Playlist Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative rounded-2xl p-6 max-w-md w-full bg-[#0f0a26] border border-white/10 shadow-2xl space-y-4">
            <button
              onClick={() => {
                setShowImportModal(false);
                setImportText('');
              }}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/10"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>

            <div>
              <h3 className="text-base font-bold text-white">Importar Playlist (Texto)</h3>
              <p className="text-[10px] text-gray-400 mt-1">
                Cole o texto da sua playlist abaixo (uma música por linha, ex: <strong>Título - Artista</strong>) para importá-las diretamente.
              </p>
            </div>

            <textarea
              rows={8}
              placeholder="Exemplo:&#10;Ainda Ontem Chorei de Saudade - João Mineiro & Marciano&#10;Boate Azul - Bruno & Marrone"
              value={importText}
              onChange={e => setImportText(e.target.value)}
              className="w-full p-3 rounded-xl border text-xs outline-none resize-none font-mono bg-black/30 border-white/10 text-white placeholder:text-gray-600 focus:border-neon-purple/50"
            />

            <div className="flex gap-2">
              <button
                onClick={async () => {
                  if (!importText.trim()) return;
                  await handleImportPlaylistFromText(importText);
                  setShowImportModal(false);
                  setImportText('');
                }}
                disabled={isProcessingFile}
                className="flex-1 py-2 px-4 bg-neon-purple hover:bg-neon-purple/80 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                {isProcessingFile ? 'Processando...' : 'Importar Músicas'}
              </button>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportText('');
                }}
                className="py-2 px-4 rounded-xl text-xs font-bold bg-white/5 text-gray-300 hover:bg-white/10"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}