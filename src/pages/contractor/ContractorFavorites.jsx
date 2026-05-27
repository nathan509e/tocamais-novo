import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Star, CheckCircle } from 'lucide-react';
import AppLayout from '../../components/shared/AppLayout';
import { useAuth } from '../../lib/AuthContext';
import ArtistCard from '../../components/shared/ArtistCard';
import ArtistProfileModal from '../../components/shared/ArtistProfileModal';

export default function ContractorFavorites() {
  const { user } = useAuth();

  const [favorites, setFavorites] = useState([]);
  const [selectedArtistProfile, setSelectedArtistProfile] = useState(null);

  const remove = (id) => setFavorites(prev => prev.filter(f => f.id !== id));

  return (
    <AppLayout role="contractor" userName={user?.name || ''}>
      <div className="px-4 py-5 space-y-4">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-400 fill-red-400" />
          <div>
            <h1 className="text-white font-bold text-xl">Favoritos</h1>
            <p className="text-gray-400 text-sm">{favorites.length} artistas salvos</p>
          </div>
        </div>

        <AnimatePresence>
          {favorites.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
              <Heart className="w-16 h-16 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-400">Nenhum favorito ainda</p>
              <p className="text-gray-600 text-sm mt-1">Explore artistas e salve os que você gosta!</p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {favorites.map((artist, i) => (
                <motion.div key={artist.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ delay: i * 0.07 }} className="relative">
                  <ArtistCard artist={artist} onView={() => setSelectedArtistProfile(artist)} />
                  <button onClick={() => remove(artist.id)}
                    className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 backdrop-blur-sm">
                    <Heart className="w-4 h-4 text-red-400 fill-red-400" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>

        <ArtistProfileModal 
          artist={selectedArtistProfile} 
          onClose={() => setSelectedArtistProfile(null)} 
          onHire={(artist) => {
            setSelectedArtistProfile(null);
            console.log('Hire flow from favorites', artist);
          }} 
        />
      </div>
    </AppLayout>
  );
}