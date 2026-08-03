import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../components/shared/AppLayout';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import ArtistCard from '../../components/shared/ArtistCard';
import ArtistProfileModal from '../../components/shared/ArtistProfileModal';

const genres = ['Todos', 'Sertanejo', 'MPB', 'Jazz', 'Pop', 'Samba', 'Rock', 'Forró'];
const SORT_OPTIONS = [
  { value: 'score', label: 'Relevância' },
  { value: 'rating', label: 'Avaliação' },
  { value: 'fee_asc', label: 'Menor cachê' },
  { value: 'fee_desc', label: 'Maior cachê' },
];

export default function ContractorSearch() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [allArtists, setAllArtists] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('Todos');
  const [maxFee, setMaxFee] = useState(10000);
  const [sortBy, setSortBy] = useState('score');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedArtistProfile, setSelectedArtistProfile] = useState(null);

  useEffect(() => {
    async function loadArtists() {
      try {
        const { data } = await supabase
          .from('artist_rankings')
          .select('*, users(role)')
          .order('score', { ascending: false });
        if (data) {
          setAllArtists(data.filter(a => a.users?.role !== 'admin'));
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadArtists();
  }, []);

  const filtered = allArtists
    .filter(a => {
      const q = search.toLowerCase();
      const matchSearch = !search
        || a.artistic_name?.toLowerCase().includes(q)
        || a.genre?.toLowerCase().includes(q)
        || a.city?.toLowerCase().includes(q);
      const matchGenre = selectedGenre === 'Todos' || a.genre === selectedGenre;
      const matchFee = (a.base_fee ?? 0) <= maxFee;
      return matchSearch && matchGenre && matchFee;
    })
    .sort((a, b) => {
      if (sortBy === 'score')    return (b.score ?? 0) - (a.score ?? 0);
      if (sortBy === 'rating')   return (b.avg_rating_real ?? 0) - (a.avg_rating_real ?? 0);
      if (sortBy === 'fee_asc')  return (a.base_fee ?? 0) - (b.base_fee ?? 0);
      if (sortBy === 'fee_desc') return (b.base_fee ?? 0) - (a.base_fee ?? 0);
      return 0;
    });

  return (
    <AppLayout role="contractor" userName={user?.name || ''}>
      <div className="px-4 py-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-white font-bold text-xl">Buscar Artistas</h1>
            <p className="text-gray-400 text-sm">Encontre o talento ideal para seu evento</p>
          </div>
          <button
            onClick={() => setShowFilters(f => !f)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${showFilters ? 'bg-neon-purple/20 border-neon-purple/50 text-neon-purple' : 'bg-white/5 border-white/10 text-gray-400'}`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filtros
          </button>
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

        {showFilters && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className="bg-white/5 border border-white/8 rounded-2xl p-4">
              <label className="text-gray-400 text-xs mb-2 block">
                Cachê máximo: R$ {maxFee.toLocaleString()}
              </label>
              <input type="range" min={0} max={10000} step={500} value={maxFee} onChange={e => setMaxFee(+e.target.value)}
                className="w-full accent-neon-purple" />
              <div className="flex justify-between text-gray-600 text-[10px] mt-1">
                <span>R$ 0</span><span>R$ 10.000</span>
              </div>
            </div>

            <div className="bg-white/5 border border-white/8 rounded-2xl p-4">
              <p className="text-gray-400 text-xs mb-2">Ordenar por</p>
              <div className="grid grid-cols-2 gap-2">
                {SORT_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => setSortBy(opt.value)}
                    className={`py-2 rounded-xl text-xs font-semibold transition-all ${sortBy === opt.value ? 'bg-neon-purple text-white' : 'bg-white/5 text-gray-400 border border-white/10'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <p className="text-gray-400 text-xs">{filtered.length} artistas encontrados</p>

        <div className="grid grid-cols-1 gap-4 pb-4">
          {filtered.map((artist, i) => (
            <motion.div key={artist.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <ArtistCard
                artist={artist}
                rank={sortBy === 'score' ? i : undefined}
                onView={() => setSelectedArtistProfile(artist)}
                onHire={() => navigate('/contractor', { state: { hireArtist: artist } })}
              />
            </motion.div>
          ))}
        </div>

        <ArtistProfileModal
          artist={selectedArtistProfile}
          onClose={() => setSelectedArtistProfile(null)}
          onHire={(artist) => {
            setSelectedArtistProfile(null);
            navigate('/contractor', { state: { hireArtist: artist } });
          }}
        />
      </div>
    </AppLayout>
  );
}
