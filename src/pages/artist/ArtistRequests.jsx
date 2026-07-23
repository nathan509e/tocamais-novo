import { useState, useEffect } from 'react';
import { Music, Clock, CheckCircle, XCircle, Play, Trash2, RefreshCw, Sparkles, MessageCircle, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '../../components/shared/AppLayout';
import { useAuth } from '../../lib/AuthContext';
import { useTheme } from '../../lib/ThemeContext';
import { supabase } from '../../lib/supabaseClient';

const statusConfig = {
  pending: { label: 'Pendente', color: 'text-yellow-400', bg: 'bg-yellow-400/10', icon: Clock },
  approved: { label: 'Aprovado', color: 'text-neon-green', bg: 'bg-neon-green/10', icon: CheckCircle },
  playing: { label: 'Tocando', color: 'text-neon-purple', bg: 'bg-neon-purple/10', icon: Play },
  completed: { label: 'Finalizado', color: 'text-gray-400', bg: 'bg-gray-400/10', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: 'text-red-400', bg: 'bg-red-400/10', icon: XCircle },
};

export default function ArtistRequests() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastCheckedIds, setLastCheckedIds] = useState([]);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filter States
  const [filterDate, setFilterDate] = useState('all'); // all, today, week, month
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, completed, cancelled
  const [filterTip, setFilterTip] = useState('all'); // all, tip, no-tip

  // Auto-archive requests from playing to completed status after 1 minute
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      requests.forEach(async (req) => {
        if (req.status === 'playing' && req.played_at) {
          const playedTime = new Date(req.played_at);
          const diffMs = now - playedTime;
          const diffMins = diffMs / 1000 / 60;
          if (diffMins >= 1) {
            await supabase
              .from('music_requests')
              .update({ status: 'completed' })
              .eq('id', req.id);
            setRequests(prev =>
              prev.map(r => r.id === req.id ? { ...r, status: 'completed' } : r)
            );
          }
        }
      });
    }, 10000);
    return () => clearInterval(interval);
  }, [requests]);

  useEffect(() => {
    if (user?.id) {
      loadRequests();
    }
  }, [user?.id]);

  useEffect(() => {
    if (!autoRefresh || !user?.id) return;
    const interval = setInterval(loadRequests, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, user?.id]);

  const loadRequests = async () => {
    if (!user?.id) return;
    const isFirstLoad = requests.length === 0;
    if (isFirstLoad) setLoading(true);
    try {
      const { data } = await supabase
        .from('music_requests')
        .select('*')
        .eq('artist_id', user.id)
        .order('requested_at', { ascending: false });
      
      const newData = data || [];

      if (isFirstLoad) {
        setRequests(newData);
      } else {
        const existingIds = new Set(requests.map(r => r.id));
        const newReqs = newData.filter(r => !existingIds.has(r.id));
        const hasChanges = newReqs.length > 0 || newData.some(r => {
          const existing = requests.find(e => e.id === r.id);
          return existing && (existing.status !== r.status || Number(existing.amount) !== Number(r.amount));
        });

        if (newReqs.length > 0) {
          setRequests(prev => [...newReqs, ...newData.filter(r => existingIds.has(r.id))]);
        } else if (hasChanges) {
          setRequests(newData);
        }
      }

      if (lastCheckedIds.length > 0) {
        const newPending = newData.filter(r => r.status === 'pending' && !lastCheckedIds.includes(r.id));
        if (newPending.length > 0 && autoRefresh) {
          playNotificationSound();
        }
      }
      
      const pendingIds = newData.filter(r => r.status === 'pending').map(r => r.id);
      setLastCheckedIds(pendingIds);
    } catch (e) {
      console.log('Table not ready yet');
      if (requests.length === 0) setRequests([]);
    }
    if (isFirstLoad) setLoading(false);
  };

  const playNotificationSound = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleBoAQp3T259pHhA2jaXS4K1fHQtDodLkrmMcDkWh0+SvXx0MRaHT5K5fHQxFodLkrmAcDEWh0uSuYBwMRaHS5K5gHAxFodLkrmAcDEWh0uSuYBwMRaHS5K5gHAxFodLkrmAcDEWh0uSuYBwMRaHS5K5gHAxFodLkrmAcDEWh0uSuYBw=');
      audio.volume = 0.3;
      audio.play().catch(() => {});
    } catch (e) {}
  };

  const sortedRequests = () => {
    let filtered = requests;

    // 1. Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(r => r.status === filterStatus);
    }

    // 2. Filter by tip
    if (filterTip === 'tip') {
      filtered = filtered.filter(r => (Number(r.amount) || 0) > 0);
    } else if (filterTip === 'no-tip') {
      filtered = filtered.filter(r => (Number(r.amount) || 0) === 0);
    }

    // 3. Filter by date
    if (filterDate !== 'all') {
      const today = new Date();
      filtered = filtered.filter(r => {
        const reqDate = new Date(r.requested_at);
        if (filterDate === 'today') {
          return reqDate.getDate() === today.getDate() &&
                 reqDate.getMonth() === today.getMonth() &&
                 reqDate.getFullYear() === today.getFullYear();
        } else if (filterDate === 'week') {
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(today.getDate() - 7);
          return reqDate >= oneWeekAgo;
        } else if (filterDate === 'month') {
          const oneMonthAgo = new Date();
          oneMonthAgo.setDate(today.getDate() - 30);
          return reqDate >= oneMonthAgo;
        }
        return true;
      });
    }

    // Sort: tips first (highest amount first), then requested_at date (newest first)
    return [...filtered].sort((a, b) => {
      const amountA = Number(a.amount) || 0;
      const amountB = Number(b.amount) || 0;
      if (amountB !== amountA) return amountB - amountA;
      return new Date(b.requested_at) - new Date(a.requested_at);
    });
  };

  const updateStatus = async (requestId, newStatus) => {
    const updates = { status: newStatus };
    if (newStatus === 'playing') {
      updates.played_at = new Date().toISOString();
    }

    await supabase
      .from('music_requests')
      .update(updates)
      .eq('id', requestId);

    setRequests(prev =>
      prev.map(r => r.id === requestId ? { ...r, ...updates } : r)
    );
  };

  const deleteRequest = async (requestId) => {
    await supabase
      .from('music_requests')
      .delete()
      .eq('id', requestId);

    setRequests(prev => prev.filter(r => r.id !== requestId));
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const pendingWithTipsCount = requests.filter(r => r.status === 'pending' && (Number(r.amount) || 0) > 0).length;
  const playingNow = requests.find(r => r.status === 'playing');

  const totalCompletedTips = requests
    .filter(r => r.status === 'completed' && (Number(r.amount) || 0) > 0)
    .reduce((acc, r) => acc + (Number(r.amount) || 0), 0);

  const totalPendingTips = requests
    .filter(r => (r.status === 'pending' || r.status === 'playing') && (Number(r.amount) || 0) > 0)
    .reduce((acc, r) => acc + (Number(r.amount) || 0), 0);

  const totalTipsCount = requests.filter(r => (Number(r.amount) || 0) > 0).length;

  return (
    <AppLayout role="artist" userName={user?.name || ''}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`font-bold text-xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Pedidos de Músicas
            </h1>
            <p className="text-gray-400 text-sm">Gerencie os pedidos do seu show</p>
          </div>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`p-2 rounded-xl border transition-all ${
              autoRefresh
                ? 'bg-neon-green/20 border-neon-green text-neon-green'
                : isDark ? 'bg-white/5 border-white/10 text-gray-400' : 'bg-gray-100 border-gray-200 text-gray-500'
            }`}
          >
            <RefreshCw className={`w-5 h-5 ${autoRefresh ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Tips Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-[#1B3B2B]/40 border border-[#39FF6A]/20 flex items-center justify-between">
            <div>
              <span className="text-[9px] text-gray-400 uppercase font-black tracking-wider block">Total Recebido (Tocado)</span>
              <p className="text-sm font-black text-[#39FF6A] mt-0.5">R$ {totalCompletedTips.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <Sparkles className="w-5 h-5 text-[#39FF6A] opacity-60" fill="#39FF6A" />
          </div>
          <div className="p-3.5 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-between">
            <div>
              <span className="text-[9px] text-gray-400 uppercase font-black tracking-wider block">Pendente/Tocando</span>
              <p className="text-sm font-black text-yellow-400 mt-0.5">R$ {totalPendingTips.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <Clock className="w-5 h-5 text-yellow-400 opacity-60" />
          </div>
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
            <div>
              <span className="text-[9px] text-gray-400 uppercase font-black tracking-wider block">Qtd. Gorjetas (Histórico)</span>
              <p className="text-sm font-black text-white mt-0.5">{totalTipsCount} gorjetas</p>
            </div>
            <Music className="w-5 h-5 text-gray-400 opacity-60" />
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-wrap gap-4 pb-3 border-b border-white/5 text-xs">
          {/* Status Filter */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] text-gray-500 uppercase font-black tracking-wider">Filtrar por Status</span>
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 flex-wrap gap-1">
              {[
                { id: 'all', label: 'Todos' },
                { id: 'pending', label: 'Pendente' },
                { id: 'completed', label: 'Tocado' },
                { id: 'cancelled', label: 'Arquivado/Recusado' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setFilterStatus(opt.id)}
                  className={`px-3 py-1 rounded-lg font-bold transition-all text-[11px] ${
                    filterStatus === opt.id
                      ? 'bg-neon-purple text-white shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tip Filter */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] text-gray-500 uppercase font-black tracking-wider">Gorjeta</span>
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 gap-1">
              {[
                { id: 'all', label: 'Todos' },
                { id: 'tip', label: 'Com Gorjeta' },
                { id: 'no-tip', label: 'Sem Gorjeta' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setFilterTip(opt.id)}
                  className={`px-3 py-1 rounded-lg font-bold transition-all text-[11px] ${
                    filterTip === opt.id
                      ? 'bg-neon-purple text-white shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Period Filter */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] text-gray-500 uppercase font-black tracking-wider">Período</span>
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 gap-1">
              {[
                { id: 'all', label: 'Todos' },
                { id: 'today', label: 'Hoje' },
                { id: 'week', label: 'Semana' },
                { id: 'month', label: 'Mês' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setFilterDate(opt.id)}
                  className={`px-3 py-1 rounded-lg font-bold transition-all text-[11px] ${
                    filterDate === opt.id
                      ? 'bg-neon-purple text-white shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading && requests.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-neon-purple/30 border-t-neon-purple rounded-full animate-spin" />
          </div>
        ) : sortedRequests().length === 0 ? (
          <p className="text-xs text-gray-500 italic text-center py-6">Nenhum pedido encontrado com estes filtros.</p>
        ) : (
          <div className="space-y-4">
            {sortedRequests().map(request => {
              const tipValue = Number(request.amount) || 0;
              const hasTip = tipValue > 0;
              
              const statusStyles = {
                pending: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
                approved: 'bg-neon-green/20 text-neon-green border border-neon-green/30',
                playing: 'bg-neon-purple/20 text-neon-purple border border-neon-purple/30',
                completed: 'bg-neon-green/20 text-neon-green border border-neon-green/30',
                cancelled: 'bg-red-500/20 text-red-400 border border-red-500/30',
              };
              const statusLabels = {
                pending: 'Pendente',
                approved: 'Aprovado',
                playing: 'Tocando',
                completed: 'Tocado',
                cancelled: 'Arquivado/Recusado',
              };

              return (
                <div
                  key={request.id}
                  className={`p-5 rounded-3xl border flex flex-col gap-4 transition-all ${
                    hasTip 
                      ? 'border-[#39FF6A]/30 bg-[#39FF6A]/5' 
                      : isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center flex-shrink-0">
                        <Music className="w-6 h-6 text-neon-purple" />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-lg font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{request.musica_titulo}</p>
                        <p className="text-sm text-gray-400 mt-0.5 truncate">{request.musica_artista}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${statusStyles[request.status] || statusStyles.pending}`}>
                      {statusLabels[request.status] || 'Pendente'}
                    </span>
                  </div>

                  {request.message && (
                    <div className="flex items-center gap-2.5 bg-white/5 px-4 py-2.5 rounded-xl text-xs text-white">
                      <MessageCircle className="w-4 h-4 text-neon-purple flex-shrink-0" />
                      <span>"{request.message}"</span>
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {new Date(request.requested_at).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    {request.user_name && <span>por {request.user_name}</span>}
                    {hasTip && (
                      <span className="text-[#39FF6A] font-bold flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 fill-[#39FF6A]" />
                        PIX R$ {tipValue.toFixed(2)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 w-full">
                    {request.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateStatus(request.id, 'playing')}
                          className="flex-1 py-3 rounded-2xl bg-[#1B3B2B] text-[#39FF6A] border border-[#39FF6A]/30 text-xs font-bold hover:bg-[#235039] transition-all"
                        >
                          Tocar
                        </button>
                        <button
                          onClick={() => updateStatus(request.id, 'cancelled')}
                          className="flex-1 py-3 rounded-2xl bg-[#28154D] text-[#A855F7] border border-[#A855F7]/30 text-xs font-bold hover:bg-[#381F69] transition-all"
                        >
                          Arquivar
                        </button>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => deleteRequest(request.id)}
                    className="text-xs text-gray-500 hover:text-red-400 transition-colors flex items-center gap-1.5 px-1 py-0.5 mt-1 self-start"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-24 right-6 p-4 rounded-full bg-neon-purple text-white shadow-[0_0_20px_rgba(123,46,255,0.5)] z-50 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform cursor-pointer border border-white/20"
            title="Ir para o topo"
          >
            <ChevronUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}