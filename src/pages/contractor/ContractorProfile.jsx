import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Edit3, Star, Calendar, DollarSign, Sun, Moon, X, Camera } from 'lucide-react';
import AppLayout from '../../components/shared/AppLayout';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import NeonButton from '../../components/ui/NeonButton';
import { useTheme } from '../../lib/ThemeContext';
import { useNavigate } from 'react-router-dom';

const AVATAR_FALLBACK = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop';

export default function ContractorProfile() {
  const { user, userProfile, refreshProfile, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', city: '', address: '' });
  const [saveStatus, setSaveStatus] = useState('');

  const isDark = theme === 'dark';
  const preferences = userProfile?.preferences || {};

  const handleImageUpload = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `contractor_${user.id}_${Date.now()}.${fileExt}`;
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

  const saveField = async (field, value) => {
    if (!user || !userProfile) return;
    setSaveStatus('Salvando...');
    try {
      if (field === 'name' || field === 'address') {
        const newPrefs = { ...preferences, [field]: value };
        await supabase.from('contractors').update({ preferences: newPrefs }).eq('user_id', user.id);
      } else if (field === 'phone') {
        await supabase.from('contractors').update({ phone: value }).eq('user_id', user.id);
      } else if (field === 'city') {
        const newPrefs = { ...preferences, city: value };
        await supabase.from('contractors').update({ preferences: newPrefs }).eq('user_id', user.id);
      } else if (field === 'photo_url') {
        const newPrefs = { ...preferences, photo_url: value };
        await supabase.from('contractors').update({ preferences: newPrefs }).eq('user_id', user.id);
      }
      if (refreshProfile) refreshProfile();
      setSaveStatus('');
    } catch (err) {
      console.error(`Erro ao salvar ${field}:`, err);
      setSaveStatus(`Erro: ${err.message || 'desconhecido'}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const openEditor = () => {
    setEditForm({
      name: preferences?.name || user?.user_metadata?.name || user?.name || '',
      phone: userProfile?.phone || '',
      city: preferences?.city || '',
      address: preferences?.address || ''
    });
    setIsEditing(true);
  };

  const closeEditor = () => {
    setIsEditing(false);
    setSaveStatus('');
  };

  const handleSave = async () => {
    const currentName = preferences?.name || user?.user_metadata?.name || user?.name || '';
    if (editForm.name !== currentName) await saveField('name', editForm.name);
    if (editForm.phone !== (userProfile?.phone || '')) await saveField('phone', editForm.phone);
    if (editForm.city !== (preferences?.city || '')) await saveField('city', editForm.city);
    if (editForm.address !== (preferences?.address || '')) await saveField('address', editForm.address);
    setIsEditing(false);
  };

  const displayName = preferences?.name || user?.user_metadata?.name || user?.name || 'Contratante';
  const displayPhone = userProfile?.phone || '—';
  const displayCity = preferences?.city || 'Local não definido';
  const displayAddress = preferences?.address || '';

  const photoUrl = preferences?.photo_url || user?.avatar_url || '';

  if (isEditing) {
    return (
      <AppLayout role="contractor" userName={displayName}>
        <div className="px-4 py-5 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className={`font-black text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>Editar Perfil</h2>
            <button type="button" onClick={closeEditor} className="p-2 rounded-xl bg-white/10">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className={`border rounded-2xl p-4 space-y-4 ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-200 shadow-xs'}`}>
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
                    const url = await handleImageUpload(file);
                    setSaveStatus('Salvando...');
                    await saveField('photo_url', url);
                    setSaveStatus('');
                  } catch (err) {
                    setSaveStatus('Erro no upload: ' + (err.message || err));
                  }
                }}
                className="w-full text-xs text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-neon-purple file:text-white hover:file:opacity-90 cursor-pointer"
              />
              <img src={photoUrl} alt="Preview" className="w-16 h-16 rounded-xl object-cover mt-2 border border-white/10"
                onError={e => e.target.style.display = 'none'}
              />
            </div>

            {[
              { label: 'Nome', key: 'name', type: 'text' },
              { label: 'Telefone', key: 'phone', type: 'text' },
              { label: 'Endereço', key: 'address', type: 'text' },
              { label: 'Cidade', key: 'city', type: 'text' },
            ].map(field => (
              <div key={field.key}>
                <label className={`text-xs font-bold uppercase tracking-wider mb-1 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{field.label}</label>
                <input
                  type={field.type}
                  value={editForm[field.key]}
                  onChange={e => setEditForm({ ...editForm, [field.key]: e.target.value })}
                  className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition ${
                    isDark ? 'bg-white/5 border-white/10 text-white focus:border-neon-purple' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-neon-purple'
                  }`}
                />
              </div>
            ))}
          </div>

          {saveStatus && <p className="text-xs text-center text-gray-400">{saveStatus}</p>}

          <NeonButton variant="gradient" size="lg" className="w-full" onClick={handleSave}>
            Salvar
          </NeonButton>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout role="contractor" userName={displayName}>
      <div className="px-4 py-5 space-y-5">
        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-3xl text-center relative overflow-hidden"
          style={{ 
            background: isDark 
              ? 'linear-gradient(135deg, rgba(123,46,255,0.2), rgba(57,255,106,0.1))' 
              : 'linear-gradient(135deg, rgba(123,46,255,0.08), rgba(57,255,106,0.05))',
            border: isDark ? '1px solid rgba(123,46,255,0.3)' : '1px solid rgba(123,46,255,0.15)'
          }}
        >
          <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto mb-3 border-2 border-neon-purple/50 relative"
            style={{ boxShadow: '0 0 25px rgba(123,46,255,0.4)' }}>
            <img src={photoUrl || AVATAR_FALLBACK} alt="Avatar" className="w-full h-full object-cover" />
            <button type="button" onClick={openEditor}
              className="absolute inset-0 w-full h-full bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
              <Camera className="w-6 h-6 text-white" />
            </button>
          </div>
          <h2 className={`font-black text-xl ${isDark ? 'text-white' : 'text-gray-900'}`}>{displayName}</h2>
          <p className="text-gray-400 text-sm mt-0.5">Contratante Particular</p>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <MapPin className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-400 text-xs">{displayCity === 'Local não definido' && displayAddress ? displayAddress : displayCity}</span>
          </div>
          <button type="button" onClick={openEditor}
            className={`absolute top-4 right-4 p-2 rounded-xl ${isDark ? 'bg-white/10' : 'bg-gray-100 border border-gray-200'}`}>
            <Edit3 className="w-4 h-4 text-gray-400" />
          </button>
        </motion.div>

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
              <span>Modo Claro</span>
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

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Contratações', value: '0', icon: Calendar },
            { label: 'Avaliações dadas', value: '0', icon: Star },
            { label: 'Total gasto', value: 'R$ 0', icon: DollarSign },
          ].map(({ label, value, icon: Icon }, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className={`p-3 rounded-2xl border text-center ${
                isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-200'
              }`}>
              <Icon className="w-5 h-5 text-neon-purple mx-auto mb-1" />
              <p className={`font-bold text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</p>
              <p className="text-gray-500 text-[10px]">{label}</p>
            </motion.div>
          ))}
        </div>

        {/* Info */}
        <div className={`border rounded-2xl p-4 space-y-4 ${
          isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-200 shadow-xs'
        }`}>
          <h3 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>Informações</h3>
          {[
            { label: 'Nome', value: displayName },
            { label: 'Email', value: user?.email || '—' },
            { label: 'Telefone', value: displayPhone },
            ...(displayAddress ? [{ label: 'Endereço', value: displayAddress }] : []),
            { label: 'Cidade', value: displayCity },
          ].map((field, i) => (
            <div key={i} className={`flex items-center justify-between py-2 border-b last:border-0 ${
              isDark ? 'border-white/5' : 'border-gray-100'
            }`}>
              <span className="text-gray-400 text-sm">{field.label}</span>
              <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{field.value}</span>
            </div>
          ))}
        </div>

        <NeonButton variant="gradient" size="lg" className="w-full" onClick={openEditor}>
          Editar Perfil
        </NeonButton>

        <NeonButton variant="ghost" size="lg" className="w-full text-red-400 border-red-400/30 hover:bg-red-500/10" onClick={handleLogout}>
          Sair da conta
        </NeonButton>
      </div>
    </AppLayout>
  );
}
