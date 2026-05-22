import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Star, CheckCircle } from 'lucide-react';
import AppLayout from '../../components/shared/AppLayout';
import ArtistCard from '../../components/shared/ArtistCard';
import ArtistProfileModal from '../../components/shared/ArtistProfileModal';

const favs = [
  { id: '1', artistic_name: 'Lucas Volta', genre: 'Sertanejo', city: 'São Paulo', photo_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop', rating: 4.9, total_reviews: 48, followers: 125000, base_fee: 2800, verified: true, featured: true, live_now: false, total_shows: 24 },
  { id: '3', artistic_name: 'Quarteto Jazz', genre: 'Jazz', city: 'São Paulo', photo_url: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=400&h=400&fit=crop', rating: 4.7, total_reviews: 29, followers: 28000, base_fee: 4200, verified: true, featured: true, live_now: false, total_shows: 31 },
];

export default function ContractorFavorites() {
  const [favorites, setFavorites] = useState(favs);
  const [selectedArtistProfile, setSelectedArtistProfile] = useState(null);

  const remove = (id) => setFavorites(prev => prev.filter(f => f.id !== id));

  return (
    <AppLayout role="contractor" userName="Maria Santos">
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