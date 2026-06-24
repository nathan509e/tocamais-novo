import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { motion } from 'framer-motion';
import { Star, Heart, Music, ChevronLeft } from 'lucide-react';

const ArtistMiniProfile = ({ artist }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [artistProfile, setArtistProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showQrCode, setShowQrCode] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      if (user) {
        try {
          const { data } = await supabase.from('artists').select('*').eq('user_id', user.id).single();
          if (data) setArtistProfile(data);
        } catch (e) {
          console.warn('Error loading profile:', e);
        }
      }
      setLoading(false);
    }
    loadProfile();
  }, [user]);

  const defaultArtist = {
    name: "Nome do Artista",
    bannerUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&h=400&fit=crop",
    profileImageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop",
    rating: 4,
    description: "Descrição resumida da carreira do artista preenchida por ele no painel do artista na página de perfil.",
    isFavorited: false,
    genre: "Sertanejo",
    city: "São Paulo"
  };

  const currentArtist = artist || (artistProfile ? {
    name: artistProfile.artistic_name,
    bannerUrl: artistProfile.cover_url || defaultArtist.bannerUrl,
    profileImageUrl: artistProfile.photo_url || defaultArtist.profileImageUrl,
    rating: artistProfile.rating || 0,
    description: artistProfile.bio,
    isFavorited: false,
    genre: artistProfile.genre,
    city: artistProfile.city
  } : defaultArtist);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-pulse text-gray-400">Carregando...</div>
    </div>
  );

  const profileImageSrc = currentArtist.profileImageUrl || defaultArtist.profileImageUrl;
  const bannerSrc = currentArtist.bannerUrl || defaultArtist.bannerUrl;

  const buttonGradient = "bg-gradient-to-r from-[#7B2EFF] to-[#39FF6A]";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-16">
        <div className="overflow-hidden rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
          {/* Banner Image */}
          <div className="relative h-48 md:h-64 w-full bg-gray-100">
            <img src={bannerSrc} alt="Artist Banner" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white"
          >
            <div className="px-6 md:px-12 pb-12">
              {/* Profile Header */}
              <div className="flex flex-col md:flex-row items-center md:items-end -mt-4 md:-mt-8 mb-10 gap-8">
                <div className="relative">
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden border-4 border-white shadow-lg">
                    <img
                      src={profileImageSrc}
                      alt="Artist Profile"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Meu artista</p>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 tracking-tight">{currentArtist.name}</h1>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm text-gray-500">
                    <span className="bg-gray-50 px-3 py-1 rounded-full border border-gray-100 uppercase tracking-wider text-xs font-medium">{currentArtist.genre}</span>
                    <span className="text-gray-300">•</span>
                    <span>{currentArtist.city}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => navigate('/artist/profile')} className="bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-6 rounded-lg border border-gray-200 transition-all duration-300 flex items-center gap-2">
                    <ChevronLeft className="w-4 h-4" />
                    Meu Perfil
                  </button>
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-4 mb-10 border-t border-b border-gray-100 py-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{currentArtist.rating}</div>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3 h-3 ${i < currentArtist.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                    ))}
                  </div>
                </div>
                <div className="text-center border-l border-gray-100">
                  <div className="text-2xl font-bold text-gray-900">0</div>
                  <div className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Shows</div>
                </div>
                <div className="text-center border-l border-gray-100">
                  <div className="text-2xl font-bold text-gray-900">0</div>
                  <div className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Seguidores</div>
                </div>
              </div>

              {/* Make a Request Section */}
              <div className="mb-10">
                <h2 className="text-xl font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Music className="w-5 h-5 text-gray-400" />
                  Faça o seu pedido
                </h2>
                <p className="text-gray-500 leading-relaxed mb-6 max-w-2xl">
                  Abaixo você pode pedir uma música e fazer uma dedicatória para alguém especial, ou até mesmo fazer uma crítica ou elogio ao artista.
                </p>
                <button onClick={() => navigate(`/artist/tip/${user?.id}`)} className={`${buttonGradient} hover:opacity-90 text-white font-medium py-3 px-6 rounded-lg transition-all duration-300 flex items-center gap-2 shadow-lg`}
                  style={{ boxShadow: '0 4px 15px rgba(123, 46, 255, 0.3)' }}>
                  <Music className="w-4 h-4" />
                  Pedir minha música
                </button>
              </div>

              {/* About the Artist Section */}
              <div className="mb-10">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Sobre o artista</h2>
                <p className="text-gray-500 leading-relaxed mb-6 max-w-2xl">
                  {currentArtist.description || "O artista ainda não adicionou uma descrição."}
                </p>
                <div className="flex flex-wrap gap-4">
                  <button onClick={() => {
                    if (!user) {
                      navigate('/login?redirect=' + encodeURIComponent('/venue/artists'));
                    } else {
                      navigate('/venue/artists', {
                        state: {
                          hireArtist: artistProfile
                        }
                      });
                    }
                  }} className={`${buttonGradient} hover:opacity-90 text-white font-medium py-3 px-6 rounded-lg transition-all duration-300 shadow-lg`}
                    style={{ boxShadow: '0 4px 15px rgba(57, 255, 106, 0.3)' }}>
                    Contratar esse artista
                  </button>
                  <button className="bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-6 rounded-lg border border-gray-200 transition-all duration-300 flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    Favoritar
                  </button>
                </div>
              </div>


            </div>
          </motion.div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQrCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full relative"
          >
            <button
              onClick={() => setShowQrCode(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Meu QR Code</h3>
              <p className="text-sm text-gray-500 mb-6">
                Escaneie para acessar a página de pedidos e gorjetas
              </p>
              <div className="flex justify-center mb-6 p-4 bg-white rounded-xl border border-gray-100">
                <QRCodeSVG
                  value={`${window.location.origin}/artist/tip/${user?.id}`}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <p className="text-xs text-gray-400 break-all">
                {`${window.location.origin}/artist/tip/${user?.id}`}
              </p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/artist/tip/${user?.id}`);
                }}
                className="mt-4 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-all duration-300 text-sm"
              >
                Copiar link
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ArtistMiniProfile;