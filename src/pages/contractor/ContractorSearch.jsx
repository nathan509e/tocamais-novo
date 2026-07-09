import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../components/shared/AppLayout';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import ArtistCard from '../../components/shared/ArtistCard';
import ArtistProfileModal from '../../components/shared/ArtistProfileModal';

const genres = ['Todos', 'Sertanejo', 'MPB', 'Jazz', 'Pop', 'Samba', 'Rock', 'Forró'];

export default function ContractorSearch() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [allArtists, setAllArtists] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('Todos');
  const [maxFee, setMaxFee] = useState(10000);
  const [selectedArtistProfile, setSelectedArtistProfile] = useState(null);

  useEffect(() => {
    async function loadArtists() {
      try {
        const { data } = await supabase.from('artists').select('*');
        if (data) {
          const sorted = [...data].sort((a, b) => (b.is_pro ? 1 : 0) - (a.is_pro ? 1 : 0));
          setAllArtists(sorted);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadArtists();
  }, []);

  const filtered = allArtists.filter(a => {
    const matchSearch = !search || a.artistic_name.toLowerCase().includes(search.toLowerCase()) || a.genre.toLowerCase().includes(search.toLowerCase()) || a.city.toLowerCase().includes(search.toLowerCase());
    const matchGenre = selectedGenre === 'Todos' || a.genre === selectedGenre;
    const matchFee = a.base_fee <= maxFee;
    return matchSearch && matchGenre && matchFee;
  });

  return (
    <AppLayout role="contractor" userName={user?.name || ''}>
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
          <input type="range" min={0} max={10000} step={500} value={maxFee} onChange={e => setMaxFee(+e.target.value)}
            className="w-full accent-neon-purple" />
          <div className="flex justify-between text-gray-600 text-[10px] mt-1">
            <span>R$ 0</span><span>R$ 10.000</span>
          </div>
        </div>

        <p className="text-gray-400 text-xs">{filtered.length} artistas encontrados</p>

        <div className="grid grid-cols-1 gap-4 pb-4">
          {filtered.map((artist, i) => (
            <motion.div key={artist.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <ArtistCard artist={artist} onView={() => setSelectedArtistProfile(artist)} onHire={() => navigate('/contractor', { state: { hireArtist: artist } })} />
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