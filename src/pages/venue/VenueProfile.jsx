import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Edit3, Building2, Users, Calendar, DollarSign, X, Camera } from 'lucide-react';
import AppLayout from '../../components/shared/AppLayout';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { useTheme } from '../../lib/ThemeContext';

const LOGO_FALLBACK = 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=200&h=200&fit=crop';

export default function VenueProfile() {
  const { user, userProfile, refreshProfile, logout } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ venue_name: '', city: '', address: '', bio: '', capacity: '', logo_url: '' });
  const [saveStatus, setSaveStatus] = useState('');
  const [confirmedEvents, setConfirmedEvents] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!userProfile?.id) return;
      const { data } = await supabase
        .from('events')
        .select('artist_id, fee_proposed, fee_agreed')
        .eq('venue_id', userProfile.id)
        .eq('status', 'confirmed');
      if (data) setConfirmedEvents(data);
    };
    fetchStats();
  }, [userProfile?.id]);

  const totalShows = confirmedEvents.length;
  const totalInvested = confirmedEvents.reduce((sum, e) => sum + (e.fee_proposed || e.fee_agreed || 0), 0);
  const uniqueArtists = new Set(confirmedEvents.map(e => e.artist_id)).size;

  const openEdit = () => {
    setEditForm({
      venue_name: userProfile?.venue_name || '',
      city: userProfile?.city || '',
      address: userProfile?.address || '',
      bio: userProfile?.bio || '',
      capacity: userProfile?.capacity || '',
      logo_url: userProfile?.logo_url || '',
    });
    setIsEditing(true);
  };

  const saveField = async (field, value) => {
    if (!user) return;
    setSaveStatus('Salvando...');
    try {
      const { error } = await supabase.from('venues').update({ [field]: value }).eq('user_id', user.id);
      if (error) throw error;
      if (refreshProfile) refreshProfile();
      setSaveStatus('Salvo!');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (err) {
      setSaveStatus(`Erro: ${err.message || 'desconhecido'}`);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setSaveStatus('Enviando imagem...');
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `venue_${user.id}_${Date.now()}.${fileExt}`;
      const { error: uploadErr } = await supabase.storage.from('media').upload(`logos/${fileName}`, file);
      if (uploadErr) throw uploadErr;
      const publicUrl = supabase.storage.from('media').getPublicUrl(`logos/${fileName}`).data.publicUrl;
      setEditForm(f => ({ ...f, logo_url: publicUrl }));
      await saveField('logo_url', publicUrl);
    } catch (err) {
      setSaveStatus('Erro ao enviar logo');
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Tem certeza absoluta? Todos os dados do estabelecimento serão apagados permanentemente. Esta ação não pode ser desfeita.'
    );
    if (!confirmed) return;
    try {
      setSaveStatus('Excluindo conta...');
      await supabase.from('venues').delete().eq('user_id', user.id);
      await supabase.auth.signOut();
      logout?.();
    } catch (err) {
      setSaveStatus('Erro ao excluir conta');
    }
  };

  const inputClass = `w-full p-2.5 rounded-xl border text-sm outline-none transition-all focus:border-neon-purple/50 ${
    isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-gray-600'
           : 'bg-gray-50 border-gray-200 text-gray-800'
  }`;

  const stats = [
    { icon: Calendar, label: 'Shows realizados', value: totalShows },
    { icon: Users, label: 'Artistas contratados', value: uniqueArtists },
    { icon: DollarSign, label: 'Total investido', value: `R$ ${totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` },
    { icon: Building2, label: 'Capacidade', value: userProfile?.capacity ? `${userProfile.capacity} pessoas` : '—' },
  ];

  return (
    <AppLayout role="venue">
      <div className="max-w-xl mx-auto space-y-6 pb-10">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-black bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Perfil do Estabelecimento
          </h1>
          <p className="text-gray-400 text-xs mt-1">Informações visíveis para artistas e contratantes</p>
        </motion.div>

        {/* Avatar + info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className={`p-6 rounded-2xl border flex flex-col items-center gap-4 ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-200 shadow-sm'}`}
        >
          <div className="relative">
            <img
              src={userProfile?.logo_url || LOGO_FALLBACK}
              alt="Logo"
              onError={e => { e.target.src = LOGO_FALLBACK; }}
              className="w-24 h-24 rounded-2xl object-cover border-2 border-neon-purple/30"
            />
            {isEditing && (
              <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-neon-purple rounded-xl flex items-center justify-center cursor-pointer shadow-lg">
                <Camera className="w-4 h-4 text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </label>
            )}
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-white">{userProfile?.venue_name || 'Estabelecimento'}</h2>
            {userProfile?.city && (
              <div className="flex items-center justify-center gap-1 text-gray-400 text-xs mt-1">
                <MapPin className="w-3 h-3" />
                <span>{userProfile.city}</span>
              </div>
            )}
            {userProfile?.bio && <p className="text-gray-400 text-xs mt-2 leading-relaxed">{userProfile.bio}</p>}
          </div>
          <button
            onClick={openEdit}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all text-gray-300"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Editar Perfil
          </button>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map(({ icon: Icon, label, value }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}
              className={`p-4 rounded-2xl border ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-200 shadow-sm'}`}
            >
              <Icon className="w-4 h-4 text-neon-purple mb-1" />
              <p className="text-lg font-bold text-white">{value}</p>
              <p className="text-gray-400 text-xs">{label}</p>
            </motion.div>
          ))}
        </div>

        {/* Edit form */}
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className={`p-5 rounded-2xl border space-y-4 ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-200 shadow-sm'}`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Editar Perfil</h3>
              <button onClick={() => setIsEditing(false)} className="p-1 rounded bg-white/5 hover:bg-white/10">
                <X className="w-4 h-4" />
              </button>
            </div>

            {[
              { label: 'Nome do Estabelecimento', field: 'venue_name', type: 'text' },
              { label: 'Cidade', field: 'city', type: 'text' },
              { label: 'Endereço', field: 'address', type: 'text' },
              { label: 'Capacidade (pessoas)', field: 'capacity', type: 'number' },
            ].map(({ label, field, type }) => (
              <div key={field}>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">{label}</label>
                <input
                  type={type}
                  value={editForm[field]}
                  onChange={e => setEditForm(f => ({ ...f, [field]: e.target.value }))}
                  onBlur={e => saveField(field, type === 'number' ? Number(e.target.value) : e.target.value)}
                  className={inputClass}
                />
              </div>
            ))}

            <div>
              <label className="text-[10px] text-gray-400 font-bold block mb-1">Sobre (Bio)</label>
              <textarea
                value={editForm.bio}
                onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
                onBlur={e => saveField('bio', e.target.value)}
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </div>

            {saveStatus && (
              <p className={`text-[10px] font-bold text-center ${saveStatus.startsWith('Erro') ? 'text-red-400' : 'text-neon-green'}`}>
                {saveStatus}
              </p>
            )}
          </motion.div>
        )}

        {/* Danger zone */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="p-4 rounded-2xl border border-red-500/20 bg-red-500/5 space-y-2"
        >
          <span className="text-[10px] text-red-500 font-bold block">Zona de Perigo</span>
          <p className="text-[10px] text-gray-400">
            Excluir a conta remove permanentemente todos os dados do estabelecimento e histórico de shows.
          </p>
          <button
            onClick={handleDeleteAccount}
            className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all"
          >
            Excluir conta
          </button>
        </motion.div>

      </div>
    </AppLayout>
  );
}
