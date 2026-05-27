import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Heart, Star, MapPin, Music, CheckCircle, Calendar, Sparkles,
  X, SlidersHorizontal, Plus, Trash2, ListMusic, Volume2, ShieldAlert
} from 'lucide-react';
import AppLayout from '../../components/shared/AppLayout';
import NeonButton from '../../components/ui/NeonButton';
import { useAuth } from '../../lib/AuthContext';
import { useTheme } from '../../lib/ThemeContext';
import { supabase } from '../../lib/supabaseClient';

const eventTypes = [
  { id: 'wedding', icon: '💍', label: 'Casamento', desc: 'Eventos luxuosos e românticos' },
  { id: 'birthday', icon: '🎂', label: 'Aniversário', desc: 'Festas de aniversário e comemorações' },
  { id: 'corporate', icon: '🏢', label: 'Corporativo', desc: 'Jantares e convenções empresariais' },
  { id: 'bbq', icon: '🥩', label: 'Churrasco', desc: 'Eventos informais e churrascos' },
  { id: 'private', icon: '🎉', label: 'Festa Privada', desc: 'Residências e salões de festas' },
  { id: 'luxury', icon: '✨', label: 'Evento Luxo', desc: 'Premium, debutantes, comemorações exclusivas' },
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
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
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
  const [eventAddress, setEventAddress] = useState('');
  const [proposalFee, setProposalFee] = useState(0);
  const [eventDetails, setEventDetails] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

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

  const handleOpenBooking = (artist) => {
    setBookingArtist(artist);
    setProposalFee(artist.base_fee);
    setBookingSuccess(false);
  };

  const handleConfirmBooking = async () => {
    const newEvent = {
      title: `Show Particular: ${bookingArtist.artistic_name}`,
      description: eventDetails || `Evento particular categoria ${selectedEvent}`,
      date: eventDate,
      time: '20:00',
      duration: 120,
      status: 'pending',
      fee_proposed: proposalFee,
      address: eventAddress || 'Salão de Festas, São Paulo',
      artist_id: bookingArtist.id
    };

    try {
      await supabase.from('events').insert(newEvent);

      const senderName = user?.user_metadata?.name || user?.email || 'Contratante';
      const msg = eventDetails.trim() || `Olá! Tenho interesse em contratar seu show para o dia ${eventDate}. Cachê proposto: R$ ${proposalFee}.`;

      await supabase.from('notifications').insert({
        user_id: bookingArtist.user_id,
        title: 'Nova Proposta de Show',
        content: `${senderName} enviou uma proposta para ${eventDate}.`,
        type: 'proposal'
      });

      await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: bookingArtist.user_id,
        text: msg
      });

      setBookingSuccess(true);
    } catch (e) {
      console.error('Failed to book', e);
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
                  <span className="text-3xl mb-1.5">{item.icon}</span>
                  <span className="text-xs font-bold">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* AUTOMATED BUDGET ESTIMATOR */}
        <AnimatePresence mode="wait">
          {selectedEvent && (
            <motion.div
              key={selectedEvent}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-5 rounded-2xl border transition-all ${
                isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-neon-green" />
                <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-gray-800'}`}>Calculadora Automática de Orçamento ({selectedEvent})</h4>
              </div>
              <p className="text-[10px] text-gray-400 mb-4">Estimativa recomendada de cachê baseada em contratações passadas.</p>

              <div className="grid sm:grid-cols-3 gap-3">
                {budgetTiers[selectedEvent]?.map((tier, idx) => (
                  <div key={idx} className={`p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'} border ${tier.style} text-center`}>
                    <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{tier.label}</p>
                    <p className="text-sm font-black text-neon-green mt-1">{tier.range}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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