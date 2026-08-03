import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, MapPin, Tag, Check, ChevronRight, ChevronLeft } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/AuthContext';
import NeonButton from '../../components/ui/NeonButton';

const STEPS = [
  { id: 'identity',     label: 'Identidade',   icon: User },
  { id: 'preferences',  label: 'Preferências', icon: Tag },
  { id: 'done',         label: 'Pronto',        icon: Check },
];

const EVENT_TYPES = [
  { id: 'wedding',   label: 'Casamento' },
  { id: 'birthday',  label: 'Aniversário' },
  { id: 'corporate', label: 'Corporativo' },
  { id: 'bbq',       label: 'Churrasco' },
  { id: 'private',   label: 'Festa Privada' },
  { id: 'luxury',    label: 'Evento Luxo' },
];

const BUDGET_RANGES = [
  { id: 'low',    label: 'Até R$ 1.000' },
  { id: 'mid',    label: 'R$ 1.000 – R$ 5.000' },
  { id: 'high',   label: 'R$ 5.000 – R$ 15.000' },
  { id: 'luxury', label: 'Acima de R$ 15.000' },
];

const inputClass = 'w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-neon-purple/50 transition-all placeholder:text-gray-600';
const labelClass = 'text-xs text-gray-400 font-bold block mb-1.5 uppercase tracking-wider';

