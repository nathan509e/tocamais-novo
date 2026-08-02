import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Radio, QrCode, Music } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function Live() {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLive = async () => {
      const { data } = await supabase
        .from('artists')
        .select('id, artistic_name, genre, city, photo_url')
        .eq('live_now', true)
        .order('artistic_name');
      setArtists(data || []);
      setLoading(false);
    };

    fetchLive();

    const channel = supabase
      .channel('live-artists')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'artists', filter: 'live_now=eq.true' }, fetchLive)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  return (
    <div className="min-h-screen bg-[#08041A] text-white px-4 py-10 flex flex-col items-center">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold px-4 py-1.5 rounded-full mb-4">
          <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
          AO VIVO AGORA
        </div>
        <h1 className="text-3xl font-black bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          Artistas em Cena
        </h1>
        <p className="text-gray-400 text-sm mt-2">
          Escaneie o QR code de qualquer artista para pedir música ou enviar gorjeta.
        </p>
      </motion.div>

      {/* Content */}
      {loading ? (
        <div className="w-8 h-8 border-4 border-[#7B2EFF]/30 border-t-[#7B2EFF] rounded-full animate-spin mt-20" />
      ) : artists.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4 mt-20 text-center"
        >
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
            <Music className="w-8 h-8 text-gray-600" />
          </div>
          <p className="text-gray-400 text-sm">Nenhum artista ao vivo no momento.</p>
          <p className="text-gray-600 text-xs">Quando um artista ativar o modo "Ao Vivo", aparece aqui em tempo real.</p>
        </motion.div>
      ) : (
        <div className="w-full max-w-md space-y-4">
          {artists.map((artist, i) => (
            <motion.div
              key={artist.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              onClick={() => navigate(`/artist/tip/${artist.id}`)}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-neon-purple/30 hover:bg-white/8 transition-all cursor-pointer group"
            >
              <div className="relative">
                <img
                  src={artist.photo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${artist.artistic_name}`}
                  alt={artist.artistic_name}
                  onError={e => { e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${artist.artistic_name}`; }}
                  className="w-14 h-14 rounded-xl object-cover"
                />
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-[#08041A] animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white truncate">{artist.artistic_name}</p>
                <p className="text-xs text-gray-400 truncate">{[artist.genre, artist.city].filter(Boolean).join(' · ')}</p>
              </div>
              <QrCode className="w-5 h-5 text-neon-purple opacity-50 group-hover:opacity-100 transition-all flex-shrink-0" />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
