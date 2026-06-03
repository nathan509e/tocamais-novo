import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Star, CheckCircle, MapPin, Music, Share2,
  Play, Heart, Edit3, Mic, Sun, Moon, Video, Sparkles, Wallet
} from 'lucide-react';
import AppLayout from '../../components/shared/AppLayout';
import NeonButton from '../../components/ui/NeonButton';
import WaveIcon from '../../components/shared/WaveIcon';
import { useTheme } from '../../lib/ThemeContext';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabaseClient';

const portfolioData = [];

const reviews = [];

export default function ArtistProfile() {
  const [activeTab, setActiveTab] = useState('portfolio');
  const { theme, setTheme } = useTheme();
  const { user, refreshProfile } = useAuth();
  
  const [artistProfile, setArtistProfile] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [isEditingVideo, setIsEditingVideo] = useState(false);
  const [selectedMusicas, setSelectedMusicas] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ photo_url: '', cover_url: '', artistic_name: '', bio: '', genre: '', city: '', base_fee: 0, pix_key: '' });
  const [saveStatus, setSaveStatus] = useState('');
  const [pixKey, setPixKey] = useState('');

  const handleImageUpload = async (file, type) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${type}_${user.id}_${Date.now()}.${fileExt}`;
    try {
      const { data, error: uploadErr } = await supabase.storage.from('media').upload(`avatars/${fileName}`, file);
      if (uploadErr) throw uploadErr;
      return supabase.storage.from('media').getPublicUrl(`avatars/${fileName}`).data.publicUrl;
    } catch (err) {
      console.warn('Storage upload error, falling back to Base64:', err);
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
      });
    }
  };

  const saveProfileField = async (field, value) => {
    if (!user) return;
    setSaveStatus('Saving...');
    try {
      const { error } = await supabase.from('artists').update({ [field]: value }).eq('user_id', user.id);
      if (error) throw error;
      setArtistProfile(prev => prev ? { ...prev, [field]: value } : prev);
      setSaveStatus('');
      if (refreshProfile) refreshProfile();
    } catch (err) {
      console.error(`Erro ao salvar ${field}:`, err);
      setSaveStatus(`Erro: ${err.message || 'desconhecido'}`);
    }
  };

  useEffect(() => {
    async function loadProfile() {
      if (user) {
        let artistData = null;
        try {
          const { data } = await supabase.from('artists').select('*').eq('user_id', user.id).single();
          artistData = data;
        } catch (e) {
          console.warn('Error loading profile in page, will attempt insert:', e);
        }

        if (!artistData) {
          try {
            const { data: newArtist } = await supabase.from('artists').insert({
              user_id: user.id,
              artistic_name: user.user_metadata?.name || user.email?.split('@')[0] || 'Artista',
              genre: 'Sertanejo',
              city: 'São Paulo',
              bio: 'Adicione sua biografia aqui.',
              base_fee: 0,
              cover_url: '',
              photo_url: user.user_metadata?.avatar_url || ''
            }).select().single();
            if (newArtist) artistData = newArtist;
          } catch (err) {
            console.error('Failed to auto-create artist profile in page:', err);
          }
        }

        if (artistData) {
          setArtistProfile(artistData);
          setVideoUrl(artistData.presentation_video_url || '');
          setEditForm({ photo_url: artistData.photo_url || '', cover_url: artistData.cover_url || '', artistic_name: artistData.artistic_name || '', bio: artistData.bio || '', genre: artistData.genre || '', city: artistData.city || '', base_fee: artistData.base_fee || 0, pix_key: artistData.pix_key || '' });
          setPixKey(artistData.pix_key || '');
        }
      }
    }
    loadProfile();
  }, [user]);

  useEffect(() => {
    if (!artistProfile?.selected_musicas_ids?.length) return;
    async function loadRepertorio() {
      const { data: allMusicas } = await supabase.from('musicas_repertorio').select('*');
      if (allMusicas) {
        setSelectedMusicas(allMusicas.filter(m => artistProfile.selected_musicas_ids.includes(m.id)));
      }
    }
    loadRepertorio();
  }, [artistProfile]);

  useEffect(() => {
    if (!isEditingVideo && artistProfile) {
      setVideoUrl(artistProfile.presentation_video_url || '');
      setVideoFile(null);
    }
  }, [isEditingVideo, artistProfile]);

  const handleSaveVideo = async () => {
    if (!user) return;
    try {
      let finalVideoUrl = videoUrl;
      
      if (videoFile) {
        const fileExt = videoFile.name.split('.').pop();
        const fileName = `video_${user.id}_${Date.now()}.${fileExt}`;
        const { data, error: uploadErr } = await supabase.storage.from('media').upload(`videos/${fileName}`, videoFile);
        if (uploadErr) throw uploadErr;
        finalVideoUrl = supabase.storage.from('media').getPublicUrl(`videos/${fileName}`).data.publicUrl;
      }
      
      await supabase.from('artists').update({
        presentation_video_url: finalVideoUrl
      }).eq('user_id', user.id);
      
      setArtistProfile(prev => ({
        ...prev,
        presentation_video_url: finalVideoUrl
      }));
      setVideoUrl(finalVideoUrl);
      setVideoFile(null);
      setIsEditingVideo(false);
    } catch (err) {
      console.error(err);
    }
  };
  
  const handleVideoFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(file);
      setVideoUrl(URL.createObjectURL(file));
    }
  };

  const isDark = theme === 'dark';

  return (
    <AppLayout role="artist" userName={artistProfile?.artistic_name || user?.name || ''}>
      <div className="space-y-6">
        
        {/* Cover */}
        <div className="relative h-56 overflow-hidden rounded-2xl">
          <img
            src={artistProfile?.cover_url || 'https://images.unsplash.com/photo-1540039155733-5bb30b4f1519?w=800&h=400&fit=crop'}
            alt="Cover"
            className="w-full h-full object-cover"
          />
          <div className={`absolute inset-0 bg-gradient-to-t via-transparent to-transparent ${
            isDark ? 'from-[#08041A]' : 'from-[#F4F5FA]'
          }`} />
          <div className="absolute top-4 right-4 flex gap-2">
            <button onClick={() => document.getElementById('cover-input')?.click()} className="p-2 rounded-xl bg-black/50 backdrop-blur-sm">
              <Edit3 className="w-4 h-4 text-white" />
            </button>
            <input id="cover-input" type="file" accept="image/*" className="hidden"
              onChange={async e => {
                const file = e.target.files?.[0];
                if (!file) return;
                setSaveStatus('Salvando capa...');
                try {
                  const url = await handleImageUpload(file, 'cover');
                  setEditForm(f => ({ ...f, cover_url: url }));
                  setArtistProfile(prev => ({ ...prev, cover_url: url }));
                  await saveProfileField('cover_url', url);
                } catch (err) {
                  console.error(err);
                  setSaveStatus('Erro ao enviar capa');
                }
              }}
            />
          </div>
        </div>

        <div className="px-4 -mt-14 relative z-10 space-y-5">
          {/* Avatar + Info */}
          <div className="flex items-end gap-4">
            <div className="relative">
              <div className={`w-20 h-20 rounded-2xl overflow-hidden border-4 ${
                isDark ? 'border-[#08041A]' : 'border-[#F4F5FA]'
              }`} style={{ boxShadow: '0 0 25px rgba(123,46,255,0.5)' }}>
                <img src={artistProfile?.photo_url || user?.avatar_url || ''} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <div className={`absolute -bottom-1 -right-1 bg-neon-green rounded-full w-5 h-5 flex items-center justify-center border-2 ${
                isDark ? 'border-[#08041A]' : 'border-[#F4F5FA]'
              }`}>
                <span className="text-black text-[7px] font-black">AO</span>
              </div>
            </div>
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-2">
                <h2 className={`font-black text-xl ${isDark ? 'text-white' : 'text-gray-900'}`}>{artistProfile?.artistic_name || user?.name || 'Artista'}</h2>
                <CheckCircle className="w-5 h-5 text-neon-purple" />
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <Music className="w-3.5 h-3.5 text-neon-green" />
                <span className="text-neon-green text-xs font-semibold">{artistProfile?.genre || 'Sertanejo'}</span>
                <span className="text-gray-400">•</span>
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-gray-400 text-xs">{artistProfile?.city || 'São Paulo'}, SP</span>
              </div>
            </div>
          </div>

          {/* Edit Profile Button */}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="w-full py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2"
            style={{
              borderColor: isEditing ? '#39FF6A' : (isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb'),
              color: isEditing ? '#39FF6A' : (isDark ? '#fff' : '#374151')
            }}
          >
            <Edit3 className="w-4 h-4" />
            <span>{isEditing ? 'Fechar Edição' : 'Editar Perfil'}</span>
          </button>

          {/* Edit Profile Form */}
          {isEditing && (
            <div className={`p-4 rounded-2xl border transition-all space-y-3 ${
              isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-200 shadow-xs'
            }`}>
              <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-gray-800'}`}>Editar Perfil</h3>
              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">Foto do Perfil</label>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={async e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setSaveStatus('Enviando imagem...');
                    try {
                      const url = await handleImageUpload(file, 'avatar');
                      setEditForm(f => ({ ...f, photo_url: url }));
                      setArtistProfile(prev => ({ ...prev, photo_url: url }));
                      setSaveStatus('Salvando...');
                      const updResp = await supabase.from('artists').update({ photo_url: url }).eq('user_id', user.id);
                      if (updResp.error) { console.error('DB save error:', updResp.error); setSaveStatus('Erro ao salvar: ' + updResp.error.message); return; }
                      if (refreshProfile) refreshProfile();
                      setSaveStatus('');
                    } catch (err) {
                      console.error('Erro completo:', err);
                      setSaveStatus('Erro no upload: ' + (err.message || err));
                    }
                  }}
                  className="w-full text-xs text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-neon-purple file:text-white hover:file:opacity-90 cursor-pointer"
                />
                <img src={artistProfile?.photo_url || ''} alt="Preview" className="w-16 h-16 rounded-xl object-cover mt-2 border border-white/10"
                  onError={e => e.target.style.display = 'none'}
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">Nome Artístico</label>
                <input type="text" value={editForm.artistic_name}
                  onChange={e => setEditForm(f => ({ ...f, artistic_name: e.target.value }))}
                  onBlur={e => saveProfileField('artistic_name', e.target.value)}
                  className={`w-full p-2.5 rounded-xl border text-xs outline-none ${
                    isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'
                  }`}
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">Bio</label>
                <textarea value={editForm.bio}
                  onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
                  onBlur={e => saveProfileField('bio', e.target.value)}
                  rows={3}
                  className={`w-full p-2.5 rounded-xl border text-xs outline-none resize-none ${
                    isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'
                  }`}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1">Gênero Musical</label>
                  <input type="text" value={editForm.genre}
                    onChange={e => setEditForm(f => ({ ...f, genre: e.target.value }))}
                    onBlur={e => saveProfileField('genre', e.target.value)}
                    className={`w-full p-2.5 rounded-xl border text-xs outline-none ${
                      isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1">Cidade</label>
                  <input type="text" value={editForm.city}
                    onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))}
                    onBlur={e => saveProfileField('city', e.target.value)}
                    className={`w-full p-2.5 rounded-xl border text-xs outline-none ${
                      isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'
                    }`}
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">Cachê Base (R$)</label>
                <input type="number" value={editForm.base_fee}
                  onChange={e => setEditForm(f => ({ ...f, base_fee: Number(e.target.value) }))}
                  onBlur={e => saveProfileField('base_fee', Number(e.target.value))}
                  className={`w-full p-2.5 rounded-xl border text-xs outline-none ${
                    isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'
                  }`}
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">Chave PIX (para receber gorjetas)</label>
                <input type="text" value={editForm.pix_key}
                  onChange={e => setEditForm(f => ({ ...f, pix_key: e.target.value }))}
                  onBlur={e => saveProfileField('pix_key', e.target.value)}
                  placeholder="CPF, email, telefone ou chave aleatória"
                  className={`w-full p-2.5 rounded-xl border text-xs outline-none ${
                    isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'
                  }`}
                />
              </div>
              {saveStatus && (
                <p className={`text-[10px] font-bold text-center ${saveStatus.startsWith('Erro') ? 'text-red-400' : 'text-neon-green'}`}>{saveStatus}</p>
              )}
            </div>
          )}

          {/* Theme Switcher Card */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-200 shadow-xs'
          } space-y-3`}>
            <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-gray-800'}`}>Aparência da Plataforma</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  !isDark 
                    ? 'bg-neon-purple/10 border-neon-purple text-neon-purple' 
                    : 'bg-white/5 border-white/10 text-gray-400'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>Modo Claro (Fundo Branco)</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  isDark 
                    ? 'bg-neon-purple/20 border-neon-purple text-white' 
                    : 'bg-gray-100 border-gray-200 text-gray-500'
                }`}
              >
                <Moon className="w-4 h-4" />
                <span>Modo Escuro</span>
              </button>
            </div>
          </div>

          {/* Bio */}
          <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {artistProfile?.bio || 'Artista sertanejo com mais de 8 anos de carreira. Especialista em eventos ao vivo, casamentos e shows em bares e restaurantes. Energia garantida! 🎸'}
          </p>

          {/* Presentation Video Section */}
          <div className={`p-5 rounded-2xl border transition-all ${
            isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-200 shadow-xs'
          } space-y-4`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-neon-purple" />
                <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-gray-800'}`}>Vídeo de Apresentação</h3>
              </div>
              <button 
                onClick={() => setIsEditingVideo(!isEditingVideo)}
                className="text-xs font-bold text-neon-purple hover:underline"
              >
                {isEditingVideo ? 'Cancelar' : 'Alterar Vídeo'}
              </button>
            </div>

            {isEditingVideo ? (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1">Selecione um vídeo do seu dispositivo</label>
                  <input 
                    type="file"
                    accept="video/*"
                    onChange={handleVideoFileChange}
                    className={`w-full p-2.5 rounded-xl border text-xs outline-none ${
                      isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'
                    }`}
                  />
                </div>
                {videoFile && (
                  <p className="text-xs text-neon-green">Vídeo selecionado: {videoFile.name}</p>
                )}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-white/10"></div>
                  <span className="text-[10px] text-gray-500">ou</span>
                  <div className="flex-1 h-px bg-white/10"></div>
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 font-bold block mb-1">URL do Vídeo (YouTube, Vimeo, etc.)</label>
                  <input 
                    type="text" 
                    value={videoUrl}
                    onChange={e => {
                      setVideoUrl(e.target.value);
                      setVideoFile(null);
                    }}
                    placeholder="Ex: https://youtube.com/watch?v=..."
                    disabled={!!videoFile}
                    className={`w-full p-2.5 rounded-xl border text-xs outline-none ${
                      videoFile ? 'opacity-50' : ''
                    } ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'}`}
                  />
                </div>
                <button 
                  onClick={handleSaveVideo}
                  className="w-full py-2.5 rounded-xl bg-neon-purple text-white text-xs font-bold hover:shadow-[0_0_15px_rgba(123,46,255,0.3)] transition-all"
                >
                  Salvar Vídeo
                </button>
              </div>
            ) : (
              <div className="rounded-xl overflow-hidden bg-black/40 relative border border-white/5">
                {videoUrl ? (
                  videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') ? (
                    <div className="w-full flex justify-center">
                      <div style={{ aspectRatio: '9/16', width: '100%', maxWidth: '280px' }}>
                        <iframe 
                          src={videoUrl.replace('watch?v=', 'embed/').split('&')[0] + '?aspect_ratio=9:16'} 
                          className="w-full h-full" 
                          allowFullScreen 
                          title="Vídeo de Apresentação"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="w-full flex justify-center">
                      <video 
                        src={videoUrl} 
                        controls 
                        className="max-h-[70vh]"
                        style={{ width: 'auto', aspectRatio: '9/16', maxWidth: '280px' }} 
                      />
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <p className="text-xs text-gray-500">Nenhum vídeo cadastrado. Clique em 'Alterar Vídeo' para compartilhar seu trabalho!</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Repertório */}
          {selectedMusicas.length > 0 && (
            <div className={`p-5 rounded-2xl border transition-all ${
              isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-200 shadow-xs'
            } space-y-3`}>
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-neon-green" />
                <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-gray-800'}`}>Repertório</h3>
                <Sparkles className="w-3.5 h-3.5 text-neon-green" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {selectedMusicas.map(m => (
                  <div key={m.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/5">
                    <span className="text-neon-green text-sm">♪</span>
                    <div className="min-w-0">
                      <p className={`text-xs font-semibold truncate ${isDark ? 'text-white' : 'text-gray-800'}`}>{m.titulo}</p>
                      <p className="text-[10px] text-gray-400">{m.artista_nome}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { value: artistProfile?.followers ? `${(artistProfile.followers / 1000).toFixed(0)}K` : '0', label: 'Seguidores' },
              { value: artistProfile?.rating ? `${artistProfile.rating}⭐` : '0⭐', label: 'Avaliação' },
              { value: '0', label: 'Shows' },
              { value: artistProfile?.base_fee ? `R$ ${artistProfile.base_fee.toLocaleString()}` : 'R$ 0', label: 'Cachê' },
            ].map((s, i) => (
              <div key={i} className={`text-center p-2.5 rounded-xl border ${
                isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-200 shadow-2xs'
              }`}>
                <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{s.value}</p>
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
              <Share2 className="w-4 h-4 text-gray-500" />
            </NeonButton>
            <NeonButton variant="ghost" size="md">
              <Heart className="w-4 h-4 text-gray-500" />
            </NeonButton>
          </div>

          {/* Tip Card */}
          {(artistProfile?.pix_key || user?.id === artistProfile?.user_id) && (
            <a
              href={user?.id === artistProfile?.user_id ? '/artist/tip/' + user.id : '/artist/tip/' + artistProfile?.user_id}
              className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${
                isDark ? 'bg-white/5 border-white/5 hover:border-neon-green/30' : 'bg-white border-gray-200 hover:border-neon-green/30'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-neon-green/20 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-neon-green" />
              </div>
              <div className="flex-1">
                <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Dar Gorjeta
                </p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Acompanhe esse artista no seu.show
                </p>
              </div>
              <div className="text-neon-green text-2xl">→</div>
            </a>
          )}

          {/* Mini Player */}
          <div className={`flex items-center gap-4 p-4 rounded-2xl border ${
            isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-200'
          }`}>
            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
              <img src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop" alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-semibold text-sm truncate ${isDark ? 'text-white' : 'text-gray-800'}`}>Amor da Roça</p>
              <p className="text-gray-400 text-xs">{artistProfile?.artistic_name || user?.name || 'Artista'}{artistProfile?.genre ? ` • ${artistProfile.genre}` : ''}</p>
              <div className="flex items-center gap-1 mt-2">
                <WaveIcon size={16} animated />
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-neon-purple text-white"
              style={{ boxShadow: '0 0 15px rgba(123,46,255,0.5)' }}
            >
              <Play className="w-4 h-4 text-white ml-0.5" />
            </motion.button>
          </div>

          {/* Tabs */}
          <div className={`flex gap-1 p-1 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
            {['portfolio', 'avaliações'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
                  activeTab === tab 
                    ? 'bg-neon-purple text-white' 
                    : isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'portfolio' && (
            <div className="grid grid-cols-2 gap-3 pb-6">
              {portfolioData.map((v, i) => (
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
                  className={`p-4 rounded-2xl border ${
                    isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-200'
                  }`}>
                  <div className="flex items-start gap-3">
                    <img src={r.avatar} alt={r.author} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{r.author}</p>
                        <span className="text-gray-500 text-xs">{r.date}</span>
                      </div>
                      <div className="flex items-center gap-0.5 my-1">
                        {Array.from({ length: r.rating }).map((_, idx) => (
                          <Star key={idx} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        ))}
                      </div>
                      <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{r.text}</p>
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