import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Plus, TrendingUp, Users, DollarSign, Calendar, X, BarChart3 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/AuthContext';
import { useTheme } from '../../lib/ThemeContext';

const EMPTY_FORM = {
  event_date: new Date().toISOString().slice(0, 10),
  event_name: '',
  couvert: '',
  door_revenue: '',
  estimated_public: '',
  artist_fee: '',
  notes: '',
};

const InputField = ({ label, type = 'text', value, onChange, placeholder, isDark }) => (
  <div>
    <label className="text-[10px] text-gray-400 font-bold block mb-1">{label}</label>
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={onChange}
      className={`w-full p-2.5 rounded-xl border text-xs outline-none ${
        isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'
      }`}
    />
  </div>
);

export default function VenueEventIndicators() {
  const { userProfile } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [indicators, setIndicators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchIndicators = async () => {
    if (!userProfile?.id) return;
    const { data } = await supabase
      .from('event_indicators')
      .select('*')
      .eq('venue_id', userProfile.id)
      .order('event_date', { ascending: false });
    setIndicators(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchIndicators(); }, [userProfile?.id]);

  const handleSave = async () => {
    if (!form.event_date) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('event_indicators').insert({
        venue_id: userProfile.id,
        event_date: form.event_date,
        event_name: form.event_name || null,
        couvert: parseFloat(form.couvert) || 0,
        door_revenue: parseFloat(form.door_revenue) || 0,
        estimated_public: parseInt(form.estimated_public) || 0,
        artist_fee: parseFloat(form.artist_fee) || 0,
        notes: form.notes || null,
      });
      if (error) throw error;
      setForm(EMPTY_FORM);
      setShowForm(false);
      fetchIndicators();
    } catch (err) {
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remover este indicador?')) return;
    await supabase.from('event_indicators').delete().eq('id', id);
    setIndicators(prev => prev.filter(i => i.id !== id));
  };

  const f = v => v.field;
  const totalDoor = indicators.reduce((s, i) => s + (i.door_revenue || 0), 0);
  const totalCouvert = indicators.reduce((s, i) => s + (i.couvert || 0), 0);
  const avgPublic = indicators.length > 0
    ? Math.round(indicators.reduce((s, i) => s + (i.estimated_public || 0), 0) / indicators.length)
    : 0;
  const totalFees = indicators.reduce((s, i) => s + (i.artist_fee || 0), 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">Indicadores do Evento</h3>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-400 text-[9px] font-black tracking-widest uppercase">
            <Crown className="w-3 h-3" /> PRO
          </span>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-400/20 border border-amber-400/30 text-amber-400 text-xs font-bold hover:bg-amber-400/30 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Registrar Evento
        </button>
      </div>

      {/* Summary cards */}
      {indicators.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Bilheteria Total', value: `R$ ${totalDoor.toLocaleString('pt-BR')}`, icon: DollarSign, color: 'text-neon-green' },
            { label: 'Couvert Total', value: `R$ ${totalCouvert.toLocaleString('pt-BR')}`, icon: TrendingUp, color: 'text-neon-purple' },
            { label: 'Público Médio', value: `${avgPublic} pessoas`, icon: Users, color: 'text-blue-400' },
            { label: 'Cachês Pagos', value: `R$ ${totalFees.toLocaleString('pt-BR')}`, icon: Calendar, color: 'text-amber-400' },
          ].map((s, i) => (
            <div key={i} className="p-3.5 rounded-2xl bg-white/5 border border-white/5">
              <div className="flex items-center gap-1.5 mb-1">
                <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{s.label}</span>
              </div>
              <p className="text-sm font-bold text-white">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`overflow-hidden rounded-2xl border ${isDark ? 'bg-white/5 border-amber-400/20' : 'bg-white border-amber-200 shadow-sm'}`}
          >
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-400">Registrar Indicadores</p>
                <button onClick={() => setShowForm(false)} className="p-1 rounded bg-white/5 hover:bg-white/10">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <InputField label="Data do Evento *" type="date" value={form.event_date}
                  onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))} isDark={isDark} />
                <InputField label="Nome / Artista" value={form.event_name} placeholder="Ex: Show do João"
                  onChange={e => setForm(f => ({ ...f, event_name: e.target.value }))} isDark={isDark} />
                <InputField label="Bilheteria (R$)" type="number" value={form.door_revenue} placeholder="0"
                  onChange={e => setForm(f => ({ ...f, door_revenue: e.target.value }))} isDark={isDark} />
                <InputField label="Couvert (R$)" type="number" value={form.couvert} placeholder="0"
                  onChange={e => setForm(f => ({ ...f, couvert: e.target.value }))} isDark={isDark} />
                <InputField label="Público Estimado" type="number" value={form.estimated_public} placeholder="0"
                  onChange={e => setForm(f => ({ ...f, estimated_public: e.target.value }))} isDark={isDark} />
                <InputField label="Cachê do Artista (R$)" type="number" value={form.artist_fee} placeholder="0"
                  onChange={e => setForm(f => ({ ...f, artist_fee: e.target.value }))} isDark={isDark} />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 font-bold block mb-1">Observações</label>
                <textarea
                  value={form.notes}
                  rows={2}
                  placeholder="Notas sobre o evento..."
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className={`w-full p-2.5 rounded-xl border text-xs outline-none resize-none ${
                    isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'
                  }`}
                />
              </div>
              <button
                onClick={handleSave}
                disabled={saving || !form.event_date}
                className="w-full py-2.5 rounded-xl bg-amber-400 text-[#08041A] text-xs font-black hover:opacity-90 transition-all disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Salvar Indicadores'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {loading ? (
        <div className="h-20 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : indicators.length === 0 ? (
        <div className="p-6 text-center bg-white/5 rounded-2xl border border-white/5">
          <Crown className="w-8 h-8 text-amber-400/40 mx-auto mb-2" />
          <p className="text-gray-400 text-xs font-bold">Nenhum indicador registrado ainda.</p>
          <p className="text-gray-600 text-[10px] mt-1">Registre os dados do seu próximo evento para começar a acompanhar os resultados.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {indicators.map(ind => (
            <div
              key={ind.id}
              className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center gap-3 transition-all ${
                isDark ? 'bg-white/5 border-white/5 hover:border-amber-400/20' : 'bg-white border-gray-100 shadow-sm'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-white truncate">
                    {ind.event_name || 'Evento sem nome'}
                  </span>
                  <span className="text-[9px] text-gray-500 shrink-0">
                    {new Date(ind.event_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 text-[10px] text-gray-400">
                  <span><span className="text-neon-green font-bold">R$ {(ind.door_revenue || 0).toLocaleString('pt-BR')}</span> bilheteria</span>
                  <span><span className="text-neon-purple font-bold">R$ {(ind.couvert || 0).toLocaleString('pt-BR')}</span> couvert</span>
                  <span><span className="text-white font-bold">{ind.estimated_public || 0}</span> pessoas</span>
                  {ind.artist_fee > 0 && (
                    <span><span className="text-amber-400 font-bold">R$ {ind.artist_fee.toLocaleString('pt-BR')}</span> cachê</span>
                  )}
                </div>
                {ind.notes && <p className="text-[10px] text-gray-500 mt-1 italic">{ind.notes}</p>}
              </div>
              <button
                onClick={() => handleDelete(ind.id)}
                className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 shrink-0 self-start sm:self-center transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
