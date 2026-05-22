import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Star, X } from 'lucide-react';
<<<<<<< HEAD
import { useTheme } from '../../lib/ThemeContext';
=======
import { useTheme } from '@/lib/ThemeContext';
>>>>>>> cfaa0e1da1fafe997fd82dd3f64f0f9179b0d047

export default function ArtistProfileModal({ artist, onClose, onHire }) {
  const { theme } = useTheme();

  if (!artist) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
      ></motion.div>

      <motion.div className="fixed inset-0 flex items-center justify-center z-[70]" >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={`w-full max-w-2xl border p-6 shadow-2xl rounded-2xl max-h-[90vh] overflow-y-auto transition-colors duration-300 ${
            theme === 'dark' ? 'bg-[#0F0926] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-800'
          }`}
        >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
          <h3 className="font-black text-lg">Perfil do Artista</h3>
          <button onClick={onClose} className={`p-1.5 rounded-lg transition-colors ${
            theme === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'
          }`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Card Body */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <img 
              src={artist.photo_url} 
              alt={artist.artistic_name} 
              className="w-28 h-28 rounded-2xl object-cover border-2 border-neon-purple shadow-lg"
            />
            <div className="text-center sm:text-left flex-1 space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h4 className="font-black text-2xl">{artist.artistic_name}</h4>
                {artist.verified && <CheckCircle className="w-5 h-5 text-neon-purple" />}
              </div>
              <p className="text-sm text-neon-green font-bold">{artist.genre} • {artist.city}</p>
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-yellow-400 text-sm">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-bold">{artist.rating}</span>
                <span className="text-gray-500 font-semibold">({artist.followers?.toLocaleString()} seguidores)</span>
              </div>
            </div>
            
            <div className="text-center sm:text-right">
              <span className="text-[10px] text-gray-500 uppercase font-bold block">Cachê Base</span>
              <p className="text-xl font-bold text-neon-green">R$ {artist.base_fee?.toLocaleString()}</p>
            </div>
          </div>

          {/* Presentation Video Player */}
          <div className="space-y-2">
            <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500">Vídeo de Apresentação</h5>
            <div className="aspect-video rounded-xl overflow-hidden bg-black/40 border border-white/5 relative">
              {artist.presentation_video_url ? (
                artist.presentation_video_url.includes('youtube.com') || artist.presentation_video_url.includes('youtu.be') ? (
                  <iframe 
                    src={artist.presentation_video_url.replace('watch?v=', 'embed/').split('&')[0]} 
                    className="w-full h-full" 
                    allowFullScreen 
                    title="Vídeo de Apresentação"
                  />
                ) : (
                  <video src={artist.presentation_video_url} controls className="w-full h-full object-cover" />
                )
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                  <p className="text-xs text-gray-500">Este artista ainda não cadastrou um vídeo de apresentação.</p>
                </div>
              )}
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500">Biografia</h5>
            <p className={`text-sm leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              {artist.bio || 'Sem biografia disponível.'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-white/5">
            <button 
              onClick={() => {
                onClose();
                onHire?.(artist);
              }}
              className="flex-1 py-3 rounded-xl bg-neon-purple text-white text-xs font-bold hover:shadow-[0_0_15px_rgba(123,46,255,0.4)] transition-all"
            >
              Iniciar Contratação de Show
            </button>
            <button 
              onClick={onClose}
              className={`px-6 py-3 rounded-xl text-xs font-bold border transition-colors ${
                theme === 'dark' ? 'border-white/10 hover:bg-white/5 text-gray-300' : 'border-gray-200 hover:bg-gray-50 text-gray-700'
              }`}
            >
              Fechar Perfil
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  </AnimatePresence>
);
}
