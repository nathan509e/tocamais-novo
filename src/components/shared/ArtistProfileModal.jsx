import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Star, X, Music } from 'lucide-react';
import { useTheme } from '../../lib/ThemeContext';
import { supabase } from '../../lib/supabaseClient';

export default function ArtistProfileModal({ artist, onClose, onHire }) {
  const { theme } = useTheme();
  const [songs, setSongs] = useState([]);

  useEffect(() => {
    if (!artist) return;
    async function loadSongs() {
      const activeSetlist = artist.setlists?.find(s => s.active);
      const musicIds = (activeSetlist && activeSetlist.musicas_ids?.length > 0)
        ? activeSetlist.musicas_ids
        : artist.selected_musicas_ids;

      if (!musicIds?.length) {
        setSongs([]);
        return;
      }

      const { data } = await supabase
        .from('musicas_repertorio')
        .select('*')
        .in('id', musicIds);
      if (data) setSongs(data);
    }
    loadSongs();
  }, [artist]);

  if (!artist) return null;

  return (
    <AnimatePresence>
      <motion.div 
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
      ></motion.div>

      <motion.div key="modal" className="fixed inset-0 z-[100] flex items-start justify-center pt-4 sm:pt-12" >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={`w-full max-w-2xl border p-4 sm:p-6 shadow-2xl rounded-2xl max-h-[90vh] overflow-y-auto transition-colors duration-300 ${
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

        {/* Cover + Profile Card Body */}
        <div className="space-y-6">
          {/* Cover banner — compact aspect ratio (3.5) */}
          <div className="relative -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 overflow-hidden rounded-t-2xl" style={{ aspectRatio: 3.5 }}>
            {artist.cover_url ? (
              <img 
                src={artist.cover_url} 
                alt="" 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-neon-purple/30 via-neon-purple/15 to-neon-green/15" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          </div>

          {/* Profile photo — centered, overlapping cover (same -mt-14 as ArtistProfile) */}
          <div className="flex justify-center -mt-14 relative z-10">
            <div className={`w-20 h-20 rounded-2xl overflow-hidden border-4 shadow-lg transition-colors duration-300 ${
              theme === 'dark' ? 'border-[#0F0926] bg-[#0f0a26]' : 'border-white bg-white'
            }`} style={{ boxShadow: '0 0 25px rgba(123,46,255,0.5)' }}>
              <img 
                src={artist.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${artist.artistic_name}`} 
                alt={artist.artistic_name} 
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-2">
              <h4 className="font-black text-2xl">{artist.artistic_name}</h4>
              {artist.verified && <CheckCircle className="w-5 h-5 text-neon-purple" />}
            </div>
            <p className="text-sm text-neon-green font-bold">{artist.genre} • {artist.city}</p>
            <div className="flex items-center justify-center gap-1.5 text-yellow-400 text-sm">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-bold">{artist.rating}</span>
              <span className="text-gray-500 font-semibold">({artist.followers?.toLocaleString()} seguidores)</span>
            </div>
            <div className="pt-2">
              <span className="text-[10px] text-gray-500 uppercase font-bold block">Cachê Base</span>
              <p className="text-xl font-bold text-neon-green">R$ {artist.base_fee?.toLocaleString()}</p>
            </div>
          </div>

          {/* Presentation Video Player */}
          <div className="space-y-2">
            <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500">Vídeo de Apresentação</h5>
            <div className="rounded-xl overflow-hidden bg-black/40 border border-white/5 relative" style={{ aspectRatio: '9/16', maxWidth: '280px', margin: '0 auto' }}>
              {artist.presentation_video_url ? (
                artist.presentation_video_url.includes('youtube.com') || artist.presentation_video_url.includes('youtu.be') ? (
                  <iframe 
                    src={artist.presentation_video_url.replace('watch?v=', 'embed/').split('&')[0]} 
                    className="w-full h-full" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
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

          {/* Repertório */}
          {songs.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500">Repertório</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {songs.map(song => (
                  <div key={song.id} className={`flex items-center gap-2 p-2.5 rounded-xl border ${
                    theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'
                  }`}>
                    <Music className="w-3.5 h-3.5 text-neon-purple flex-shrink-0" />
                    <div className="min-w-0">
                      <p className={`text-xs font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{song.titulo}</p>
                      <p className="text-[10px] text-gray-500">{song.artista_nome} • {Math.floor(song.duracao_seg / 60)}m{song.duracao_seg % 60}s</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
