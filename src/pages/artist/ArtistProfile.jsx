import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Star, CheckCircle, MapPin, Music, Users, Instagram, Share2,
  Play, Heart, Camera, Edit3, Mic
} from 'lucide-react';
import AppLayout from '../../components/shared/AppLayout';
import NeonButton from '../../components/ui/NeonButton';
import WaveIcon from '../../components/shared/WaveIcon';

const portfolio = [
  { id: '1', title: 'Show ao Vivo - Bar Maresias', thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=200&fit=crop', views: '12.4K', duration: '3:45' },
  { id: '2', title: 'Ensaio - Backstage', thumbnail: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&h=200&fit=crop', views: '8.1K', duration: '2:12' },
  { id: '3', title: 'Acústico - Café Cultura', thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=200&fit=crop', views: '5.7K', duration: '4:20' },
  { id: '4', title: 'Festival de Verão 2025', thumbnail: 'https://images.unsplash.com/photo-1540039155733-5bb30b4f1519?w=300&h=200&fit=crop', views: '21.2K', duration: '5:01' },
];

const reviews = [
  { id: '1', author: 'Bar do Zeca', rating: 5, text: 'Show incrível! A energia foi incrível e o público adorou. Com certeza chamaremos de novo.', date: '12 Mai 2026', avatar: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=60&h=60&fit=crop' },
  { id: '2', author: 'Maria Clara', rating: 5, text: 'Contratei para meu casamento e foi perfeito! Muito profissional e talentoso.', date: '02 Abr 2026', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&h=60&fit=crop' },
  { id: '3', author: 'Espaço Eventos', rating: 4, text: 'Excelente artista! Muito comprometido com horários e qualidade.', date: '18 Mar 2026', avatar: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=60&h=60&fit=crop' },
];

export default function ArtistProfile() {
  const [activeTab, setActiveTab] = useState('portfolio');

  return (
    <AppLayout role="artist" userName="Lucas Volta">
      <div className="space-y-0">
        {/* Cover */}
        <div className="relative h-56 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1540039155733-5bb30b4f1519?w=800&h=400&fit=crop"
            alt="Cover"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-app-dark via-app-dark/40 to-transparent" />
          <div className="absolute top-4 right-4 flex gap-2">
            <button className="p-2 rounded-xl bg-black/50 backdrop-blur-sm">
              <Camera className="w-4 h-4 text-white" />
            </button>
            <button className="p-2 rounded-xl bg-black/50 backdrop-blur-sm">
              <Edit3 className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        <div className="px-4 -mt-10 relative z-10 space-y-5">
          {/* Avatar + Info */}
          <div className="flex items-end gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-app-dark" style={{ boxShadow: '0 0 25px rgba(123,46,255,0.5)' }}>
                <img src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop" alt="Lucas Volta" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-1 -right-1 bg-neon-green rounded-full w-5 h-5 flex items-center justify-center border-2 border-app-dark">
                <span className="text-black text-[7px] font-black">AO</span>
              </div>
            </div>
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-2">
                <h2 className="text-white font-black text-xl">Lucas Volta</h2>
                <CheckCircle className="w-5 h-5 text-neon-purple" />
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <Music className="w-3.5 h-3.5 text-neon-green" />
                <span className="text-neon-green text-xs font-semibold">Sertanejo</span>
                <span className="text-gray-600">•</span>
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-gray-400 text-xs">São Paulo, SP</span>
              </div>
            </div>
          </div>

          {/* Bio */}
          <p className="text-gray-400 text-sm leading-relaxed">
            Artista sertanejo com mais de 8 anos de carreira. Especialista em eventos ao vivo, casamentos e shows em bares e restaurantes. Energia garantida! 🎸
          </p>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { value: '103K', label: 'Seguidores' },
              { value: '4.9⭐', label: 'Avaliação' },
              { value: '240', label: 'Shows' },
              { value: 'R$2.800', label: 'Cachê' },
            ].map((s, i) => (
              <div key={i} className="text-center p-2.5 rounded-xl bg-white/5 border border-white/8">
                <p className="text-white font-bold text-sm">{s.value}</p>
                <p className="text-gray-500 text-[10px] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-2">
            <NeonButton variant="gradient" size="md" className="flex-1">
              <Mic className="w-4 h-4 inline mr-1" />
              Contratar
            </NeonButton>
            <NeonButton variant="ghost" size="md">
              <Share2 className="w-4 h-4" />
            </NeonButton>
            <NeonButton variant="ghost" size="md">
              <Heart className="w-4 h-4" />
            </NeonButton>
          </div>

          {/* Mini Player */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/8">
            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
              <img src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop" alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">Amor da Roça</p>
              <p className="text-gray-400 text-xs">Lucas Volta • Sertanejo</p>
              <div className="flex items-center gap-1 mt-2">
                <WaveIcon size={16} animated />
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-neon-purple"
              style={{ boxShadow: '0 0 15px rgba(123,46,255,0.5)' }}
            >
              <Play className="w-4 h-4 text-white ml-0.5" />
            </motion.button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl bg-white/5">
            {['portfolio', 'avaliações'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${activeTab === tab ? 'bg-neon-purple text-white' : 'text-gray-400'}`}>
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'portfolio' && (
            <div className="grid grid-cols-2 gap-3 pb-6">
              {portfolio.map((v, i) => (
                <motion.div key={v.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.07 }}
                  className="relative rounded-xl overflow-hidden cursor-pointer">
                  <img src={v.thumbnail} alt={v.title} className="w-full aspect-video object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-2">
                    <p className="text-white text-xs font-semibold line-clamp-1">{v.title}</p>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-gray-300 text-[10px]">{v.views} views</span>
                      <span className="text-gray-300 text-[10px]">{v.duration}</span>
                    </div>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Play className="w-4 h-4 text-white ml-0.5" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {activeTab === 'avaliações' && (
            <div className="space-y-3 pb-6">
              {reviews.map((r, i) => (
                <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                  className="p-4 rounded-2xl bg-white/5 border border-white/8">
                  <div className="flex items-start gap-3">
                    <img src={r.avatar} alt={r.author} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-white font-semibold text-sm">{r.author}</p>
                        <span className="text-gray-500 text-xs">{r.date}</span>
                      </div>
                      <div className="flex items-center gap-0.5 my-1">
                        {Array.from({ length: r.rating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        ))}
                      </div>
                      <p className="text-gray-400 text-xs leading-relaxed">{r.text}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}