import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, X, Star, MapPin, Music, CheckCircle } from 'lucide-react';
import AppLayout from '../../components/shared/AppLayout';
import ArtistCard from '../../components/shared/ArtistCard';
import ArtistProfileModal from '../../components/shared/ArtistProfileModal';
import NeonButton from '../../components/ui/NeonButton';

const allArtists = [
  { id: '1', artistic_name: 'Lucas Volta', genre: 'Sertanejo', city: 'São Paulo', photo_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop', rating: 4.9, total_reviews: 48, followers: 125000, base_fee: 2800, verified: true, featured: true, live_now: false, total_shows: 24 },
  { id: '2', artistic_name: 'Laxy Music', genre: 'Pop', city: 'Rio de Janeiro', photo_url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=400&fit=crop', rating: 4.7, total_reviews: 32, followers: 89000, base_fee: 2200, verified: true, featured: false, live_now: true, total_shows: 18 },
  { id: '3', artistic_name: 'Banda Nova Era', genre: 'Rock', city: 'Belo Horizonte', photo_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop', rating: 4.8, total_reviews: 41, followers: 67000, base_fee: 4500, verified: true, featured: true, live_now: false, total_shows: 31 },
  { id: '4', artistic_name: 'Sofia Neon', genre: 'Pop', city: 'São Paulo', photo_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop', rating: 4.6, total_reviews: 28, followers: 54000, base_fee: 1800, verified: true, featured: false, live_now: false, total_shows: 14 },
  { id: '5', artistic_name: 'Dj Matteus', genre: 'Eletrônico', city: 'São Paulo', photo_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop', rating: 4.8, total_reviews: 36, followers: 112000, base_fee: 3200, verified: true, featured: true, live_now: true, total_shows: 42 },
  { id: '6', artistic_name: 'Trio Samba Amor', genre: 'Samba', city: 'Rio de Janeiro', photo_url: 'https://images.unsplash.com/photo-1504898770365-14faca6a7320?w=400&h=400&fit=crop', rating: 4.9, total_reviews: 55, followers: 78000, base_fee: 2500, verified: true, featured: false, live_now: false, total_shows: 60 },
  { id: '7', artistic_name: 'Ana Forró', genre: 'Forró', city: 'Fortaleza', photo_url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&h=400&fit=crop', rating: 4.5, total_reviews: 21, followers: 32000, base_fee: 1200, verified: false, featured: false, live_now: false, total_shows: 28 },
  { id: '8', artistic_name: 'Marcos Jazz', genre: 'Jazz', city: 'São Paulo', photo_url: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=400&h=400&fit=crop', rating: 4.7, total_reviews: 19, followers: 24000, base_fee: 3800, verified: true, featured: false, live_now: false, total_shows: 16 },
];

const genres = ['Todos', 'Sertanejo', 'Pop', 'Rock', 'Forró', 'Samba', 'Jazz', 'Eletrônico', 'MPB'];

export default function VenueArtists() {
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('Todos');
  const [showFilters, setShowFilters] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [maxFee, setMaxFee] = useState(10000);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [selectedArtistProfile, setSelectedArtistProfile] = useState(null);

  const filtered = allArtists.filter(a => {
    const matchSearch = a.artistic_name.toLowerCase().includes(search.toLowerCase()) || a.genre.toLowerCase().includes(search.toLowerCase());
    const matchGenre = selectedGenre === 'Todos' || a.genre === selectedGenre;
    const matchRating = a.rating >= minRating;
    const matchFee = a.base_fee <= maxFee;
    return matchSearch && matchGenre && matchRating && matchFee;
  });

  return (
    <AppLayout role="venue" userName="João Silva">
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
                <label className="text-gray-400 text-xs mb-2 block">Avaliação mínima: {minRating}⭐</label>
                <input type="range" min={0} max={5} step={0.5} value={minRating} onChange={e => setMinRating(+e.target.value)}
                  className="w-full accent-neon-purple" />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-2 block">Cachê máximo: R$ {maxFee.toLocaleString()}</label>
                <input type="range" min={500} max={10000} step={500} value={maxFee} onChange={e => setMaxFee(+e.target.value)}
                  className="w-full accent-neon-purple" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results count */}
        <p className="text-gray-400 text-xs">{filtered.length} artistas encontrados</p>

        {/* Artist Grid */}
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((artist, i) => (
            <motion.div
              key={artist.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <ArtistCard artist={artist} onHire={() => setSelectedArtist(artist)} onView={() => setSelectedArtistProfile(artist)} />
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
        <AnimatePresence>
          {selectedArtist && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" onClick={() => setSelectedArtist(null)} />
              <motion.div
                initial={{ opacity: 0, y: '100%' }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: '100%' }}
                transition={{ type: 'spring', damping: 25 }}
                className="fixed bottom-0 left-0 right-0 z-50 bg-app-dark rounded-t-3xl border-t border-white/10 p-6 max-h-[85vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-white font-bold text-lg">Contratar {selectedArtist.artistic_name}</h2>
                  <button onClick={() => setSelectedArtist(null)} className="p-2 rounded-xl bg-white/5">
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                <div className="flex items-center gap-4 mb-6 p-4 rounded-2xl bg-white/5 border border-white/8">
                  <img src={selectedArtist.photo_url} alt={selectedArtist.artistic_name} className="w-16 h-16 rounded-xl object-cover" />
                  <div>
                    <div className="flex items-center gap-1">
                      <p className="text-white font-bold">{selectedArtist.artistic_name}</p>
                      {selectedArtist.verified && <CheckCircle className="w-4 h-4 text-neon-purple" />}
                    </div>
                    <p className="text-gray-400 text-sm">{selectedArtist.genre} • {selectedArtist.city}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                      <span className="text-gray-300 text-sm font-semibold">{selectedArtist.rating}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">Data do evento</label>
                    <input type="date" className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-neon-purple/50 transition-colors" />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">Cachê proposto</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
                      <input
                        type="number"
                        defaultValue={selectedArtist.base_fee}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-neon-purple/50 transition-colors"
                      />
                    </div>
                    <p className="text-gray-500 text-xs mt-1">Cachê base: R$ {selectedArtist.base_fee?.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">Mensagem</label>
                    <textarea placeholder="Descreva o evento e suas expectativas..." rows={3}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-neon-purple/50 transition-colors resize-none placeholder:text-gray-500" />
                  </div>
                  <NeonButton variant="gradient" size="lg" className="w-full" onClick={() => setSelectedArtist(null)}>
                    Enviar Proposta
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