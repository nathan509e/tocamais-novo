import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, X, Star, CheckCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import AppLayout from '../../components/shared/AppLayout';
import { useAuth } from '../../lib/AuthContext';
import { useTheme } from '../../lib/ThemeContext';
import { supabase } from '../../lib/supabaseClient';
import ArtistCard from '../../components/shared/ArtistCard';
import ArtistProfileModal from '../../components/shared/ArtistProfileModal';
import NeonButton from '../../components/ui/NeonButton';

const genres = ['Todos', 'Sertanejo', 'Pop', 'Rock', 'Forró', 'Samba', 'Jazz', 'Eletrônico', 'MPB'];

export default function VenueArtists() {
  const { user, userProfile } = useAuth();
  const { theme } = useTheme();
  const location = useLocation();
  const isDark = theme === 'dark';

  const [allArtists, setAllArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('Todos');
  const [showFilters, setShowFilters] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [maxFee, setMaxFee] = useState(10000);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [selectedArtistProfile, setSelectedArtistProfile] = useState(null);
  const [hireForm, setHireForm] = useState({ date: '', time: '20:00', fee: 0, message: '', address: '', precisa_equipamento: false, quantidade_pessoas: 100 });
  const [hireSuccess, setHireSuccess] = useState(false);
  const [hiring, setHiring] = useState(false);
  const [hireError, setHireError] = useState('');

  useEffect(() => {
    if (location.state?.hireArtist) {
      setSelectedArtist(location.state.hireArtist);
      setHireForm(f => ({ ...f, fee: location.state.hireArtist.base_fee || 0 }));
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    async function loadArtists() {
      try {
        const { data } = await supabase.from('artists').select('*, users(role)');
        if (data) {
          const filtered = data.filter(a => a.users?.role !== 'admin');
          const sorted = [...filtered].sort((a, b) => (b.is_pro ? 1 : 0) - (a.is_pro ? 1 : 0));
          setAllArtists(sorted);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadArtists();
  }, []);

  const filtered = allArtists.filter(a => {
    const matchSearch = a.artistic_name.toLowerCase().includes(search.toLowerCase()) || a.genre.toLowerCase().includes(search.toLowerCase());
    const matchGenre = selectedGenre === 'Todos' || a.genre === selectedGenre;
    const matchRating = a.rating >= minRating;
    const matchFee = a.base_fee <= maxFee;
    return matchSearch && matchGenre && matchRating && matchFee;
  });

  const handleHireSubmit = async () => {
    if (!selectedArtist || !user) return;
    setHiring(true);
    setHireError('');
    try {
      const msg = hireForm.message.trim() || `Olá! Proposta para show no dia ${hireForm.date}. Cachê: R$ ${hireForm.fee}.`;

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
      if (!venueId) { setHireError('Erro: perfil da casa de show não encontrado.'); setHiring(false); return; }

      const { error: err1 } = await supabase.from('events').insert({
        title: `Show: ${selectedArtist.artistic_name}`,
        description: hireForm.message || `Evento no dia ${hireForm.date}`,
        date: hireForm.date,
        time: hireForm.time || '20:00',
        duration: 120,
        status: 'pending',
        fee_proposed: hireForm.fee,
        address: hireForm.address || 'A definir',
        precisa_equipamento: hireForm.precisa_equipamento,
        quantidade_pessoas: hireForm.quantidade_pessoas,
        artist_id: selectedArtist.id,
        venue_id: venueId
      });
      if (err1) throw new Error('Erro ao criar evento: ' + err1.message);

      const senderName = user?.user_metadata?.name || user?.email || 'Casa de Show';

      const { error: err2 } = await supabase.from('notifications').insert({
        user_id: selectedArtist.user_id,
        title: 'Nova Proposta de Show',
        content: `${senderName} enviou uma proposta para ${hireForm.date}.`,
        type: 'proposal'
      });
      if (err2) throw new Error('Erro ao criar notificação: ' + err2.message);

      const { error: err3 } = await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: selectedArtist.user_id,
        text: msg
      });
      if (err3) throw new Error('Erro ao criar mensagem: ' + err3.message);

      setHireSuccess(true);
    } catch (e) {
      console.error('Erro ao contratar:', e);
      setHireError(e.message);
    } finally {
      setHiring(false);
    }
  };

  const openHireModal = (artist) => {
    setSelectedArtist(artist);
    setHireForm({ date: '', time: '20:00', fee: artist.base_fee || 0, message: '', address: userProfile?.address || '', precisa_equipamento: false, quantidade_pessoas: 100 });
    setHireSuccess(false);
    setHireError('');
  };

  return (
    <AppLayout role="venue" userName={user?.name || ''}>
      <div className="px-4 py-5 space-y-4">
        <div>
          <h1 className="text-white font-bold text-xl">Encontrar Artistas</h1>
          <p className="text-gray-400 text-sm">Descubra talentos para sua casa</p>
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus-within:border-neon-purple/50 transition-colors">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Buscar artistas, gêneros..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-gray-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-3 rounded-xl border transition-all ${showFilters ? 'bg-neon-purple/20 border-neon-purple/40 text-neon-purple' : 'bg-white/5 border-white/10 text-gray-400'}`}
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Genre Pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          {genres.map(g => (
            <button
              key={g}
              onClick={() => setSelectedGenre(g)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${selectedGenre === g ? 'bg-neon-purple text-white shadow-[0_0_15px_rgba(123,46,255,0.5)]' : 'bg-white/5 text-gray-400 border border-white/10 hover:border-neon-purple/30'}`}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Advanced Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white/5 border border-white/8 rounded-2xl p-4 space-y-4 overflow-hidden"
            >
              <div>
                <label className="text-gray-400 text-xs mb-2 block">Avaliação mínima: {minRating}⭐</label>
                <input type="range" min={0} max={5} step={0.5} value={minRating} onChange={e => setMinRating(+e.target.value)}
                  className="w-full accent-neon-purple" />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-2 block">Cachê máximo: R$ {maxFee.toLocaleString()}</label>
                <input type="range" min={0} max={10000} step={500} value={maxFee} onChange={e => setMaxFee(+e.target.value)}
                  className="w-full accent-neon-purple" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results count */}
        <p className="text-gray-400 text-xs">
          {loading ? 'Carregando...' : `${filtered.length} artistas encontrados`}
        </p>

        {/* Artist Grid */}
        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            <p className="text-gray-500 text-sm text-center py-10">Carregando artistas...</p>
          ) : filtered.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-10">Nenhum artista encontrado com esses filtros.</p>
          ) : filtered.map((artist, i) => (
            <motion.div
              key={artist.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <ArtistCard artist={artist} onHire={() => openHireModal(artist)} onView={() => setSelectedArtistProfile(artist)} />
            </motion.div>
          ))}
        </div>

        {/* Profile Modal */}
        <ArtistProfileModal 
          artist={selectedArtistProfile} 
          onClose={() => setSelectedArtistProfile(null)} 
          onHire={(artist) => {
            setSelectedArtistProfile(null);
            setSelectedArtist(artist);
          }} 
        />

        {/* Hire Modal */}
        {createPortal(
        <AnimatePresence>
          {selectedArtist && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999]" onClick={() => setSelectedArtist(null)} />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, x: '-50%', y: '-50%' }}
                animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
                exit={{ opacity: 0, scale: 0.9, x: '-50%', y: '-50%' }}
                style={{ left: '50%', top: '50%' }}
                transition={{ type: 'spring', damping: 25 }}
                className={`fixed z-[9999] rounded-3xl border p-6 w-[calc(100%-2rem)] max-w-md max-h-[85vh] overflow-y-auto shadow-2xl transition-all ${
                  isDark ? 'bg-app-dark border-white/10' : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>Contratar {selectedArtist.artistic_name}</h2>
                  <button onClick={() => setSelectedArtist(null)} className={`p-2 rounded-xl transition-all ${isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className={`flex items-center gap-4 mb-6 p-4 rounded-2xl border ${isDark ? 'bg-white/5 border-white/8' : 'bg-gray-50 border-gray-100'}`}>
                  <img src={selectedArtist.photo_url} alt={selectedArtist.artistic_name} className="w-16 h-16 rounded-xl object-cover" />
                  <div>
                    <div className="flex items-center gap-1">
                      <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedArtist.artistic_name}</p>
                      {selectedArtist.verified && <CheckCircle className="w-4 h-4 text-neon-purple" />}
                    </div>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{selectedArtist.genre} • {selectedArtist.city}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                      <span className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{selectedArtist.rating}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-gray-600 font-bold'}`}>Data do evento</label>
                      <input type="date" value={hireForm.date} onChange={e => setHireForm(f => ({ ...f, date: e.target.value }))} className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors ${isDark ? 'bg-white/5 border-white/10 text-white focus:border-neon-purple/50' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-neon-purple/50'}`} />
                    </div>
                    <div>
                      <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-gray-600 font-bold'}`}>Horário</label>
                      <input type="time" value={hireForm.time} onChange={e => setHireForm(f => ({ ...f, time: e.target.value }))} className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors ${isDark ? 'bg-white/5 border-white/10 text-white focus:border-neon-purple/50' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-neon-purple/50'}`} />
                    </div>
                  </div>
                  <div>
                    <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-gray-600 font-bold'}`}>Cachê proposto</label>
                    <div className="relative">
                      <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>R$</span>
                      <input
                        type="number"
                        value={hireForm.fee}
                        onChange={e => setHireForm(f => ({ ...f, fee: parseInt(e.target.value) || 0 }))}
                        className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none transition-colors ${isDark ? 'bg-white/5 border-white/10 text-white focus:border-neon-purple/50' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-neon-purple/50'}`}
                      />
                    </div>
                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Cachê base: R$ {selectedArtist.base_fee?.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-gray-600 font-bold'}`}>Local do Evento</label>
                    <input type="text" value={hireForm.address} onChange={e => setHireForm(f => ({ ...f, address: e.target.value }))} placeholder="Ex: Rua das Flores, 123" className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors ${isDark ? 'bg-white/5 border-white/10 text-white focus:border-neon-purple/50' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-neon-purple/50'}`} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-gray-600 font-bold'}`}>Público Médio</label>
                      <input type="number" value={hireForm.quantidade_pessoas} onChange={e => setHireForm(f => ({ ...f, quantidade_pessoas: parseInt(e.target.value) || 0 }))} placeholder="Nº de pessoas" className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors ${isDark ? 'bg-white/5 border-white/10 text-white focus:border-neon-purple/50' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-neon-purple/50'}`} />
                    </div>
                    <div className="flex items-end pb-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={hireForm.precisa_equipamento} onChange={e => setHireForm(f => ({ ...f, precisa_equipamento: e.target.checked }))} className="w-4 h-4 rounded bg-white/5 border-white/10 text-neon-purple focus:ring-0 cursor-pointer" />
                        <span className="text-xs text-gray-300 font-semibold">Precisa levar equipamento?</span>
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-gray-600 font-bold'}`}>Mensagem</label>
                    <textarea placeholder="Descreva o evento e suas expectativas..." rows={3} value={hireForm.message} onChange={e => setHireForm(f => ({ ...f, message: e.target.value }))}
                      className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors resize-none ${isDark ? 'bg-white/5 border-white/10 text-white focus:border-neon-purple/50 placeholder:text-gray-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-neon-purple/50 placeholder:text-gray-400'}`} />
                  </div>
                  {hireSuccess ? (
                    <div className="text-center py-4 space-y-2">
                      <CheckCircle className="w-10 h-10 text-neon-green mx-auto" />
                      <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Proposta Enviada!</p>
                      <p className="text-xs text-gray-400">O artista responderá em breve.</p>
                      <button onClick={() => setSelectedArtist(null)} className="text-xs text-neon-purple font-bold">Fechar</button>
                    </div>
                  ) : (
                    <>
                      {hireError && (
                        <p className="text-red-400 text-xs text-center">{hireError}</p>
                      )}
                      <NeonButton variant="gradient" size="lg" className="w-full" disabled={hiring} onClick={handleHireSubmit}>
                        {hiring ? 'Enviando...' : 'Enviar Proposta'}
                      </NeonButton>
                    </>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
        , document.body)}
      </div>
    </AppLayout>
  );
}
