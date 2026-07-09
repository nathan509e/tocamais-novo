import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Heart, Star, CheckCircle, Sparkles,
  X, Trash2, ListMusic,
  FileText, Gift, Building2, Flame, PartyPopper,
  CalendarCheck, Calendar, MapPin, DollarSign, Users
} from 'lucide-react';
import AppLayout from '../../components/shared/AppLayout';
import { useAuth } from '../../lib/AuthContext';
import { useTheme } from '../../lib/ThemeContext';
import { supabase } from '../../lib/supabaseClient';
import { useLocation } from 'react-router-dom';

const eventTypes = [
  { id: 'wedding', icon: Heart, label: 'Casamento', desc: 'Eventos luxuosos e românticos' },
  { id: 'birthday', icon: Gift, label: 'Aniversário', desc: 'Festas de aniversário e comemorações' },
  { id: 'corporate', icon: Building2, label: 'Corporativo', desc: 'Jantares e convenções empresariais' },
  { id: 'bbq', icon: Flame, label: 'Churrasco', desc: 'Eventos informais e churrascos' },
  { id: 'private', icon: PartyPopper, label: 'Festa Privada', desc: 'Residências e salões de festas' },
  { id: 'luxury', icon: Sparkles, label: 'Evento Luxo', desc: 'Premium, debutantes, comemorações exclusivas' },
];

const budgetTiers = {
  wedding: [
    { label: 'Compacto', range: 'R$ 1.500 - R$ 3.000', style: 'border-neon-purple/20' },
    { label: 'Ideal', range: 'R$ 3.000 - R$ 6.000', style: 'border-neon-green/20' },
    { label: 'Exclusivo', range: 'R$ 6.000+', style: 'border-yellow-500/20' }
  ],
  birthday: [
    { label: 'Econômico', range: 'R$ 800 - R$ 1.500', style: 'border-neon-purple/20' },
    { label: 'Padrão', range: 'R$ 1.500 - R$ 3.000', style: 'border-neon-green/20' },
    { label: 'Banda Completa', range: 'R$ 3.000+', style: 'border-yellow-500/20' }
  ],
  corporate: [
    { label: 'Acústico', range: 'R$ 1.200 - R$ 2.500', style: 'border-neon-purple/20' },
    { label: 'Recepção', range: 'R$ 2.500 - R$ 5.000', style: 'border-neon-green/20' },
    { label: 'Gala / Show', range: 'R$ 5.000+', style: 'border-yellow-500/20' }
  ],
  bbq: [
    { label: 'Solo Voz & Violão', range: 'R$ 500 - R$ 1.000', style: 'border-neon-purple/20' },
    { label: 'Dupla', range: 'R$ 1.000 - R$ 2.000', style: 'border-neon-green/20' },
    { label: 'Grupo de Samba', range: 'R$ 2.000+', style: 'border-yellow-500/20' }
  ],
  private: [
    { label: 'Pocket Show', range: 'R$ 800 - R$ 1.800', style: 'border-neon-purple/20' },
    { label: 'Banda Premium', range: 'R$ 1.800 - R$ 4.000', style: 'border-neon-green/20' },
    { label: 'Super Atrações', range: 'R$ 4.000+', style: 'border-yellow-500/20' }
  ],
  luxury: [
    { label: 'Estilo Class', range: 'R$ 3.000 - R$ 6.000', style: 'border-neon-purple/20' },
    { label: 'Big Band', range: 'R$ 6.000 - R$ 12.000', style: 'border-neon-green/20' },
    { label: 'Orquestra / Celebridades', range: 'R$ 12.000+', style: 'border-yellow-500/20' }
  ]
};