export default function ContractorOnboarding() {
  const { user, userProfile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const prefs = userProfile?.preferences || {};
  const [form, setForm] = useState({
    name:           prefs.name    || '',
    phone:          userProfile?.phone || '',
    city:           prefs.city    || '',
    address:        prefs.address || '',
    eventTypes:     prefs.eventTypes || [],
    budgetRange:    prefs.budgetRange || '',
  });

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const toggleEventType = (id) => {
    setForm(f => ({
      ...f,
      eventTypes: f.eventTypes.includes(id)
        ? f.eventTypes.filter(t => t !== id)
        : [...f.eventTypes, id],
    }));
  };

  const saveStep = async () => {
    setError('');
    setSaving(true);
    try {
      if (step === 0) {
        if (!form.name.trim())  { setError('Nome é obrigatório.');   setSaving(false); return; }
        if (!form.phone.trim()) { setError('Telefone é obrigatório.'); setSaving(false); return; }
        if (!form.city.trim())  { setError('Cidade é obrigatória.');  setSaving(false); return; }

        const existingPrefs = userProfile?.preferences || {};
        await supabase.from('contractors').update({
          phone: form.phone.trim(),
          preferences: {
            ...existingPrefs,
            name:    form.name.trim(),
            city:    form.city.trim(),
            address: form.address.trim(),
          },
        }).eq('user_id', user.id);
      } else if (step === 1) {
        const existingPrefs = userProfile?.preferences || {};
        await supabase.from('contractors').update({
          preferences: {
            ...existingPrefs,
            eventTypes:  form.eventTypes,
            budgetRange: form.budgetRange,
          },
        }).eq('user_id', user.id);
      }
      setStep(s => s + 1);
    } catch (err) {
      setError('Erro ao salvar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const finish = async () => {
    setSaving(true);
    try {
      await supabase.from('contractors').update({ onboarding_completed: true }).eq('user_id', user.id);
      if (refreshProfile) await refreshProfile();
      navigate('/contractor');
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
        <h2 className="text-2xl font-black text-white">Quem vai contratar?</h2>
        <p className="text-gray-400 text-sm mt-1">Suas informações de contato para os artistas.</p>
      </div>
      <div>
        <label className={labelClass}>Seu nome *</label>
        <input type="text" value={form.name} onChange={set('name')} placeholder="Ex: Carlos Mendes" className={inputClass} autoFocus />
      </div>
      <div>
        <label className={labelClass}>Telefone / WhatsApp *</label>
        <input type="tel" value={form.phone} onChange={set('phone')} placeholder="Ex: (11) 99999-9999" className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Cidade *</label>
        <input type="text" value={form.city} onChange={set('city')} placeholder="Ex: Campinas" className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Endereço (opcional)</label>
        <input type="text" value={form.address} onChange={set('address')} placeholder="Ex: Rua das Orquídeas, 500" className={inputClass} />
      </div>
    </motion.div>,

    // Step 1 — Preferências
    <motion.div key="preferences" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
      <div>
        <h2 className="text-2xl font-black text-white">Que tipo de eventos você organiza?</h2>
        <p className="text-gray-400 text-sm mt-1">Isso ajuda a sugerir artistas mais adequados. Selecione quantos quiser.</p>
      </div>
      <div>
        <label className={labelClass}>Tipo de evento</label>
        <div className="grid grid-cols-2 gap-2">
          {EVENT_TYPES.map(et => {
            const selected = form.eventTypes.includes(et.id);
            return (
              <button key={et.id} onClick={() => toggleEventType(et.id)}
                className={`py-2.5 px-3 rounded-xl text-sm font-semibold transition-all border ${
                  selected
                    ? 'bg-neon-purple text-white border-neon-purple shadow-[0_0_15px_rgba(123,46,255,0.4)]'
                    : 'bg-white/5 text-gray-400 border-white/10 hover:border-neon-purple/30'
                }`}>
                {et.label}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <label className={labelClass}>Faixa de orçamento típica</label>
        <div className="space-y-2">
          {BUDGET_RANGES.map(br => (
            <button key={br.id} onClick={() => setForm(f => ({ ...f, budgetRange: br.id }))}
              className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-left transition-all border ${
                form.budgetRange === br.id
                  ? 'bg-neon-purple/20 text-white border-neon-purple/50'
                  : 'bg-white/5 text-gray-400 border-white/10 hover:border-neon-purple/30'
              }`}>
              {br.label}
            </button>
          ))}
        </div>
      </div>
    </motion.div>,

    // Step 2 — Done
    <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6 text-center">
      <div className="w-20 h-20 rounded-full bg-neon-green/20 flex items-center justify-center mx-auto">
        <Check className="w-10 h-10 text-neon-green" />
      </div>
      <div>
        <h2 className="text-2xl font-black text-white">Tudo pronto, {form.name || 'contratante'}!</h2>
        <p className="text-gray-400 text-sm mt-2">Agora você pode buscar e contratar artistas para seus eventos.</p>
      </div>
      <div className="space-y-2 text-left p-4 rounded-2xl bg-white/5 border border-white/5">
        {[
          { label: 'Nome',     value: form.name },
          { label: 'Cidade',   value: form.city },
          { label: 'Telefone', value: form.phone },
          { label: 'Eventos',  value: form.eventTypes.map(id => EVENT_TYPES.find(e => e.id === id)?.label).filter(Boolean).join(', ') || '—' },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-gray-500">{label}</span>
            <span className="text-white font-semibold text-right max-w-[60%]">{value || '—'}</span>
          </div>
        ))}
      </div>
    </motion.div>,
  ];

  return (
    <div className="min-h-screen bg-[#08041A] text-white flex flex-col font-poppins">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-neon-green/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center px-4 py-10 flex-1">
        <div className="mb-8 text-center">
          <p className="text-xs text-neon-green font-bold uppercase tracking-widest mb-1">TocaMais</p>
          <p className="text-gray-500 text-xs">Configuração inicial do contratante</p>
        </div>

        {/* Progress */}
        <div className="w-full max-w-sm mb-8">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const done   = i < step;
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

          {error && (
            <p className="text-red-400 text-xs mt-3 text-center">{error}</p>
          )}
        </div>

        {/* Navigation */}
        <div className="w-full max-w-sm mt-8 space-y-3">
          {step < STEPS.length - 1 ? (
            <NeonButton variant="gradient" size="lg" className="w-full flex items-center justify-center gap-2"
              onClick={saveStep} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar e continuar'}
              <ChevronRight className="w-4 h-4" />
            </NeonButton>
          ) : (
            <NeonButton variant="gradient" size="lg" className="w-full flex items-center justify-center gap-2"
              onClick={finish} disabled={saving}>
              {saving ? 'Finalizando...' : 'Começar a contratar'}
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
