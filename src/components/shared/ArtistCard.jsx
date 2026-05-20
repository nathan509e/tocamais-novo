import { motion } from 'framer-motion';
import { Star, CheckCircle, MapPin, Music, Zap } from 'lucide-react';
import NeonButton from '../ui/NeonButton';

export default function ArtistCard({ artist, onHire, onView, compact = false }) {
  const { artistic_name, genre, city, photo_url, rating, followers, base_fee, verified, live_now, featured } = artist;

  if (compact) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/8 hover:border-neon-purple/30 transition-all cursor-pointer"
        onClick={() => onView?.(artist)}
      >
        <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
          <img src={photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${artistic_name}`} alt={artistic_name} className="w-full h-full object-cover" />
          {live_now && (
            <div className="absolute top-0.5 left-0.5 bg-red-500 text-white text-[7px] font-bold px-1 rounded">AO VIVO</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <p className="text-white font-semibold text-sm truncate">{artistic_name}</p>
            {verified && <CheckCircle className="w-3.5 h-3.5 text-neon-purple flex-shrink-0" />}
          </div>
          <p className="text-gray-400 text-xs">{genre} • {city}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span className="text-gray-300 text-xs">{rating?.toFixed(1)}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-neon-green font-bold text-sm">R${base_fee?.toLocaleString()}</p>
          <p className="text-gray-500 text-[10px]">cachê</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-white/5 backdrop-blur-xl border border-white/8 rounded-2xl overflow-hidden hover:border-neon-purple/30 hover:shadow-[0_0_25px_rgba(123,46,255,0.2)] transition-all duration-300 cursor-pointer"
    >
      {/* Cover Image */}
      <div className="relative h-40 overflow-hidden">
        <img
          src={photo_url || `https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=200&fit=crop`}
          alt={artistic_name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        {live_now && (
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            AO VIVO
          </div>
        )}
        {featured && (
          <div className="absolute top-3 right-3 bg-neon-purple/90 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
            <Zap className="w-3 h-3" />
            Destaque
          </div>
        )}
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-white font-bold text-base">{artistic_name}</p>
              {verified && <CheckCircle className="w-4 h-4 text-neon-purple" />}
            </div>
            <div className="flex items-center gap-1 text-gray-300 text-xs">
              <Music className="w-3 h-3" />
              {genre}
              <span className="mx-1">•</span>
              <MapPin className="w-3 h-3" />
              {city}
            </div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="text-white font-semibold text-sm">{rating?.toFixed(1)}</span>
            <span className="text-gray-400 text-xs">({artist.total_reviews || 0} avaliações)</span>
          </div>
          <div className="text-right">
            <p className="text-neon-green font-bold text-sm">R$ {base_fee?.toLocaleString()}</p>
            <p className="text-gray-500 text-[10px]">cachê base</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 mb-3">
          <span className="text-gray-400 text-xs">{followers?.toLocaleString()} seguidores</span>
          <span className="text-gray-600">•</span>
          <span className="text-gray-400 text-xs">{artist.total_shows || 0} shows</span>
        </div>

        <div className="flex gap-2">
          <NeonButton variant="purple" size="sm" className="flex-1" onClick={() => onHire?.(artist)}>
            Contratar
          </NeonButton>
          <NeonButton variant="ghost" size="sm" onClick={() => onView?.(artist)}>
            Ver Perfil
          </NeonButton>
        </div>
      </div>
    </motion.div>
  );
}