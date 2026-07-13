import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, Camera, Video, Music, Check, ArrowRight, ArrowLeft,
  ExternalLink, Sparkles, Upload, Eye, EyeOff, Search, Loader, AlertTriangle, CheckCircle2, X
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/AuthContext';
import { useTheme } from '../../lib/ThemeContext';
import ImageCropModal from '../../components/shared/ImageCropModal';

// Tutorial images we copied
import asaasStep1 from '../../assets/asaas-tutorial-1.png';
import asaasStep2 from '../../assets/asaas-tutorial-2.png';

const STEPS = {
  ASAAS: 0,
  PHOTOS: 1,
  VIDEO: 2,
  REPERTOIRE: 3
};

export default function ArtistOnboarding() {
  const { user, refreshProfile } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const [currentStep, setCurrentStep] = useState(STEPS.ASAAS);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  
  // Profile state loaded from Supabase
  const [profile, setProfile] = useState(null);

  // Step 1: Asaas
  const [walletId, setWalletId] = useState('');
  const [walletSaved, setWalletSaved] = useState(false);

  // Step 2: Photos
  const [profilePhoto, setProfilePhoto] = useState('');
  const [coverPhoto, setCoverPhoto] = useState('');
  const [cropState, setCropState] = useState(null); // { src, aspectRatio, type, fileName }
  const [fullscreenImage, setFullscreenImage] = useState(null); // { src, alt } | null

  // Step 3: Video
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [videoUploading, setVideoUploading] = useState(false);

  // Step 4: Repertoire
  const [allSongs, setAllSongs] = useState([]);
  const [selectedSongs, setSelectedSongs] = useState([]);
  const [searchSong, setSearchSong] = useState('');

  // Load profile data
  useEffect(() => {
    async function loadData() {
      if (!user) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('artists')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (data) {
          setProfile(data);
          setWalletId(data.asaas_wallet_id || '');
          setWalletSaved(!!data.asaas_wallet_id);
          setProfilePhoto(data.photo_url || '');
          setCoverPhoto(data.cover_url || '');
          setVideoUrl(data.presentation_video_url || '');
          setSelectedSongs(data.selected_musicas_ids || []);

          if (data.is_pro) {
            if (data.photo_url && data.cover_url) {
              setCurrentStep(STEPS.VIDEO);
            } else {
              setCurrentStep(STEPS.PHOTOS);
            }
          }
        }
      } catch (e) {
        console.error('Error loading profile:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  // Load all repertoire songs for step 4
  useEffect(() => {
    async function loadSongs() {
      try {
        const { data } = await supabase
          .from('musicas_repertorio')
          .select('*');
        if (data) setAllSongs(data);
      } catch (e) {
        console.error('Error loading music list:', e);
      }
    }
    loadSongs();
  }, []);

  const hasPhotos = !!profilePhoto && !!coverPhoto;

  const stepsList = profile?.is_pro
    ? [
        { step: STEPS.PHOTOS, icon: Camera, label: 'Fotos' },
        { step: STEPS.VIDEO, icon: Video, label: 'Vídeo' },
        { step: STEPS.REPERTOIRE, icon: Music, label: 'Repertório' }
      ]
    : [
        { step: STEPS.ASAAS, icon: Wallet, label: 'Asaas API' },
        { step: STEPS.PHOTOS, icon: Camera, label: 'Fotos' },
        { step: STEPS.VIDEO, icon: Video, label: 'Vídeo' },
        { step: STEPS.REPERTOIRE, icon: Music, label: 'Repertório' }
      ];

  const activeStepIndex = stepsList.findIndex(s => s.step === currentStep);
  const totalSteps = stepsList.length;
  const progressPercent = totalSteps > 1 ? (activeStepIndex / (totalSteps - 1)) * 100 : 0;

  const handleNextStep = () => {
    if (currentStep === STEPS.ASAAS) {
      if (hasPhotos) {
        setCurrentStep(STEPS.VIDEO);
      } else {
        setCurrentStep(STEPS.PHOTOS);
      }
    } else if (currentStep === STEPS.PHOTOS) {
      setCurrentStep(STEPS.VIDEO);
    } else if (currentStep === STEPS.VIDEO) {
      setCurrentStep(STEPS.REPERTOIRE);
    }
  };

  const handlePrevStep = () => {
    if (currentStep === STEPS.REPERTOIRE) {
      setCurrentStep(STEPS.VIDEO);
    } else if (currentStep === STEPS.VIDEO) {
      if (profile?.is_pro) {
        if (!hasPhotos) {
          setCurrentStep(STEPS.PHOTOS);
        }
      } else {
        if (hasPhotos) {
          setCurrentStep(STEPS.ASAAS);
        } else {
          setCurrentStep(STEPS.PHOTOS);
        }
      }
    } else if (currentStep === STEPS.PHOTOS) {
      if (!profile?.is_pro) {
        setCurrentStep(STEPS.ASAAS);
      }
    }
  };

  // Step 1: Save Asaas Wallet ID
  const handleSaveWallet = async () => {
    const cleanId = walletId.trim();
    if (!cleanId) return;
    setLoading(true);
    setSaveStatus('');
    try {
      const { error } = await supabase
        .from('artists')
        .update({
          asaas_wallet_id: cleanId,
          asaas_account_status: 'pending_verification'
        })
        .eq('user_id', user.id);

      if (error) throw error;
      setWalletSaved(true);
      setSaveStatus('Sucesso');
      if (refreshProfile) refreshProfile();
      setTimeout(() => {
        setSaveStatus('');
        handleNextStep();
      }, 1000);
    } catch (e) {
      console.error(e);
      setSaveStatus('Erro: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Handle image uploads
  const handleImageUpload = async (file, type) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${type}_${user.id}_${Date.now()}.${fileExt}`;
    try {
      const { error: uploadErr } = await supabase.storage.from('media').upload(`avatars/${fileName}`, file);
      if (uploadErr) throw uploadErr;
      return supabase.storage.from('media').getPublicUrl(`avatars/${fileName}`).data.publicUrl;
    } catch (err) {
      console.warn('Storage upload fallback to base64:', err);
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
      });
    }
  };

  const openCrop = (file, type) => {
    const src = URL.createObjectURL(file);
    const aspectRatio = type === 'avatar' ? 1 : 1672 / 941;
    setCropState({ src, aspectRatio, type, fileName: file.name });
  };

  const handleCropConfirm = async (blob) => {
    if (!cropState) return;
    const { type, fileName } = cropState;
    setCropState(null);

    const ext = fileName.split('.').pop() || 'jpg';
    const croppedFile = new File([blob], `${type}_cropped_${Date.now()}.${ext}`, { type: 'image/jpeg' });

    setSaveStatus(type === 'avatar' ? 'Salvando foto...' : 'Salvando capa...');
    try {
      const url = await handleImageUpload(croppedFile, type);
      
      const updateField = type === 'avatar' ? { photo_url: url } : { cover_url: url };
      const { error } = await supabase
        .from('artists')
        .update(updateField)
        .eq('user_id', user.id);

      if (error) throw error;

      if (type === 'avatar') {
        setProfilePhoto(url);
      } else {
        setCoverPhoto(url);
      }
      setSaveStatus('Sucesso');
      if (refreshProfile) refreshProfile();
      setTimeout(() => setSaveStatus(''), 1500);
    } catch (e) {
      console.error(e);
      setSaveStatus('Erro ao enviar imagem.');
    }
  };

  // Step 3: Handle Presentation Video
  const handleVideoFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoFile(file);
      setVideoUrl(URL.createObjectURL(file));
    }
  };

  const handleSaveVideo = async () => {
    if (!videoUrl && !videoFile) return;
    setVideoUploading(true);
    setSaveStatus('');
    try {
      let finalVideoUrl = videoUrl;

      if (videoFile) {
        const fileExt = videoFile.name.split('.').pop();
        const fileName = `video_${user.id}_${Date.now()}.${fileExt}`;
        const { error: uploadErr } = await supabase.storage.from('media').upload(`videos/${fileName}`, videoFile);
        if (uploadErr) throw uploadErr;
        finalVideoUrl = supabase.storage.from('media').getPublicUrl(`videos/${fileName}`).data.publicUrl;
      }

      const { error } = await supabase
        .from('artists')
        .update({ presentation_video_url: finalVideoUrl })
        .eq('user_id', user.id);

      if (error) throw error;
      setVideoUrl(finalVideoUrl);
      setVideoFile(null);
      setSaveStatus('Sucesso');
      if (refreshProfile) refreshProfile();
      setTimeout(() => {
        setSaveStatus('');
        setCurrentStep(STEPS.REPERTOIRE);
      }, 1000);
    } catch (err) {
      console.error(err);
      setSaveStatus('Erro ao salvar vídeo.');
    } finally {
      setVideoUploading(false);
    }
  };

  // Step 4: Import Repertoire from TXT
  const handleImportTxt = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setSaveStatus('Processando arquivo...');

    const normalizeString = (str) => {
      if (!str) return '';
      return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // remove accents
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '') // remove all symbols and spaces
        .trim();
    };

    try {
      const text = await file.text();
      const lines = text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      if (lines.length === 0) {
        setSaveStatus('Erro: O arquivo TXT está vazio.');
        setLoading(false);
        return;
      }

      setSaveStatus(`Processando ${lines.length} músicas...`);

      // Fetch all existing songs from the database once to build a lookup map
      const { data: dbSongs, error: dbErr } = await supabase
        .from('musicas_repertorio')
        .select('id, titulo');

      if (dbErr) throw dbErr;

      const normalizedDbMap = new Map();
      (dbSongs || []).forEach(s => {
        const norm = normalizeString(s.titulo);
        if (norm && !normalizedDbMap.has(norm)) {
          normalizedDbMap.set(norm, s.id);
        }
      });

      const importedIds = [];

      for (const line of lines) {
        let titulo = '';
        let artistaNome = '';

        if (line.includes(' - ')) {
          const parts = line.split(' - ');
          titulo = parts[0].trim();
          artistaNome = parts.slice(1).join(' - ').trim();
        } else {
          titulo = line;
          artistaNome = 'Desconhecido';
        }

        const normTitle = normalizeString(titulo);

        if (normalizedDbMap.has(normTitle)) {
          // Found matching title: use the existing ID (regardless of composer/artist)
          const existingId = normalizedDbMap.get(normTitle);
          if (!importedIds.includes(existingId)) {
            importedIds.push(existingId);
          }
        } else {
          // Not found: insert new song
          const { data: newSong, error: insertErr } = await supabase
            .from('musicas_repertorio')
            .insert({ titulo, artista_nome: artistaNome })
            .select('id')
            .single();

          if (insertErr) {
            console.error('Erro ao inserir música:', insertErr);
            continue;
          }

          if (newSong?.id) {
            importedIds.push(newSong.id);
            // Cache in the map so duplicate titles in the same TXT are also grouped together
            normalizedDbMap.set(normTitle, newSong.id);
          }
        }
      }

      // Merge imported IDs with already selected ones
      setSelectedSongs(prev => {
        const merged = [...prev];
        for (const id of importedIds) {
          if (!merged.includes(id)) {
            merged.push(id);
          }
        }
        return merged;
      });

      // Refresh all songs list in UI so the newly added songs show up immediately
      const { data: updatedAllSongs } = await supabase
        .from('musicas_repertorio')
        .select('*');
      if (updatedAllSongs) {
        setAllSongs(updatedAllSongs);
      }

      setSaveStatus(`Sucesso! Importadas ${importedIds.length} músicas.`);
      setTimeout(() => setSaveStatus(''), 2500);

    } catch (err) {
      console.error('Erro ao importar arquivo TXT:', err);
      setSaveStatus('Erro ao ler ou processar o arquivo.');
    } finally {
      setLoading(false);
      e.target.value = ''; // Reset file input
    }
  };

  // Step 4: Repertoire Select Toggle
  const handleToggleSong = (songId) => {
    setSelectedSongs(prev => 
      prev.includes(songId)
        ? prev.filter(id => id !== songId)
        : [...prev, songId]
    );
  };

  const handleSaveRepertoire = async () => {
    setLoading(true);
    setSaveStatus('');
    try {
      const { error } = await supabase
        .from('artists')
        .update({ selected_musicas_ids: selectedSongs })
        .eq('user_id', user.id);

      if (error) throw error;
      setSaveStatus('Sucesso');
      if (refreshProfile) refreshProfile();

      // Complete verified flow if everything is set
      const isComplete = !!walletId && (!!profilePhoto || hasPhotos) && (selectedSongs.length > 0);
      if (isComplete) {
        await supabase.from('artists').update({ verified: true }).eq('user_id', user.id);
        if (refreshProfile) refreshProfile();
      }

      setTimeout(() => {
        setSaveStatus('');
        navigate('/artist/profile');
      }, 1500);
    } catch (e) {
      console.error(e);
      setSaveStatus('Erro ao salvar repertório.');
    } finally {
      setLoading(false);
    }
  };

  // Skip options helper
  const isWalletStepValid = walletSaved || walletId.trim().length > 0;

  return (
    <div className={`min-h-screen flex flex-col font-poppins relative overflow-hidden ${
      isDark ? 'bg-[#08041A] text-white' : 'bg-gray-50 text-gray-800'
    }`}>
      {/* Background Blurs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#7B2EFF]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#39FF6A]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 px-6 py-4 flex items-center justify-between border-b border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#7B2EFF] to-[#39FF6A] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Passo a Passo de Verificação
            </h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">TocaMais Artista</p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/artist/profile')}
          className={`p-2 rounded-xl text-xs font-bold transition-all ${
            isDark ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-white shadow-xs text-gray-600 hover:bg-gray-100'
          }`}
        >
          Sair do Tutorial
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 relative z-10 flex flex-col justify-center">
        
        {/* Stepper Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 right-0 h-0.5 bg-white/10 top-5 -translate-y-1/2 -z-10" />
            <div 
              className="absolute left-0 h-0.5 bg-gradient-to-r from-[#7B2EFF] to-[#39FF6A] top-5 -translate-y-1/2 -z-10 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
            
            {stepsList.map(({ step, icon: Icon, label }) => {
              const isActive = currentStep === step;
              const isCompleted = currentStep > step;
              return (
                <div key={step} className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 relative z-10 ${
                    isActive 
                      ? 'bg-gradient-to-tr from-[#7B2EFF] to-[#39FF6A] text-white scale-110 shadow-[0_0_15px_rgba(123,46,255,0.4)]'
                      : isCompleted
                        ? 'bg-[#39FF6A]/20 text-[#39FF6A] border border-[#39FF6A]/50'
                        : isDark ? 'bg-[#15112a] text-gray-600 border border-white/5' : 'bg-white text-gray-400 border border-gray-200'
                  }`}>
                    {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider mt-2 transition-colors duration-300 ${
                    isActive ? 'text-[#7B2EFF]' : 'text-gray-500'
                  }`}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Card View */}
        <div className={`p-6 rounded-3xl border shadow-xl flex-1 flex flex-col justify-between min-h-[420px] transition-all duration-300 ${
          isDark ? 'bg-[#100b26]/80 border-white/5 backdrop-blur-md' : 'bg-white border-gray-200'
        }`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col"
            >
              {/* STEP 1: ASAAS TUTORIAL */}
              {currentStep === STEPS.ASAAS && (
                <div className="space-y-4 flex-1">
                  <div className="text-center md:text-left">
                    <h2 className="text-lg font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                      Passo 1: Criar Conta Asaas e Conectar Wallet ID
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">
                      A conta Asaas é gratuita e obrigatória para receber gorjetas diretamente na sua conta.
                    </p>
                  </div>

                  <div className={`p-4 rounded-2xl border ${
                    isDark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-200'
                  } space-y-3`}>
                    <p className="text-xs font-semibold flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#7B2EFF] text-white flex items-center justify-center text-[10px] font-black">1</span>
                      Crie sua conta no Asaas gratuitamente:
                    </p>
                    <a
                      href="https://www.asaas.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7B2EFF] hover:underline bg-[#7B2EFF]/10 px-3 py-1.5 rounded-lg border border-[#7B2EFF]/20"
                    >
                      Criar conta em asaas.com
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <div className="pt-2 border-t border-white/5 space-y-3">
                      <p className="text-xs font-semibold flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#7B2EFF] text-white flex items-center justify-center text-[10px] font-black">2</span>
                        Como obter seu Wallet ID:
                      </p>
                      <p className="text-[11px] text-gray-400 leading-relaxed pl-7">
                        Acesse sua conta Asaas. Clique no seu ícone de perfil no canto superior direito e escolha a opção <strong>Integrações</strong>.
                      </p>
                      <div className="pl-7">
                        <img 
                          src={asaasStep1} 
                          alt="Tutorial Asaas - Menu Integrações" 
                          className="rounded-xl border border-white/10 max-h-52 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setFullscreenImage({ src: asaasStep1, alt: "Tutorial Asaas - Menu Integrações" })}
                        />
                      </div>

                      <p className="text-[11px] text-gray-400 leading-relaxed pl-7 pt-2">
                        Na página de Integrações, copie o código <strong>Wallet ID</strong> localizado no rodapé da página (o código sempre começa com <code className="text-[#39FF6A] font-mono">wal_</code>).
                      </p>
                      <div className="pl-7">
                        <img 
                          src={asaasStep2} 
                          alt="Tutorial Asaas - Copiar Wallet ID" 
                          className="rounded-xl border border-white/10 max-h-48 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setFullscreenImage({ src: asaasStep2, alt: "Tutorial Asaas - Copiar Wallet ID" })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Insira o seu Wallet ID</label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={walletId}
                        onChange={e => setWalletId(e.target.value)}
                        placeholder="Ex: wal_xxxxxxxxxxxxxxxx"
                        className={`flex-1 p-3 rounded-xl border text-xs outline-none font-mono ${
                          isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-gray-600' : 'bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400'
                        }`}
                      />
                      <button
                        onClick={handleSaveWallet}
                        disabled={loading || !walletId.trim()}
                        className="py-3 px-6 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#7B2EFF] to-[#39FF6A] hover:shadow-[0_0_15px_rgba(123,46,255,0.3)] transition-all flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        Conectar
                      </button>
                    </div>
                    {walletSaved && (
                      <p className="text-[10px] text-[#39FF6A] font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        ✓ Conta Asaas conectada e ativa com sucesso!
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 2: PROFILE & COVER PHOTOS */}
              {currentStep === STEPS.PHOTOS && (
                <div className="space-y-6 flex-1 flex flex-col justify-center">
                  <div className="text-center">
                    <h2 className="text-lg font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                      Passo 2: Adicionar Foto de Capa e Perfil
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">
                      Envie imagens de boa qualidade para tornar seu perfil profissional e atraente aos contratantes.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Profile Avatar Card */}
                    <div className={`p-4 rounded-2xl border flex flex-col items-center justify-between text-center ${
                      isDark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider">Foto do Perfil</h3>
                        <p className="text-[10px] text-gray-400 mt-1">Recomendado: Proporção 1:1 quadrada.</p>
                      </div>

                      <div className="my-4 relative">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/10 bg-black/40 flex items-center justify-center">
                          {profilePhoto ? (
                            <img src={profilePhoto} alt="Foto de perfil" className="w-full h-full object-cover" />
                          ) : (
                            <Camera className="w-8 h-8 text-gray-600" />
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => document.getElementById('avatar-upload-onboarding')?.click()}
                        className="py-2 px-4 rounded-xl border border-white/10 text-xs font-bold hover:bg-white/5 transition-all flex items-center gap-2"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Escolher Foto
                      </button>
                      <input 
                        id="avatar-upload-onboarding" 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) openCrop(file, 'avatar');
                        }}
                      />
                    </div>

                    {/* Cover Banner Card */}
                    <div className={`p-4 rounded-2xl border flex flex-col items-center justify-between text-center ${
                      isDark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider">Imagem de Capa</h3>
                        <p className="text-[10px] text-gray-400 mt-1">Recomendado: Proporção 16:9 retangular.</p>
                      </div>

                      <div className="my-4 w-full h-24 rounded-xl overflow-hidden border border-white/10 bg-black/40 flex items-center justify-center relative">
                        {coverPhoto ? (
                          <img src={coverPhoto} alt="Capa" className="w-full h-full object-cover" />
                        ) : (
                          <Camera className="w-8 h-8 text-gray-600" />
                        )}
                      </div>

                      <button
                        onClick={() => document.getElementById('cover-upload-onboarding')?.click()}
                        className="py-2 px-4 rounded-xl border border-white/10 text-xs font-bold hover:bg-white/5 transition-all flex items-center gap-2"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Escolher Capa
                      </button>
                      <input 
                        id="cover-upload-onboarding" 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) openCrop(file, 'cover');
                        }}
                      />
                    </div>
                  </div>

                  {saveStatus && (
                    <p className={`text-center text-xs font-semibold ${saveStatus.startsWith('Erro') ? 'text-red-400' : 'text-[#39FF6A]'}`}>
                      {saveStatus}
                    </p>
                  )}
                </div>
              )}

              {/* STEP 3: PRESENTATION VIDEO */}
              {currentStep === STEPS.VIDEO && (
                <div className="space-y-5 flex-1 flex flex-col justify-center">
                  <div className="text-center">
                    <h2 className="text-lg font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                      Passo 3: Cadastrar Vídeo de Apresentação
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">
                      Adicione um vídeo curto demonstrando seu talento (tamanho recomendado: até 1 min, ou link do YouTube).
                    </p>
                  </div>

                  <div className={`p-4 rounded-2xl border ${
                    isDark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-200'
                  } space-y-4`}>
                    
                    {/* Device Upload option */}
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Selecione um arquivo de vídeo</label>
                      <input 
                        type="file" 
                        accept="video/*" 
                        onChange={handleVideoFileChange}
                        className={`w-full p-2 text-xs rounded-xl border ${
                          isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'
                        }`}
                      />
                      {videoFile && (
                        <p className="text-[10px] text-[#39FF6A] font-bold mt-1">Vídeo selecionado: {videoFile.name}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-px bg-white/10" />
                      <span className="text-[10px] text-gray-500 font-bold uppercase">ou</span>
                      <div className="flex-1 h-px bg-white/10" />
                    </div>

                    {/* YouTube/Vimeo Link option */}
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">URL de Vídeo (YouTube, Vimeo, etc.)</label>
                      <input 
                        type="text" 
                        value={videoUrl}
                        onChange={e => {
                          setVideoUrl(e.target.value);
                          setVideoFile(null);
                        }}
                        disabled={!!videoFile}
                        placeholder="Ex: https://www.youtube.com/watch?v=..."
                        className={`w-full p-3 rounded-xl border text-xs outline-none ${
                          videoFile ? 'opacity-50' : ''
                        } ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'}`}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveVideo}
                      disabled={videoUploading || (!videoUrl && !videoFile)}
                      className="flex-1 py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#7B2EFF] to-[#39FF6A] hover:shadow-[0_0_15px_rgba(123,46,255,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {videoUploading ? <Loader className="w-4 h-4 animate-spin" /> : null}
                      Salvar Vídeo
                    </button>

                    <button
                      onClick={() => {
                        setVideoUrl('');
                        setVideoFile(null);
                        setCurrentStep(STEPS.REPERTOIRE);
                      }}
                      className={`py-3 px-6 rounded-xl font-bold text-xs transition-all ${
                        isDark ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Ainda Não Possuo / Pular
                    </button>
                  </div>

                  {saveStatus && (
                    <p className={`text-center text-xs font-semibold ${saveStatus.startsWith('Erro') ? 'text-red-400' : 'text-[#39FF6A]'}`}>
                      {saveStatus}
                    </p>
                  )}
                </div>
              )}

              {/* STEP 4: REPERTOIRE SELECTION */}
              {currentStep === STEPS.REPERTOIRE && (
                <div className="space-y-4 flex-1 flex flex-col">
                  <div className="text-center">
                    <h2 className="text-lg font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                      Passo 4: Escolher Repertório do Show
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">
                      Selecione as músicas do repertório de seu show para que fãs e contratantes as vejam e possam fazer pedidos.
                    </p>
                  </div>

                  {/* TXT File Import */}
                  <div className={`p-4 rounded-2xl border ${
                    isDark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-200'
                  } space-y-3`}>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wider">Importar via Arquivo TXT</p>
                      <label className="py-1.5 px-3 rounded-lg border border-[#7B2EFF] text-[#7B2EFF] hover:bg-[#7B2EFF]/10 text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
                        Escolher Arquivo TXT
                        <input
                          type="file"
                          accept=".txt"
                          onChange={handleImportTxt}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <p className="text-[10px] text-gray-400 leading-normal">
                      O arquivo deve conter uma música por linha. Formato recomendado: <code className="text-[#39FF6A] font-mono">Nome da Música - Nome do Artista</code>
                    </p>
                  </div>

                  {/* Repertoire Search bar */}
                  <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${
                    isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <Search className="w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      value={searchSong} 
                      onChange={e => setSearchSong(e.target.value)}
                      placeholder="Pesquisar música por título ou artista..."
                      className={`flex-1 bg-transparent text-xs outline-none ${isDark ? 'text-white' : 'text-gray-800'}`}
                    />
                  </div>

                  {/* Songs list */}
                  <div className="flex-1 overflow-y-auto max-h-52 space-y-2 pr-1">
                    {allSongs
                      .filter(song => 
                        !searchSong || 
                        song.titulo?.toLowerCase().includes(searchSong.toLowerCase()) || 
                        song.artista_nome?.toLowerCase().includes(searchSong.toLowerCase())
                      )
                      .map(song => {
                        const isSelected = selectedSongs.includes(song.id);
                        return (
                          <div 
                            key={song.id} 
                            onClick={() => handleToggleSong(song.id)}
                            className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                              isSelected 
                                ? 'bg-[#7B2EFF]/15 border-[#7B2EFF]' 
                                : isDark ? 'bg-white/5 border-white/5 hover:border-white/20' : 'bg-white border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div>
                              <p className="text-xs font-bold">{song.titulo}</p>
                              <p className="text-[10px] text-gray-400">{song.artista_nome}</p>
                            </div>
                            <div className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all ${
                              isSelected ? 'bg-[#39FF6A] border-[#39FF6A] text-black' : 'border-gray-500'
                            }`}>
                              {isSelected && <Check className="w-3.5 h-3.5 font-bold" />}
                            </div>
                          </div>
                        );
                      })}
                    {allSongs.length === 0 && (
                      <p className="text-center text-xs text-gray-500 py-6">Carregando lista de músicas...</p>
                    )}
                  </div>

                  <p className="text-[10px] text-center text-gray-400">
                    {selectedSongs.length} músicas selecionadas.
                  </p>

                  <button
                    onClick={handleSaveRepertoire}
                    disabled={loading || selectedSongs.length === 0}
                    className="w-full py-3.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#7B2EFF] to-[#39FF6A] hover:shadow-[0_0_15px_rgba(123,46,255,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? <Loader className="w-4 h-4 animate-spin" /> : null}
                    Concluir Onboarding
                  </button>

                  {saveStatus && (
                    <p className={`text-center text-xs font-semibold ${saveStatus.startsWith('Erro') ? 'text-red-400' : 'text-[#39FF6A]'}`}>
                      {saveStatus}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Stepper Control Buttons */}
          <div className="flex justify-between items-center pt-4 border-t border-white/5 mt-4">
            <button
              onClick={handlePrevStep}
              disabled={activeStepIndex === 0}
              className={`py-2.5 px-4 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-30 ${
                isDark ? 'text-white bg-white/5 hover:bg-white/10' : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Anterior
            </button>

            {currentStep !== STEPS.REPERTOIRE && (
              <button
                onClick={handleNextStep}
                disabled={currentStep === STEPS.ASAAS ? !isWalletStepValid : false}
                className="py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-[#7B2EFF] hover:bg-[#7B2EFF]/90 flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                Próximo
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Image Crop Modal */}
      {cropState && (
        <ImageCropModal
          imageSrc={cropState.src}
          aspectRatio={cropState.aspectRatio}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropState(null)}
        />
      )}

      {/* Lightbox / Fullscreen Image Viewer Modal */}
      {fullscreenImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setFullscreenImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
            <button 
              className="absolute top-4 right-4 p-2.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors z-50 cursor-pointer"
              onClick={() => setFullscreenImage(null)}
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={fullscreenImage.src} 
              alt={fullscreenImage.alt} 
              className="max-w-full max-h-[85vh] rounded-2xl object-contain border border-white/10 shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
