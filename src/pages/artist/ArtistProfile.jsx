import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import {
  Crown, CheckCircle, MapPin, Music,
  Edit3, Video, Wallet,
  ExternalLink, QrCode, X, Sun, Moon,
  ChevronUp, ChevronDown
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import AppLayout from '../../components/shared/AppLayout';
import ImageCropModal from '../../components/shared/ImageCropModal';
import { useTheme } from '../../lib/ThemeContext';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabaseClient';

export default function ArtistProfile() {
  const { theme, setTheme } = useTheme();
  const { user, refreshProfile } = useAuth();
  
  const [artistProfile, setArtistProfile] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [isEditingVideo, setIsEditingVideo] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [coverPosition, setCoverPosition] = useState(50);
  const [coverZoom, setCoverZoom] = useState(1);
  const [showAdjustPanel, setShowAdjustPanel] = useState(true);
  const [editForm, setEditForm] = useState({ photo_url: '', cover_url: '', artistic_name: '', bio: '', genre: '', city: '', base_fee: 0, pix_key: '' });
  const [saveStatus, setSaveStatus] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [cropState, setCropState] = useState(null); // { src, aspectRatio, type } | null
  const [walletSaved, setWalletSaved] = useState(false);
  const [manualWalletId, setManualWalletId] = useState('');
  const [savingManualWallet, setSavingManualWallet] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [asaasWalletId, setAsaasWalletId] = useState('');

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

  // Abre o modal de crop quando o usuário seleciona uma imagem
  const openCrop = (file, type) => {
    const src = URL.createObjectURL(file);
    const aspectRatio = type === 'avatar' ? 1 : 1672 / 941;
    setCropState({ src, aspectRatio, type, fileName: file.name });
  };

  // Quando o usuário confirma o crop
  const handleCropConfirm = async (blob) => {
    if (!cropState) return;
    const { type, fileName } = cropState;
    setCropState(null);

    // Converte blob em File
    const ext = fileName.split('.').pop() || 'jpg';
    const croppedFile = new File([blob], `${type}_cropped_${Date.now()}.${ext}`, { type: 'image/jpeg' });

    setSaveStatus(type === 'avatar' ? 'Enviando foto...' : 'Salvando capa...');
    try {
      const url = await handleImageUpload(croppedFile, type);

      if (type === 'avatar') {
        setEditForm(f => ({ ...f, photo_url: url }));
        setArtistProfile(prev => ({ ...prev, photo_url: url }));
        setSaveStatus('Salvando...');
        const updResp = await supabase.from('artists').update({ photo_url: url }).eq('user_id', user.id);
        if (updResp.error) { console.error('DB save error:', updResp.error); setSaveStatus('Erro ao salvar: ' + updResp.error.message); return; }
      } else {
        setEditForm(f => ({ ...f, cover_url: url }));
        setArtistProfile(prev => ({ ...prev, cover_url: url }));
        await saveProfileField('cover_url', url);
      }

      if (refreshProfile) refreshProfile();
      setSaveStatus('');
    } catch (err) {
      console.error('Erro completo:', err);
      setSaveStatus('Erro no upload: ' + (err.message || err));
    }
  };

  const saveProfileField = async (field, value) => {
    if (!user) return;
    setSaveStatus('Salvando...');
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
              rating: 0,
              followers: 0,
              verified: false,
              live_now: false,
              featured: false,
              cover_url: '',
              cover_position: 50,
              photo_url: user.user_metadata?.avatar_url || ''
            }).select().single();
            if (newArtist) artistData = newArtist;
          } catch (err) {
            console.error('Failed to auto-create artist profile in page:', err);
          }
        }

        if (artistData) {
          setArtistProfile(artistData);
          setCoverPosition(artistData.cover_position ?? 50);
          setCoverZoom(artistData.cover_zoom ?? 1);
          setVideoUrl(artistData.presentation_video_url || '');
          setEditForm({ photo_url: artistData.photo_url || '', cover_url: artistData.cover_url || '', artistic_name: artistData.artistic_name || '', bio: artistData.bio || '', genre: artistData.genre || '', city: artistData.city || '', base_fee: artistData.base_fee || 0, pix_key: artistData.pix_key || '' });
          setPixKey(artistData.pix_key || '');
          setCpfCnpj(artistData.cpf_cnpj || '');
        }
      }
    }
    loadProfile();
  }, [user]);

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

  const handleSaveManualWallet = async () => {
    const cleanId = manualWalletId.trim();
    if (!cleanId) return;
    setSavingManualWallet(true);
    try {
      const { error: updateError } = await supabase
        .from('artists')
        .update({
          asaas_wallet_id: cleanId,
          asaas_account_status: 'pending_verification'
        })
        .eq('user_id', user.id);
      if (updateError) throw new Error(updateError.message);
      setArtistProfile(prev => prev ? {
        ...prev,
        asaas_wallet_id: cleanId,
        asaas_account_status: 'pending_verification'
      } : prev);
      setWalletSaved(true);
      setManualWalletId('');
      if (refreshProfile) refreshProfile();
    } catch (e) {
      alert('Erro ao salvar Wallet ID:\n' + (e.message || e));
    } finally {
      setSavingManualWallet(false);
    }
  };

  useEffect(() => {
    if (artistProfile) {
      setAsaasWalletId(artistProfile.asaas_wallet_id || '');
    }
  }, [artistProfile]);

  const isDark = theme === 'dark';

  return (
    <AppLayout role="artist">
      <div className="space-y-6">
        
        {/* Cover */}
        <div className="relative h-56 overflow-hidden rounded-2xl">
          <img
            src={artistProfile?.cover_url || 'https://images.unsplash.com/photo-1540039155733-5bb30b4f1519?w=800&h=400&fit=crop'}
            alt="Cover"
            className="w-full h-full object-cover transition-transform duration-200"
            style={{ objectPosition: `50% ${coverPosition}%`, transform: `scale(${coverZoom})` }}
          />
          <div className={`absolute inset-0 bg-gradient-to-t via-transparent to-transparent ${
            isDark ? 'from-[#08041A]' : 'from-[#F4F5FA]'
          }`} />
          <div className="absolute top-4 right-4 flex gap-2">
            <button onClick={() => document.getElementById('cover-input')?.click()} className="p-2 rounded-xl bg-black/50 backdrop-blur-sm">
              <Edit3 className="w-4 h-4 text-white" />
            </button>
            <input id="cover-input" type="file" accept="image/*" className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (!file) return;
                openCrop(file, 'cover');
                e.target.value = '';
              }}
            />
          </div>
          {artistProfile?.cover_url && (
            showAdjustPanel ? (
              <div className="absolute bottom-3 left-3 right-3 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-3 flex flex-col gap-2.5 shadow-lg z-20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">Ajustar Capa</span>
                    <button
                      type="button"
                      onClick={() => setShowAdjustPanel(false)}
                      className="p-0.5 rounded hover:bg-white/15 text-white/80 transition-all"
                      title="Ocultar painel"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      setCoverPosition(50);
                      setCoverZoom(1);
                      // Save fields directly on reset
                      await supabase.from('artists').update({ cover_position: 50, cover_zoom: 1 }).eq('user_id', user.id);
                      if (refreshProfile) refreshProfile();
                    }}
                    className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[9px] font-bold text-white transition-all uppercase tracking-wider"
                  >
                    Resetar
                  </button>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] text-white/70 font-semibold w-12">Posição:</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={coverPosition}
                      onChange={e => setCoverPosition(Number(e.target.value))}
                      onMouseUp={async () => await saveProfileField('cover_position', coverPosition)}
                      onTouchEnd={async () => await saveProfileField('cover_position', coverPosition)}
                      className="flex-1 h-1.5 appearance-none rounded-full bg-white/20 cursor-pointer outline-none"
                      style={{ accentColor: '#7B2EFF' }}
                    />
                    <span className="text-[9px] text-white/60 w-6 text-right">{coverPosition}%</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] text-white/70 font-semibold w-12">Zoom:</span>
                    <input
                      type="range"
                      min="0.1"
                      max="3"
                      step="0.05"
                      value={coverZoom}
                      onChange={e => setCoverZoom(Number(e.target.value))}
                      onMouseUp={async () => await saveProfileField('cover_zoom', coverZoom)}
                      onTouchEnd={async () => await saveProfileField('cover_zoom', coverZoom)}
                      className="flex-1 h-1.5 appearance-none rounded-full bg-white/20 cursor-pointer outline-none"
                      style={{ accentColor: '#7B2EFF' }}
                    />
                    <span className="text-[9px] text-white/60 w-6 text-right">{coverZoom}x</span>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAdjustPanel(true)}
                className="absolute bottom-3 right-3 p-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl text-white hover:bg-black/80 transition-all flex items-center gap-1 shadow-lg z-20"
                title="Ajustar Capa"
              >
                <ChevronUp className="w-4 h-4" />
                <span className="text-[9px] font-bold uppercase tracking-wider">Ajustar</span>
              </button>
            )
          )}
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
                {artistProfile?.is_pro && <Crown className="w-5 h-5 text-amber-400 fill-amber-400" />}
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

          {/* Button to Mini Profile */}
          <button
            onClick={() => window.location.href = '/artist/mini-profile'}
            className="w-full py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2"
            style={{
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb',
              color: isDark ? '#fff' : '#374151',
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
            }}
          >
            <span>Ver Mini Perfil</span>
          </button>

          {/* QR Code Button */}
          <button
            onClick={() => setShowQrCode(true)}
            className="w-full py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2"
            style={{
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb',
              color: isDark ? '#fff' : '#374151',
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
            }}
          >
            <QrCode className="w-4 h-4" />
            <span>Meu QR Code</span>
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
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    openCrop(file, 'avatar');
                    e.target.value = '';
                  }}
                  className="w-full text-xs text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-neon-purple file:text-white hover:file:opacity-90 cursor-pointer"
                />
                <img src={artistProfile?.photo_url || ''} alt="Preview" className="w-16 h-16 rounded-xl object-cover mt-2 border border-white/10"
                  onError={e => { const img = e.currentTarget; img.style.display = 'none'; }}
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

          {/* Pro: PIX Key Card */}
          {artistProfile?.is_pro ? (
            <div className={`p-4 rounded-2xl border transition-all ${
              isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-200 shadow-xs'
            } space-y-3`}>
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-5 text-amber-400 fill-amber-400" />
                <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  Sua Chave PIX
                </h3>
              </div>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Esta chave PIX será usada para receber o valor integral das gorjetas dos seus fãs.
              </p>
              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">Chave PIX</label>
                <input
                  type="text"
                  value={pixKey}
                  onChange={e => setPixKey(e.target.value)}
                  onBlur={e => saveProfileField('pix_key', e.target.value)}
                  placeholder="CPF, email, telefone ou chave aleatória"
                  className={`w-full p-2.5 rounded-xl border text-xs outline-none ${
                    isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'
                  }`}
                />
              </div>
              {pixKey && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-neon-green" />
                  <span className="text-xs font-semibold text-neon-green">Chave salva</span>
                </div>
              )}
            </div>
          ) : (
            /* Non-Pro: Asaas Connect Card */
            <div className={`p-4 rounded-2xl border transition-all ${
              isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-200 shadow-xs'
            } space-y-3`}>
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-neon-green" />
                <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  Receber Pagamentos
                </h3>
              </div>

              {artistProfile?.asaas_wallet_id ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-neon-green" />
                    <span className="text-xs font-semibold text-neon-green">
                      {artistProfile.asaas_account_status === 'pending_verification' 
                        ? 'Conta Criada — Aguardando Ativação' 
                        : 'Asaas Conectado'}
                    </span>
                  </div>
                  <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    Gorjetas: 30% TocaMais | 70% sua conta Asaas
                  </p>
                  <p className={`text-[10px] font-mono ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    Wallet: {artistProfile.asaas_wallet_id}
                  </p>
                  {artistProfile.asaas_account_status === 'pending_verification' && (
                    <p className={`text-[10px] ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                      ⚠️ Verifique seu email para ativar a conta Asaas.
                    </p>
                  )}
                  <a
                    href="https://www.asaas.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1 text-xs font-bold text-neon-purple hover:underline`}
                  >
                    <ExternalLink className="w-3 h-3" />
                    Ver conta no Asaas
                  </a>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Insira o <strong>Wallet ID</strong> da sua conta Asaas para receber gorjetas via PIX.
                  </p>
                  <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    Comissão: 30% TocaMais | 70% para você
                  </p>
                  <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    Encontre em: <strong>asaas.com → Configurações → Dados da conta</strong>
                  </p>
                  <div>
                    <label className="text-[10px] text-gray-400 font-bold block mb-1">Wallet ID</label>
                    <input
                      type="text"
                      value={manualWalletId}
                      onChange={e => setManualWalletId(e.target.value)}
                      placeholder="Ex: wal_xxxxxxxxxxxxxxxx"
                      className={`w-full p-2.5 rounded-xl border text-xs outline-none font-mono ${
                        isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-gray-600' : 'bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400'
                      }`}
                    />
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={handleSaveManualWallet}
                      disabled={savingManualWallet || !manualWalletId.trim()}
                      className="w-full py-2.5 rounded-xl font-bold text-xs text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      style={{
                        background: 'linear-gradient(135deg, #7B2EFF, #39FF6A)',
                        boxShadow: '0 0 15px rgba(123,46,255,0.3)'
                      }}
                    >
                      <Wallet className="w-4 h-4" />
                      {savingManualWallet ? 'Salvando...' : 'Conectar Conta Asaas'}
                    </button>
                    {walletSaved && (
                      <p className="text-[10px] text-neon-green text-center font-bold">✓ Conta Asaas conectada com sucesso!</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

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




        </div>
      </div>

      {/* Image Crop Modal */}
      {cropState && (
        <ImageCropModal
          imageSrc={cropState.src}
          aspectRatio={cropState.aspectRatio}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropState(null)}
        />
      )}

      {/* QR Code Modal — portal para evitar conflito de z-index com sidebar */}
      {showQrCode && createPortal(
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowQrCode(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className={`relative rounded-2xl p-6 max-w-sm w-full ${isDark ? 'bg-[#1a1a2e]' : 'bg-white'} shadow-2xl`}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowQrCode(false)}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/10"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
            <div className="text-center">
              <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Meu QR Code
              </h3>
              <div className="bg-white p-4 rounded-xl inline-block mb-4">
                <QRCodeSVG
                  value={`${window.location.origin}/artist/tip/${user?.id}`}
                  size={200}
                  level="H"
                />
              </div>
              <p className={`text-xs mb-4 break-all ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {`${window.location.origin}/artist/tip/${user?.id}`}
              </p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/artist/tip/${user?.id}`);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-white transition-all"
                style={{ backgroundColor: '#7B2EFF' }}
              >
                {copied ? '✓ Copiado!' : 'Copiar link'}
              </button>
            </div>
          </motion.div>
        </motion.div>,
        document.body
      )}
    </AppLayout>
  );
}
