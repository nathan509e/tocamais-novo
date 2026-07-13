import { motion } from 'framer-motion';
import { Star, CheckCircle, MapPin, Music, Zap, Crown } from 'lucide-react';
import NeonButton from '../ui/NeonButton';
import { useTheme } from '../../lib/ThemeContext';

export default function ArtistCard({ artist, onHire, onView, compact = false }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { artistic_name, genre, city, photo_url, cover_url, rating, followers, base_fee, verified, live_now, featured, is_pro } = artist;

  if (compact) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        className={`flex items-center gap-3 p-3 rounded-xl border shadow-sm hover:border-neon-purple/30 transition-all cursor-pointer ${
          isDark ? 'bg-[#120D2C] border-white/10 text-white' : 'bg-white border-gray-100 text-gray-800'
        }`}
        onClick={() => onView?.(artist)}
      >
        <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
          <img src={photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${artistic_name}`} alt={artistic_name} className="w-full h-full object-cover" />
          {live_now && (
            <div className="absolute top-0.5 left-0.5 bg-red-500 text-white text-[7px] font-bold px-1 rounded">AO VIVO</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <p className={`font-semibold text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{artistic_name}</p>
            {verified && <CheckCircle className="w-3.5 h-3.5 text-neon-purple flex-shrink-0" />}
            {is_pro && <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />}
          </div>
          <p className="text-gray-500 text-xs">{genre} • {city}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span className="text-gray-500 text-xs">{rating?.toFixed(1)}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[#2ecc71] font-bold text-sm">R${base_fee?.toLocaleString()}</p>
          <p className="text-gray-400 text-[10px]">cachê</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={`border rounded-2xl overflow-hidden shadow-sm hover:border-neon-purple/30 hover:shadow-md transition-all duration-300 cursor-pointer ${
        isDark ? 'bg-[#120D2C] border-white/5 text-white' : 'bg-white border-gray-100 text-gray-800'
      }`}
      onClick={() => onView?.(artist)}
    >
      {/* Cover banner — standard height (h-64) */}
      <div className="relative h-64 overflow-hidden bg-gray-900">
        {cover_url ? (
          <img 
            src={cover_url} 
            alt="" 
            className="w-full h-full object-cover" 
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-neon-purple/30 via-neon-purple/15 to-neon-green/15" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Badges */}
        <div className="absolute top-3 left-3 z-10 flex gap-2">
          {live_now && (
            <div className="flex items-center gap-1 bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              AO VIVO
            </div>
          )}
          {featured && (
            <div className="flex items-center gap-1 bg-neon-purple text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
              <Zap className="w-3 h-3" />
              Destaque
            </div>
          )}
        </div>
      </div>

      {/* Profile photo — centered, overlapping cover (same -mt-14 as ArtistProfile) */}
      <div className="flex justify-center -mt-10 sm:-mt-14 relative z-10">
        <div className={`w-20 h-20 rounded-2xl overflow-hidden border-4 shadow-lg transition-colors duration-350 ${
          isDark ? 'border-[#120D2C] bg-[#120D2C]' : 'border-white bg-white'
        }`} style={{ boxShadow: '0 0 25px rgba(123,46,255,0.5)' }}>
          <img
            src={photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${artistic_name}`}
            alt={artistic_name}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Info */}
      <div className="px-4 pb-4 pt-2 text-center">
        <div className="flex items-center justify-center gap-1.5">
          <p className={`font-bold text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>{artistic_name}</p>
          {verified && <CheckCircle className="w-4 h-4 text-neon-purple" />}
          {is_pro && <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />}
        </div>
        <div className="flex items-center justify-center gap-1 text-gray-500 text-xs mt-0.5">
          <Music className="w-3 h-3" />
          {genre}
          <span className="mx-1">•</span>
          <MapPin className="w-3 h-3" />
          {city}
        </div>

        <div className="flex items-center justify-between mt-3 mb-3">
          <div className="flex items-center gap-1.5">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{rating?.toFixed(1)}</span>
            <span className="text-gray-500 text-xs">({artist.total_reviews || 0})</span>
          </div>
          <div className="text-right">
            <p className="text-[#2ecc71] font-bold text-sm">R$ {base_fee?.toLocaleString()}</p>
            <p className="text-gray-500 text-[10px]">cachê base</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 mb-3">
          <span className="text-gray-500 text-xs">{followers?.toLocaleString()} seguidores</span>
          <span className="text-gray-300">•</span>
          <span className="text-gray-500 text-xs">{artist.total_shows || 0} shows</span>
        </div>

        <div className="flex gap-2">
          <NeonButton variant="purple" size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); onHire?.(artist); }}>
            Contratar
          </NeonButton>
          <NeonButton variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onView?.(artist); }}>
            Ver Perfil
          </NeonButton>
        </div>
      </div>
    </motion.div>
  );
}