export default function ContractorDashboard() {
  const { user, userProfile } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const location = useLocation();
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('wedding');
  
  // Favorites list state
  const [favorites, setFavorites] = useState([]);
  
  // Playlist Mock State
  const [playlist, setPlaylist] = useState([
    { id: 1, title: 'Evidências (Sertanejo)', artist: 'Sugerido para Casamento' },
    { id: 2, title: 'Boate Azul (Sertanejo)', artist: 'Sugerido para Recepção' }
  ]);
  const [newSongTitle, setNewSongTitle] = useState('');

  // Booking Form Modal State
  const [bookingArtist, setBookingArtist] = useState(null);
  const [eventDate, setEventDate] = useState('2026-06-12');
  const [eventTime, setEventTime] = useState('20:00');
  const [eventAddress, setEventAddress] = useState('');
  const [proposalFee, setProposalFee] = useState(0);
  const [eventDetails, setEventDetails] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [precisaEquipamento, setPrecisaEquipamento] = useState(false);
  const [quantidadePessoas, setQuantidadePessoas] = useState(50);

  // Proposals panel state
  const [contractorProposals, setContractorProposals] = useState([]);
  const [contractorProposalsLoading, setContractorProposalsLoading] = useState(true);
  const [proposalArtistMap, setProposalArtistMap] = useState({});

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
    
    // Load favorites from mock db / localStorage
    const savedFavs = localStorage.getItem('tocamais_favorites');
    if (savedFavs) {
      setFavorites(JSON.parse(savedFavs));
    }
  }, []);

  const handleToggleFavorite = (artistId) => {
    let updated;
    if (favorites.includes(artistId)) {
      updated = favorites.filter(id => id !== artistId);
    } else {
      updated = [...favorites, artistId];
    }
    setFavorites(updated);
    localStorage.setItem('tocamais_favorites', JSON.stringify(updated));
  };

  const handleAddSong = (e) => {
    e.preventDefault();
    if (!newSongTitle.trim()) return;
    setPlaylist(prev => [...prev, { id: Date.now(), title: newSongTitle, artist: 'Minha Preferência' }]);
    setNewSongTitle('');
  };

  const handleRemoveSong = (id) => {
    setPlaylist(prev => prev.filter(s => s !== s.id));
    setPlaylist(prev => prev.filter(song => song.id !== id));
  };

  // Filtered Artists based on search query
  const filteredArtists = artists.filter(a => {
    const query = search.toLowerCase();
    return a.artistic_name.toLowerCase().includes(query) || a.genre.toLowerCase().includes(query) || a.city.toLowerCase().includes(query);
  });

  const pendingProposals = contractorProposals.filter(p => p.status !== 'confirmed');
  const confirmedShows = contractorProposals.filter(p => p.status === 'confirmed');

  useEffect(() => {
    if (location.state?.hireArtist && artists.length > 0) {
      const artist = location.state.hireArtist;
      handleOpenBooking(artist);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, artists]);

  const handleOpenBooking = (artist) => {
    setBookingArtist(artist);
    setEventDate('2026-06-12');
    setEventTime('20:00');
    setProposalFee(artist.base_fee);
    setPrecisaEquipamento(false);
    setQuantidadePessoas(50);
    setBookingSuccess(false);
  };

  const handleConfirmBooking = async () => {
    const newEvent = {
      title: `Show Particular: ${bookingArtist.artistic_name}`,
      description: eventDetails || `Evento particular categoria ${selectedEvent}`,
      date: eventDate,
      time: eventTime || '20:00',
      duration: 120,
      status: 'pending',
      fee_proposed: proposalFee,
      address: eventAddress || 'Salão de Festas, São Paulo',
      precisa_equipamento: precisaEquipamento,
      quantidade_pessoas: quantidadePessoas,
      artist_id: bookingArtist.id,
      contractor_id: userProfile?.id
    };

    try {
      const { error: err1 } = await supabase.from('events').insert(newEvent);
      if (err1) throw new Error('Erro ao criar evento: ' + err1.message);

      const senderName = user?.user_metadata?.name || user?.email || 'Contratante';
      const msg = eventDetails.trim() || `Olá! Tenho interesse em contratar seu show para o dia ${eventDate}. Cachê proposto: R$ ${proposalFee}.`;

      const { error: err2 } = await supabase.from('notifications').insert({
        user_id: bookingArtist.user_id,
        title: 'Nova Proposta de Show',
        content: `${senderName} enviou uma proposta para ${eventDate}.`,
        type: 'proposal'
      });
      if (err2) throw new Error('Erro ao criar notificação: ' + err2.message);

      const { error: err3 } = await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: bookingArtist.user_id,
        text: msg
      });
      if (err3) throw new Error('Erro ao criar mensagem: ' + err3.message);

      setBookingSuccess(true);
    } catch (e) {
      console.error('Failed to book:', e);
    }
  };

  // Fetch contractor proposals
  const fetchContractorProposals = async () => {
    if (!userProfile?.id) { setContractorProposalsLoading(false); return; }
    try {
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('contractor_id', userProfile.id)
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
        setProposalArtistMap(artists);
        setContractorProposals(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setContractorProposalsLoading(false);
    }
  };

  useEffect(() => {
    fetchContractorProposals();
  }, [userProfile]);

  const handleDeleteContractorProposal = async (proposalId) => {
    try {
      await supabase.from('events').delete().eq('id', proposalId);
      setContractorProposals(prev => prev.filter(p => p.id !== proposalId));
    } catch (err) {
      console.error('Erro ao deletar proposta:', err);
    }
  };

  return (
    <AppLayout role="contractor">
      <div className="space-y-8 pb-10">
        
        {/* HEADER HERO */}
        <div>
          <span className="text-[10px] uppercase font-black text-neon-purple tracking-widest">Painel Particular</span>
          <h1 className="text-3xl font-black text-white mt-1">{user?.user_metadata?.name || user?.name || 'Contratante'}</h1>
          <p className="text-gray-400 text-xs mt-1">Agende atrações exclusivas para comemorações e datas especiais</p>
        </div>

        {/* SEARCH BLOCK */}
        <div className="relative">
          <input 
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome do artista, estilo musical ou cidade..."
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-neon-purple/50 transition-all placeholder:text-gray-600"
          />
          <Search className="w-4.5 h-4.5 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
        </div>

        {/* EVENT TYPES SELECTION */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-3">Qual é o Tipo de Evento?</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {eventTypes.map(item => {
              const active = selectedEvent === item.id;
              const IconComp = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedEvent(item.id)}
                  className={`p-4 rounded-2xl border transition-all text-center flex flex-col items-center justify-center ${
                    active 
                      ? 'bg-neon-purple/20 border-neon-purple/60 text-white shadow-[0_0_15px_rgba(123,46,255,0.25)]' 
                      : 'bg-white/5 border-white/5 text-gray-400 hover:border-white/20'
                  }`}
                >
                  <IconComp className="w-6 h-6 mb-1.5 text-neon-purple" />
                  <span className="text-xs font-bold">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* PROPOSTAS ENVIADAS */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-neon-purple" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">Propostas Enviadas</h3>
              {!contractorProposalsLoading && (
                <span className="text-[10px] text-gray-500 font-semibold">({pendingProposals.length})</span>
              )}
            </div>
          </div>

          {contractorProposalsLoading ? (
            <div className="h-24 flex items-center justify-center bg-white/5 rounded-2xl border border-white/5">
              <div className="w-5 h-5 border-2 border-neon-purple border-t-transparent rounded-full animate-spin" />
            </div>
          ) : pendingProposals.length === 0 ? (
            <div className="p-6 text-center bg-white/5 rounded-2xl border border-white/5 mb-8">
              <p className="text-gray-500 text-xs">Nenhuma proposta pendente no momento.</p>
            </div>
          ) : (
            <div className="grid gap-3 mb-8">
              {pendingProposals.map(p => {
                const artist = proposalArtistMap[p.artist_id];
                const statusConfig = {
                  pending: { label: 'Pendente', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
                  pending_artist_approval: { label: 'Aguardando Artista', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
                  proposed: { label: 'Proposto', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
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
                        onClick={() => handleDeleteContractorProposal(p.id)}
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

        {/* SHOWS AGENDADOS */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-neon-green" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">Shows Agendados</h3>
              {!contractorProposalsLoading && confirmedShows.length > 0 && (
                <span className="text-[10px] text-gray-500 font-semibold">({confirmedShows.length})</span>
              )}
            </div>
          </div>

          {contractorProposalsLoading ? (
            <div className="h-40 flex items-center justify-center bg-white/5 rounded-2xl border border-white/5">
              <div className="w-5 h-5 border-2 border-neon-purple border-t-transparent rounded-full animate-spin" />
            </div>
          ) : confirmedShows.length === 0 ? (
            <div className="p-8 text-center bg-white/5 rounded-2xl border border-white/5 mb-8">
              <CalendarCheck className="w-10 h-10 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400 text-sm font-semibold">Nenhum show agendado ainda</p>
              <p className="text-gray-500 text-xs mt-1">As propostas aceitas pelos artistas aparecerão aqui.</p>
            </div>
          ) : (
            <div className="grid gap-4 mb-8">
              {confirmedShows.map(s => {
                const artist = proposalArtistMap[s.artist_id];
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
                          <DollarSign className="w-3.5 h-3.5 text-neon-green" /> R$ {Number(s.fee_proposed).toLocaleString('pt-BR')}
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

        {/* CONTENT SPLIT: LISTINGS & EVENT PLAYLISTS */}
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Main search and hire list */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">Artistas Recomendados</h3>
            
            <div className="grid gap-3">
              {filteredArtists.length > 0 ? (
                filteredArtists.map(a => {
                  const isFav = favorites.includes(a.id);
                  return (
                    <div 
                      key={a.id} 
                      className="p-4 bg-white/5 border border-white/5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative"
                    >
                      <div className="flex items-center gap-4">
                        <img src={a.photo_url} alt="Artist" className="w-14 h-14 rounded-xl object-cover" />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-sm text-white">{a.artistic_name}</h4>
                            {a.verified && <CheckCircle className="w-3.5 h-3.5 text-neon-purple" />}
                          </div>
                          <p className="text-xs text-gray-400">{a.genre} • {a.city}</p>
                          <div className="flex items-center gap-1 mt-1 text-yellow-400">
                            <Star className="w-3 h-3 fill-yellow-400" />
                            <span className="text-xs text-gray-300 font-bold">{a.rating}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-white/5">
                        <button 
                          onClick={() => handleToggleFavorite(a.id)}
                          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                        >
                          <Heart className={`w-4 h-4 ${isFav ? 'text-red-400 fill-red-400' : 'text-gray-400'}`} />
                        </button>
                        <button 
                          onClick={() => handleOpenBooking(a)}
                          className="px-4 py-2 rounded-xl bg-neon-purple text-white text-xs font-bold hover:shadow-[0_0_15px_rgba(123,46,255,0.3)] transition-all"
                        >
                          Solicitar Orçamento
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-gray-400 text-sm">Nenhum artista cadastrado.</p>
                </div>
              )}
            </div>
          </div>

          {/* Playlist & Favorites column */}
          <div className="space-y-6">
            
            {/* Playlists */}
            <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <ListMusic className="w-4 h-4 text-neon-purple" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">Playlist do Evento</h3>
              </div>
              <p className="text-[10px] text-gray-400">Monte o repertório que deseja ouvir no dia da sua festa.</p>

              <form onSubmit={handleAddSong} className="flex gap-2">
                <input 
                  type="text" 
                  value={newSongTitle}
                  onChange={e => setNewSongTitle(e.target.value)}
                  placeholder="Nome da música..."
                  className="flex-1 p-2 bg-[#0F0926] border border-white/10 rounded-xl text-xs"
                />
                <button type="submit" className="p-2 rounded-xl bg-neon-purple text-white text-xs font-bold">
                  Add
                </button>
              </form>

              <div className="space-y-2">
                {playlist.map(song => (
                  <div key={song.id} className="flex justify-between items-center p-2.5 bg-black/20 rounded-xl border border-white/5">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{song.title}</p>
                      <span className="text-[9px] text-gray-500">{song.artist}</span>
                    </div>
                    <button onClick={() => handleRemoveSong(song.id)} className="text-red-400 hover:text-red-300">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Favorite Artists */}
            <div className="p-5 rounded-2xl bg-white/5 border border-white/5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Meus Favoritos</h3>
              
              <div className="space-y-2">
                {favorites.length > 0 ? (
                  artists.filter(art => favorites.includes(art.id)).map(fav => (
                    <div key={fav.id} className="flex items-center justify-between p-2 bg-black/10 rounded-xl">
                      <div className="flex items-center gap-2">
                        <img src={fav.photo_url} alt="Fav" className="w-8 h-8 rounded-lg object-cover" />
                        <span className="text-xs font-bold text-white truncate">{fav.artistic_name}</span>
                      </div>
                      <button 
                        onClick={() => handleOpenBooking(fav)}
                        className="px-2 py-1 bg-neon-purple text-white text-[10px] font-bold rounded"
                      >
                        Contratar
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] text-gray-500">Nenhum artista favoritado.</p>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* BOOKING FLOW MODAL */}
        <AnimatePresence>
          {bookingArtist && (
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-y-auto"
              onClick={() => setBookingArtist(null)}
            >
              <div className="min-h-full flex items-center justify-center p-4">
                <motion.div
                  key="card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  onClick={e => e.stopPropagation()}
                  className="w-full sm:max-w-md bg-[#0F0926] rounded-2xl border border-white/10 p-6 shadow-2xl"
                >
                {!bookingSuccess ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                      <h3 className="font-bold text-white text-base">Solicitar Proposta</h3>
                      <button onClick={() => setBookingArtist(null)} className="p-1 rounded bg-white/5">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
 
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                      <img src={bookingArtist.photo_url} alt="Booking" className="w-12 h-12 rounded-lg object-cover" />
                      <div>
                        <h4 className="text-sm font-bold text-white">{bookingArtist.artistic_name}</h4>
                        <p className="text-xs text-neon-green font-bold">R$ {bookingArtist.base_fee?.toLocaleString()}</p>
                      </div>
                    </div>
 
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-400 font-bold block mb-1">Data Desejada</label>
                        <input 
                          type="date" 
                          value={eventDate}
                          onChange={e => setEventDate(e.target.value)}
                          className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs" 
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 font-bold block mb-1">Horário</label>
                        <input 
                          type="time" 
                          value={eventTime}
                          onChange={e => setEventTime(e.target.value)}
                          className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs" 
                        />
                      </div>
                    </div>
  
                    <div>
                      <label className="text-xs text-gray-400 font-bold block mb-1">Local do Evento</label>
                      <input 
                        type="text" 
                        value={eventAddress}
                        onChange={e => setEventAddress(e.target.value)}
                        placeholder="Ex: Salão de Festas, Rua XYZ"
                        className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs" 
                      />
                    </div>
 
                    <div>
                      <label className="text-xs text-gray-400 font-bold block mb-1">Cachê Oferecido (R$)</label>
                      <input 
                        type="number" 
                        value={proposalFee}
                        onChange={e => setProposalFee(parseInt(e.target.value))}
                        className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-neon-green font-bold" 
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
                      <label className="text-xs text-gray-400 font-bold block mb-1">Detalhes Adicionais</label>
                      <textarea 
                        value={eventDetails}
                        onChange={e => setEventDetails(e.target.value)}
                        placeholder="Gostaria de solicitar músicas especiais ou tem alguma dúvida?"
                        rows={2}
                        className="w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs resize-none" 
                      />
                    </div>
 
                    <button 
                      onClick={handleConfirmBooking}
                      className="w-full py-3 bg-neon-purple text-white font-bold text-xs rounded-xl hover:shadow-[0_0_15px_rgba(123,46,255,0.4)] transition-all"
                    >
                      Enviar Proposta de Show
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-6 space-y-4">
                    <div className="w-12 h-12 rounded-full bg-neon-green/20 flex items-center justify-center mx-auto text-neon-green">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-white text-base">Proposta Enviada!</h3>
                    <p className="text-xs text-gray-400 max-w-xs mx-auto">
                      Sua solicitação de show foi enviada para {bookingArtist.artistic_name}. O músico responderá por meio do chat interno em instantes.
                    </p>
                    <button 
                      onClick={() => setBookingArtist(null)}
                      className="px-6 py-2 bg-neon-purple text-white font-bold text-xs rounded-xl"
                    >
                      Entendido
                    </button>
                  </div>
                )}
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </AppLayout>
  );
}