import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Heart, Star, MapPin, Music, CheckCircle, Calendar, Sparkles, X, SlidersHorizontal } from 'lucide-react';
import AppLayout from '../../components/shared/AppLayout';
import NeonButton from '../../components/ui/NeonButton';
import ArtistCard from '../../components/shared/ArtistCard';

const eventTypes = [
  { id: 'wedding', icon: '💍', label: 'Casamento' },
  { id: 'birthday', icon: '🎂', label: 'Aniversário' },
  { id: 'corporate', icon: '🏢', label: 'Corporativo' },
  { id: 'bbq', icon: '🥩', label: 'Churrasco' },
  { id: 'private', icon: '🎉', label: 'Festa Privada' },
  { id: 'luxury', icon: '✨', label: 'Evento Luxo' },
];

const featuredArtists = [
  { id: '1', artistic_name: 'Lucas Volta', genre: 'Sertanejo', city: 'São Paulo', photo_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop', rating: 4.9, total_reviews: 48, followers: 125000, base_fee: 2800, verified: true, featured: true, live_now: false, total_shows: 24 },
  { id: '2', artistic_name: 'Duo Harmonia', genre: 'MPB', city: 'São Paulo', photo_url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=400&fit=crop', rating: 4.8, total_reviews: 36, followers: 45000, base_fee: 1800, verified: true, featured: false, live_now: false, total_shows: 55 },
  { id: '3', artistic_name: 'Quarteto Jazz', genre: 'Jazz', city: 'São Paulo', photo_url: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=400&h=400&fit=crop', rating: 4.7, total_reviews: 29, followers: 28000, base_fee: 4200, verified: true, featured: true, live_now: false, total_shows: 31 },
  { id: '4', artistic_name: 'Sofia Neon', genre: 'Pop', city: 'São Paulo', photo_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop', rating: 4.6, total_reviews: 28, followers: 54000, base_fee: 1800, verified: true, featured: false, live_now: false, total_shows: 14 },
];

const recentlyHired = [
  { id: '1', artistic_name: 'Banda Alegria', genre: 'Sertanejo', date: '15 Abr 2026', event: 'Aniversário 50 anos', fee: 3500, rating: 5.0, photo_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=crop' },
  { id: '2', artistic_name: 'Duo Choro', genre: 'MPB', date: '02 Mar 2026', event: 'Casamento', fee: 2200, rating: 4.8, photo_url: 'https://images.unsplash.com/photo-1504898770365-14faca6a7320?w=200&h=200&fit=crop' },
];

const genres = ['Todos', 'Sertanejo', 'Pop', 'MPB', 'Jazz', 'Rock', 'Forró', 'Samba'];

export default function ContractorDashboard() {
  const [search, setSearch] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [favorites, setFavorites] = useState(['1', '3']);
  const [selectedGenre, setSelectedGenre] = useState('Todos');
  const [bookingArtist, setBookingArtist] = useState(null);

  const toggleFavorite = (id) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const filtered = featuredArtists.filter(a => {
    const matchSearch = a.artistic_name.toLowerCase().includes(search.toLowerCase()) || a.genre.toLowerCase().includes(search.toLowerCase());
    const matchGenre = selectedGenre === 'Todos' || a.genre === selectedGenre;
    return matchSearch && matchGenre;
  });

  return (
    <AppLayout role="contractor" userName="Maria Santos">
      <div className="px-4 py-5 space-y-6">

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-gray-400 text-sm">Olá, 👋</p>
          <h1 className="text-white font-bold text-2xl">Maria Santos</h1>
          <p className="text-gray-400 text-sm mt-0.5">Encontre o artista perfeito para seu evento</p>
        </motion.div>

        {/* Search */}
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 focus-within:border-neon-purple/50 transition-colors">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar artistas, estilos musicais..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-gray-500"
          />
        </div>

        {/* Event Types */}
        <div>
          <h3 className="text-white font-semibold text-sm mb-3">Qual é o seu evento?</h3>
          <div className="grid grid-cols-3 gap-2">
            {eventTypes.map((type) => (
              <motion.button
                key={type.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedEvent(selectedEvent === type.id ? null : type.id)}
                className={`p-3 rounded-xl border transition-all text-center ${selectedEvent === type.id ? 'bg-neon-purple/20 border-neon-purple/50 text-neon-purple shadow-[0_0_15px_rgba(123,46,255,0.3)]' : 'bg-white/5 border-white/8 text-gray-300 hover:border-white/20'}`}
              >
                <div className="text-2xl mb-1">{type.icon}</div>
                <p className="text-xs font-medium">{type.label}</p>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Budget Estimator (shows when event type selected) */}
        <AnimatePresence>
          {selectedEvent && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gradient-to-r from-neon-purple/15 to-neon-green/10 border border-neon-purple/20 rounded-2xl p-4 overflow-hidden"
            >
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-neon-purple" />
                <span className="text-white font-semibold text-sm">Orçamento Estimado</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Econômico', range: 'R$ 800 - 1.500', color: 'text-neon-green' },
                  { label: 'Padrão', range: 'R$ 1.500 - 3.500', color: 'text-yellow-400' },
                  { label: 'Premium', range: 'R$ 3.500+', color: 'text-neon-purple' },
                ].map((tier, i) => (
                  <div key={i} className="bg-black/30 rounded-xl p-3 text-center cursor-pointer hover:bg-black/50 transition-colors">
                    <p className={`font-bold text-xs ${tier.color}`}>{tier.label}</p>
                    <p className="text-gray-400 text-[10px] mt-1">{tier.range}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Genre Filter */}
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          {genres.map(g => (
            <button key={g} onClick={() => setSelectedGenre(g)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${selectedGenre === g ? 'bg-neon-purple text-white shadow-[0_0_15px_rgba(123,46,255,0.5)]' : 'bg-white/5 text-gray-400 border border-white/10 hover:border-neon-purple/30'}`}>
              {g}
            </button>
          ))}
        </div>

        {/* Featured Artists */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold text-sm">Artistas Recomendados</h3>
            <span className="text-gray-500 text-xs">{filtered.length} disponíveis</span>
          </div>
          <div className="space-y-4">
            {filtered.map((artist, i) => (
              <motion.div key={artist.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="relative">
                <ArtistCard artist={artist} onHire={() => setBookingArtist(artist)} onView={() => setBookingArtist(artist)} />
                <button
                  onClick={() => toggleFavorite(artist.id)}
                  className="absolute top-3 right-14 p-2 rounded-xl bg-black/50 backdrop-blur-sm"
                >
                  <Heart className={`w-4 h-4 ${favorites.includes(artist.id) ? 'text-red-400 fill-red-400' : 'text-gray-400'}`} />
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recently Hired */}
        <div>
          <h3 className="text-white font-semibold text-sm mb-3">Contratações Recentes</h3>
          <div className="space-y-3">
            {recentlyHired.map((h, i) => (
              <motion.div key={h.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/8">
                <img src={h.photo_url} alt={h.artistic_name} className="w-12 h-12 rounded-xl object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm">{h.artistic_name}</p>
                  <p className="text-gray-400 text-xs">{h.event} • {h.date}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    <span className="text-gray-300 text-xs">{h.rating}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-neon-green font-bold text-sm">R$ {h.fee.toLocaleString()}</p>
                  <NeonButton variant="ghost" size="sm">Contratar de novo</NeonButton>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Booking Modal */}
        <AnimatePresence>
          {bookingArtist && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" onClick={() => setBookingArtist(null)} />
              <motion.div
                initial={{ opacity: 0, y: '100%' }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: '100%' }}
                transition={{ type: 'spring', damping: 25 }}
                className="fixed bottom-0 left-0 right-0 z-50 bg-app-dark rounded-t-3xl border-t border-white/10 p-6 max-h-[85vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-white font-bold text-lg">Contratar Artista</h2>
                  <button onClick={() => setBookingArtist(null)} className="p-2 rounded-xl bg-white/5">
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                <div className="flex items-center gap-4 mb-6 p-4 rounded-2xl bg-white/5 border border-white/8">
                  <img src={bookingArtist.photo_url} alt={bookingArtist.artistic_name} className="w-16 h-16 rounded-xl object-cover" />
                  <div>
                    <div className="flex items-center gap-1">
                      <p className="text-white font-bold">{bookingArtist.artistic_name}</p>
                      {bookingArtist.verified && <CheckCircle className="w-4 h-4 text-neon-purple" />}
                    </div>
                    <p className="text-gray-400 text-sm">{bookingArtist.genre} • {bookingArtist.city}</p>
                    <p className="text-neon-green font-bold text-sm mt-1">R$ {bookingArtist.base_fee?.toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">Tipo de Evento</label>
                    <div className="grid grid-cols-3 gap-2">
                      {eventTypes.map(e => (
                        <button key={e.id} className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-neon-purple/30 text-center transition-all">
                          <span className="text-lg">{e.icon}</span>
                          <p className="text-xs text-gray-300 mt-0.5">{e.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">Data do Evento</label>
                    <input type="date" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-neon-purple/50 transition-colors" />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">Local do Evento</label>
                    <input type="text" placeholder="Endereço ou nome do local" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-neon-purple/50 transition-colors placeholder:text-gray-500" />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">Mensagem</label>
                    <textarea placeholder="Conte mais sobre seu evento..." rows={3}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-neon-purple/50 transition-colors resize-none placeholder:text-gray-500" />
                  </div>
                  <NeonButton variant="gradient" size="lg" className="w-full" onClick={() => setBookingArtist(null)}>
                    Enviar Proposta de Contratação
                  </NeonButton>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}