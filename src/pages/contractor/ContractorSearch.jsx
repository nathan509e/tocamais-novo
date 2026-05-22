import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal, MapPin } from 'lucide-react';
import AppLayout from '../../components/shared/AppLayout';
import ArtistCard from '../../components/shared/ArtistCard';
import ArtistProfileModal from '../../components/shared/ArtistProfileModal';

const allArtists = [
  { id: '1', artistic_name: 'Lucas Volta', genre: 'Sertanejo', city: 'São Paulo', photo_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop', rating: 4.9, total_reviews: 48, followers: 125000, base_fee: 2800, verified: true, featured: true, live_now: false, total_shows: 24 },
  { id: '2', artistic_name: 'Duo Harmonia', genre: 'MPB', city: 'São Paulo', photo_url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=400&fit=crop', rating: 4.8, total_reviews: 36, followers: 45000, base_fee: 1800, verified: true, featured: false, live_now: false, total_shows: 55 },
  { id: '3', artistic_name: 'Quarteto Jazz', genre: 'Jazz', city: 'São Paulo', photo_url: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=400&h=400&fit=crop', rating: 4.7, total_reviews: 29, followers: 28000, base_fee: 4200, verified: true, featured: true, live_now: false, total_shows: 31 },
  { id: '4', artistic_name: 'Sofia Neon', genre: 'Pop', city: 'São Paulo', photo_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop', rating: 4.6, total_reviews: 28, followers: 54000, base_fee: 1800, verified: true, featured: false, live_now: false, total_shows: 14 },
  { id: '5', artistic_name: 'Banda Alegria', genre: 'Sertanejo', city: 'Campinas', photo_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop', rating: 4.8, total_reviews: 41, followers: 67000, base_fee: 4500, verified: true, featured: true, live_now: false, total_shows: 31 },
  { id: '6', artistic_name: 'Trio Samba Amor', genre: 'Samba', city: 'Rio de Janeiro', photo_url: 'https://images.unsplash.com/photo-1504898770365-14faca6a7320?w=400&h=400&fit=crop', rating: 4.9, total_reviews: 55, followers: 78000, base_fee: 2500, verified: true, featured: false, live_now: false, total_shows: 60 },
];

const genres = ['Todos', 'Sertanejo', 'MPB', 'Jazz', 'Pop', 'Samba', 'Rock', 'Forró'];

export default function ContractorSearch() {
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('Todos');
  const [maxFee, setMaxFee] = useState(10000);
  const [selectedArtistProfile, setSelectedArtistProfile] = useState(null);

  const filtered = allArtists.filter(a => {
    const matchSearch = a.artistic_name.toLowerCase().includes(search.toLowerCase()) || a.genre.toLowerCase().includes(search.toLowerCase()) || a.city.toLowerCase().includes(search.toLowerCase());
    const matchGenre = selectedGenre === 'Todos' || a.genre === selectedGenre;
    const matchFee = a.base_fee <= maxFee;
    return matchSearch && matchGenre && matchFee;
  });

  return (
    <AppLayout role="contractor" userName="Maria Santos">
      <div className="px-4 py-5 space-y-4">
        <div>
          <h1 className="text-white font-bold text-xl">Buscar Artistas</h1>
          <p className="text-gray-400 text-sm">Encontre o talento ideal para seu evento</p>
        </div>

        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 focus-within:border-neon-purple/50 transition-colors">
          <Search className="w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Nome, gênero, cidade..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-gray-500" />
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
          {genres.map(g => (
            <button key={g} onClick={() => setSelectedGenre(g)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${selectedGenre === g ? 'bg-neon-purple text-white shadow-[0_0_15px_rgba(123,46,255,0.5)]' : 'bg-white/5 text-gray-400 border border-white/10 hover:border-neon-purple/30'}`}>
              {g}
            </button>
          ))}
        </div>

        <div className="bg-white/5 border border-white/8 rounded-2xl p-4">
          <label className="text-gray-400 text-xs mb-2 block">
            Cachê máximo: R$ {maxFee.toLocaleString()}
          </label>
          <input type="range" min={500} max={10000} step={500} value={maxFee} onChange={e => setMaxFee(+e.target.value)}
            className="w-full accent-neon-purple" />
          <div className="flex justify-between text-gray-600 text-[10px] mt-1">
            <span>R$ 500</span><span>R$ 10.000</span>
          </div>
        </div>

        <p className="text-gray-400 text-xs">{filtered.length} artistas encontrados</p>

        <div className="grid grid-cols-1 gap-4 pb-4">
          {filtered.map((artist, i) => (
            <motion.div key={artist.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <ArtistCard artist={artist} onView={() => setSelectedArtistProfile(artist)} onHire={() => console.log('Hire', artist)} />
            </motion.div>
          ))}
        </div>
        
        <ArtistProfileModal 
          artist={selectedArtistProfile} 
          onClose={() => setSelectedArtistProfile(null)} 
          onHire={(artist) => {
            setSelectedArtistProfile(null);
            console.log('Hire flow from search', artist);
          }} 
        />
      </div>
    </AppLayout>
  );
}