import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, MapPin, Users, FileText, Camera, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/AuthContext';
import NeonButton from '../../components/ui/NeonButton';

const STEPS = [
  { id: 'identity', label: 'Identidade', icon: Building2 },
  { id: 'details',  label: 'Detalhes',   icon: Users },
  { id: 'photo',    label: 'Foto',        icon: Camera },
  { id: 'done',     label: 'Pronto',      icon: Check },
];

const inputClass = 'w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-neon-purple/50 transition-all placeholder:text-gray-600';
const labelClass = 'text-xs text-gray-400 font-bold block mb-1.5 uppercase tracking-wider';

export default function VenueOnboarding() {
  const { user, userProfile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    venue_name: userProfile?.venue_name || '',
    city:       userProfile?.city       || '',
    address:    userProfile?.address    || '',
    capacity:   userProfile?.capacity   || '',
    bio:        userProfile?.bio        || '',
    logo_url:   userProfile?.logo_url   || '',
  });

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const saveStep = async () => {
    setError('');
    setSaving(true);
    try {
      if (step === 0) {
        if (!form.venue_name.trim()) { setError('Nome do estabelecimento é obrigatório.'); setSaving(false); return; }
        if (!form.city.trim())       { setError('Cidade é obrigatória.');                 setSaving(false); return; }
        await supabase.from('venues').update({
          venue_name: form.venue_name.trim(),
          city:       form.city.trim(),
          address:    form.address.trim(),
        }).eq('user_id', user.id);
      } else if (step === 1) {
        await supabase.from('venues').update({
          capacity: form.capacity ? Number(form.capacity) : null,
          bio:      form.bio.trim(),
        }).eq('user_id', user.id);
      }
      setStep(s => s + 1);
    } catch (err) {
      setError('Erro ao salvar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    setError('');
    try {
      const ext = file.name.split('.').pop();
      const fileName = `venue_${user.id}_${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('media').upload(`logos/${fileName}`, file);
      if (uploadErr) throw uploadErr;
      const publicUrl = supabase.storage.from('media').getPublicUrl(`logos/${fileName}`).data.publicUrl;
      await supabase.from('venues').update({ logo_url: publicUrl }).eq('user_id', user.id);
      setForm(f => ({ ...f, logo_url: publicUrl }));
    } catch (err) {
      setError('Erro ao enviar foto: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const finish = async () => {
    setSaving(true);
    try {
      await supabase.from('venues').update({ onboarding_completed: true }).eq('user_id', user.id);
      if (refreshProfile) await refreshProfile();
      navigate('/venue');
    } catch (err) {
      setError('Erro ao finalizar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const stepContent = [
    // Step 0 — Identidade
    <motion.div key="identity" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
      <div>
        <h2 className="text-2xl font-black text-white">Qual é o nome do seu estabelecimento?</h2>
        <p className="text-gray-400 text-sm mt-1">Artistas e contratantes vão ver esse nome na plataforma.</p>
      </div>
      <div>
        <label className={labelClass}>Nome do estabelecimento *</label>
        <input type="text" value={form.venue_name} onChange={set('venue_name')} placeholder="Ex: Bar do Zé, Casa de Shows Aurora..." className={inputClass} autoFocus />
      </div>
      <div>
        <label className={labelClass}>Cidade *</label>
        <input type="text" value={form.city} onChange={set('city')} placeholder="Ex: São Paulo" className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Endereço</label>
        <input type="text" value={form.address} onChange={set('address')} placeholder="Ex: Rua das Flores, 123 — Pinheiros" className={inputClass} />
      </div>
    </motion.div>,

    // Step 1 — Detalhes
    <motion.div key="details" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
      <div>
        <h2 className="text-2xl font-black text-white">Sobre o seu espaço</h2>
        <p className="text-gray-400 text-sm mt-1">Essas informações ajudam o artista a se preparar para o show.</p>
      </div>
      <div>
        <label className={labelClass}>Capacidade (pessoas)</label>
        <input type="number" value={form.capacity} onChange={set('capacity')} placeholder="Ex: 150" className={inputClass} min="1" />
      </div>
      <div>
        <label className={labelClass}>Sobre o estabelecimento</label>
        <textarea value={form.bio} onChange={set('bio')} placeholder="Conte um pouco sobre o espaço, estilo musical, horário de funcionamento..." rows={4} className={`${inputClass} resize-none`} />
      </div>
    </motion.div>,

    // Step 2 — Foto
    <motion.div key="photo" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
      <div>
        <h2 className="text-2xl font-black text-white">Adicione uma foto ou logo</h2>
        <p className="text-gray-400 text-sm mt-1">Opcional — você pode adicionar depois no seu perfil.</p>
      </div>
      <div className="flex flex-col items-center gap-4">
        {form.logo_url ? (
          <img src={form.logo_url} alt="Logo" className="w-28 h-28 rounded-2xl object-cover border-2 border-neon-purple/30" />
        ) : (
          <div className="w-28 h-28 rounded-2xl bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center">
            <Camera className="w-10 h-10 text-gray-600" />
          </div>
        )}
        <label className="cursor-pointer px-5 py-2.5 rounded-xl bg-neon-purple text-white text-sm font-bold hover:opacity-90 transition-all">
          {saving ? 'Enviando...' : 'Escolher imagem'}
          <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={saving} />
        </label>
        {error && <p className="text-red-400 text-xs">{error}</p>}
      </div>
    </motion.div>,

    // Step 3 — Done
    <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6 text-center">
      <div className="w-20 h-20 rounded-full bg-neon-green/20 flex items-center justify-center mx-auto">
        <Check className="w-10 h-10 text-neon-green" />
      </div>
      <div>
        <h2 className="text-2xl font-black text-white">Tudo pronto, {form.venue_name || 'estabelecimento'}!</h2>
        <p className="text-gray-400 text-sm mt-2">Seu perfil está configurado. Você pode editar qualquer informação a qualquer momento no seu perfil.</p>
      </div>
      <div className="space-y-2 text-left p-4 rounded-2xl bg-white/5 border border-white/5">
        {[
          { label: 'Nome', value: form.venue_name },
          { label: 'Cidade', value: form.city },
          { label: 'Capacidade', value: form.capacity ? `${form.capacity} pessoas` : '—' },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-gray-500">{label}</span>
            <span className="text-white font-semibold">{value || '—'}</span>
          </div>
        ))}
      </div>
    </motion.div>,
  ];

  return (
    <div className="min-h-screen bg-[#08041A] text-white flex flex-col font-poppins">
      {/* Fixed glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon-green/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center px-4 py-10 flex-1">
        {/* Logo / brand */}
        <div className="mb-8 text-center">
          <p className="text-xs text-neon-green font-bold uppercase tracking-widest mb-1">Toca Mais</p>
          <p className="text-gray-500 text-xs">Configuração inicial do estabelecimento</p>
        </div>

        {/* Progress */}
        <div className="w-full max-w-sm mb-8">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const done = i < step;
              const active = i === step;
              return (
                <div key={s.id} className="flex flex-col items-center gap-1">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    done   ? 'bg-neon-green text-white' :
                    active ? 'bg-neon-purple text-white shadow-[0_0_15px_rgba(123,46,255,0.5)]' :
                             'bg-white/5 text-gray-600'
                  }`}>
                    {done ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={`text-[10px] font-bold ${active ? 'text-white' : 'text-gray-600'}`}>{s.label}</span>
                </div>
              );
            })}
          </div>
          <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-neon-purple to-neon-green rounded-full"
              animate={{ width: `${(step / (STEPS.length - 1)) * 100}%` }} transition={{ duration: 0.4 }} />
          </div>
        </div>

        {/* Content */}
        <div className="w-full max-w-sm flex-1">
          <AnimatePresence mode="wait">
            {stepContent[step]}
          </AnimatePresence>

          {error && step !== 2 && (
            <p className="text-red-400 text-xs mt-3 text-center">{error}</p>
          )}
        </div>

        {/* Navigation */}
        <div className="w-full max-w-sm mt-8 space-y-3">
          {step < STEPS.length - 1 ? (
            <>
              <NeonButton variant="gradient" size="lg" className="w-full flex items-center justify-center gap-2"
                onClick={step === 2 ? () => setStep(s => s + 1) : saveStep}
                disabled={saving}>
                {saving ? 'Salvando...' : step === 2 ? 'Continuar' : 'Salvar e continuar'}
                <ChevronRight className="w-4 h-4" />
              </NeonButton>
              {step === 2 && (
                <button onClick={() => setStep(s => s + 1)} className="w-full text-center text-gray-500 text-sm hover:text-gray-300 transition-all">
                  Pular por agora
                </button>
              )}
            </>
          ) : (
            <NeonButton variant="gradient" size="lg" className="w-full flex items-center justify-center gap-2"
              onClick={finish} disabled={saving}>
              {saving ? 'Finalizando...' : 'Ir para o painel'}
              <ChevronRight className="w-4 h-4" />
            </NeonButton>
          )}

          {step > 0 && step < STEPS.length - 1 && (
            <button onClick={() => setStep(s => s - 1)}
              className="w-full flex items-center justify-center gap-1 text-gray-500 text-sm hover:text-gray-300 transition-all">
              <ChevronLeft className="w-4 h-4" /> Voltar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
