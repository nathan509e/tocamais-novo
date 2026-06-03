import { useState, useEffect } from 'react';
import { Music, Clock, CheckCircle, XCircle, Play, Trash2, RefreshCw, Sparkles, MessageCircle } from 'lucide-react';
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
        const pendingWithTip = newData.filter(r => r.status === 'pending' && (Number(r.amount) || 0) > 0);
        const newPendingWithTip = pendingWithTip.filter(r => !lastCheckedIds.includes(r.id));
        if (newPendingWithTip.length > 0 && autoRefresh) {
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
    const activeRequests = requests.filter(r => r.status !== 'completed' && r.status !== 'cancelled');
    
    const withTips = activeRequests
      .filter(r => {
        const amount = Number(r.amount) || 0;
        return amount > 0;
      })
      .sort((a, b) => {
        const amountA = Number(a.amount) || 0;
        const amountB = Number(b.amount) || 0;
        if (amountB !== amountA) return amountB - amountA;
        return new Date(b.requested_at) - new Date(a.requested_at);
      });
    
    const withoutTips = activeRequests
      .filter(r => {
        const amount = Number(r.amount) || 0;
        return amount === 0;
      })
      .sort((a, b) => new Date(a.requested_at) - new Date(b.requested_at));
    
    return [...withTips, ...withoutTips];
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

        {pendingWithTipsCount > 0 && (
          <div
            className="p-4 rounded-xl bg-neon-green/10 border border-neon-green/30 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-neon-green" />
              <div>
                <p className="text-neon-green font-bold text-sm">
                  {pendingWithTipsCount} novo pedido{pendingWithTipsCount > 1 ? 's' : ''} com gorjeta!
                </p>
                <p className="text-neon-green/70 text-xs">
                  Confirme o recebimento para priorizar na fila
                </p>
              </div>
            </div>
            <button
              onClick={async () => {
                const tipRequests = requests.filter(r => r.status === 'pending' && (Number(r.amount) || 0) > 0);
                for (const req of tipRequests) {
                  await updateStatus(req.id, 'approved');
                }
              }}
              className="px-4 py-2 rounded-lg bg-neon-green text-white text-sm font-bold hover:bg-neon-green/80 transition-colors"
            >
              Confirmar Todos
            </button>
          </div>
        )}

        {pendingCount > 0 && pendingWithTipsCount === 0 && (
          <div className="p-4 rounded-xl bg-yellow-400/10 border border-yellow-400/30">
            <p className="text-yellow-400 font-bold text-sm">
              {pendingCount} pedido{pendingCount > 1 ? 's' : ''} pendente{pendingCount > 1 ? 's' : ''}
            </p>
          </div>
        )}

        {playingNow && (
          <div className="p-4 rounded-xl bg-neon-purple/10 border border-neon-purple/30">
            <p className="text-neon-purple text-xs font-bold uppercase tracking-wider mb-1">
              Tocando Agora
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-neon-purple/20 flex items-center justify-center">
                <Music className="w-5 h-5 text-neon-purple" />
              </div>
              <div>
                <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {playingNow.musica_titulo}
                </p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {playingNow.musica_artista}
                </p>
              </div>
            </div>
          </div>
        )}

        {loading && requests.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-neon-purple/30 border-t-neon-purple rounded-full animate-spin" />
          </div>
        )}

        {!loading && requests.length > 0 && (
          <div className="space-y-3">
            {sortedRequests().map((request, index) => {
                const config = statusConfig[request.status];
                const StatusIcon = config.icon;
                const tipValue = Number(request.amount) || 0;
                const hasTip = tipValue > 0;

                return (
                  <div
                    key={request.id}
                    className={`p-4 rounded-xl border ${
                      hasTip 
                        ? 'border-neon-green/30 bg-neon-green/5' 
                        : isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-neon-purple/20 flex items-center justify-center flex-shrink-0">
                        <Music className="w-6 h-6 text-neon-purple" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0">
                            <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {request.musica_titulo}
                            </p>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {request.musica_artista}
                            </p>
                          </div>
                          <div className={`px-2 py-1 rounded-lg text-xs font-bold ${config.bg} ${config.color}`}>
                            {config.label}
                          </div>
                        </div>

                        {request.message && (
                          <div className={`mt-2 p-2 rounded-lg text-sm flex items-start gap-2 ${
                            isDark ? 'bg-white/5 text-gray-300' : 'bg-gray-50 text-gray-700'
                          }`}>
                            <MessageCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-neon-purple" />
                            <span>"{request.message}"</span>
                          </div>
                        )}

                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(request.requested_at).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          {request.user_name && (
                            <span>por {request.user_name}</span>
                          )}
                          {hasTip && (
                            <span className="text-neon-green font-bold flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              PIX R$ {tipValue.toFixed(2)}
                            </span>
                          )}
                        </div>

                        {request.status === 'pending' && (
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => updateStatus(request.id, 'approved')}
                              className="flex-1 py-2 rounded-lg bg-neon-green/20 text-neon-green text-sm font-bold hover:bg-neon-green/30 transition-colors"
                            >
                              Aprovar
                            </button>
                            <button
                              onClick={() => updateStatus(request.id, 'playing')}
                              className="flex-1 py-2 rounded-lg bg-neon-purple/20 text-neon-purple text-sm font-bold hover:bg-neon-purple/30 transition-colors"
                            >
                              Tocando
                            </button>
                            <button
                              onClick={() => updateStatus(request.id, 'cancelled')}
                              className="px-3 py-2 rounded-lg bg-red-400/20 text-red-400 hover:bg-red-400/30 transition-colors"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        )}

                        {request.status === 'approved' && (
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => updateStatus(request.id, 'playing')}
                              className="flex-1 py-2 rounded-lg bg-neon-purple/20 text-neon-purple text-sm font-bold hover:bg-neon-purple/30 transition-colors"
                            >
                              Iniciar Reprodução
                            </button>
                            <button
                              onClick={() => updateStatus(request.id, 'cancelled')}
                              className="px-3 py-2 rounded-lg bg-red-400/20 text-red-400 hover:bg-red-400/30 transition-colors"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        )}

                        {request.status === 'playing' && (
                          <button
                            onClick={() => updateStatus(request.id, 'completed')}
                            className="w-full mt-3 py-2 rounded-lg bg-gray-400/20 text-gray-400 text-sm font-bold hover:bg-gray-400/30 transition-colors"
                          >
                            Marcar como Finalizado
                          </button>
                        )}

                        <button
                          onClick={() => deleteRequest(request.id)}
                          className="mt-2 text-xs text-gray-500 hover:text-red-400 transition-colors flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}