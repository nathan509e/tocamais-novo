import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Clock, CheckCircle, XCircle, Play, Trash2, RefreshCw } from 'lucide-react';
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
    setLoading(true);
    try {
      const { data } = await supabase
        .from('music_requests')
        .select('*')
        .eq('artist_id', user.id)
        .order('requested_at', { ascending: false });
      setRequests(data || []);
    } catch (e) {
      console.log('Table not ready yet');
      setRequests([]);
    }
    setLoading(false);
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

        {pendingCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-yellow-400/10 border border-yellow-400/30"
          >
            <p className="text-yellow-400 font-bold text-sm">
              {pendingCount} pedido{pendingCount > 1 ? 's' : ''} pendente{pendingCount > 1 ? 's' : ''}
            </p>
          </motion.div>
        )}

        {playingNow && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-xl bg-neon-purple/10 border border-neon-purple/30"
          >
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
          </motion.div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-neon-purple/30 border-t-neon-purple rounded-full animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Nenhum pedido ainda</p>
            <p className="text-sm mt-1">Os pedidos aparecerão aqui</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {requests.map((request, index) => {
                const config = statusConfig[request.status];
                const StatusIcon = config.icon;

                return (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 rounded-xl border ${
                      isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-200'
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
                          {request.amount && (
                            <span className="text-neon-green">R$ {request.amount.toFixed(2)}</span>
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
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </AppLayout>
  );
}