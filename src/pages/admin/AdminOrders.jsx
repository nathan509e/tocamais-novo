import { useState, useEffect } from 'react';
import { ShoppingBag, Search, ChevronLeft, ChevronRight, RefreshCw, DollarSign, Copy, Check, AlertTriangle, Ban, Loader, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import { useTheme } from '../../lib/ThemeContext';
import { supabase } from '../../lib/supabaseClient';

const statusConfig = {
  pending: { label: 'Pendente', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  paid: { label: 'Pago', color: 'text-neon-green', bg: 'bg-neon-green/10' },
  transferred: { label: 'Repassado', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  playing: { label: 'Tocando', color: 'text-neon-purple', bg: 'bg-neon-purple/10' },
  completed: { label: 'Finalizado', color: 'text-gray-400', bg: 'bg-gray-400/10' },
  cancelled: { label: 'Cancelado', color: 'text-red-400', bg: 'bg-red-400/10' },
};

function formatTime(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function AdminOrders() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [copiedId, setCopiedId] = useState(null);
  const [page, setPage] = useState(0);
  const perPage = 25;

  useEffect(() => {
    if (user?.role !== 'admin' && user?.user_metadata?.role !== 'admin') {
      navigate('/', { replace: true });
      return;
    }
    loadOrders();
  }, [user]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-admin-orders');
      if (!error && data?.success) {
        setOrders(data.data || []);
      } else {
        console.error('Error loading orders:', error);
      }
    } catch (e) {
      console.error('Error:', e);
    }
    setLoading(false);
  };

  const filtered = orders.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    const artist = r.artist?.artistic_name || '';
    const name = r.user_name || '';
    const music = r.musica_titulo || '';
    return artist.includes(q) || name.includes(q) || music.includes(q) || r.id.toString().includes(q);
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'amount') return (Number(b.amount) || 0) - (Number(a.amount) || 0);
    return new Date(b.requested_at || 0).getTime() - new Date(a.requested_at || 0).getTime();
  });

  const totalAmount = sorted.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const totalPages = Math.ceil(sorted.length / perPage);
  const paged = sorted.slice(page * perPage, (page + 1) * perPage);

  const totalTransferred = sorted
    .filter(r => r.pix_status === 'transferred')
    .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  const totalPendingTransfer = sorted
    .filter(r => r.pix_status === 'paid' && (Number(r.amount) || 0) > 0)
    .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  const copyPixKey = async (key, id) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#08041A]' : 'bg-gray-50'}`}>
      <div className={`sticky top-0 z-10 border-b ${isDark ? 'bg-[#08041A]/90 border-white/10' : 'bg-white border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <ShoppingBag className={`w-6 h-6 ${isDark ? 'text-neon-purple' : 'text-purple-600'}`} />
              <h1 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Pedidos com PIX
              </h1>
              <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-white/10 text-gray-400' : 'bg-gray-200 text-gray-600'}`}>
                {orders.length} pedidos
              </span>
            </div>
            <button
              onClick={() => { loadOrders(); }}
              className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className={`p-3 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
              <p className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Total</p>
              <p className="text-lg font-bold text-neon-green">R$ {totalAmount.toFixed(2)}</p>
            </div>
            <div className={`p-3 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
              <p className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Repassado</p>
              <p className="text-lg font-bold text-blue-400">R$ {totalTransferred.toFixed(2)}</p>
            </div>
            <div className={`p-3 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
              <p className={`text-[10px] uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Pendente</p>
              <p className="text-lg font-bold text-yellow-400">R$ {totalPendingTransfer.toFixed(2)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
              <Search className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(0); }}
                placeholder="Buscar por artista, cliente ou música..."
                className={`flex-1 bg-transparent text-sm outline-none ${isDark ? 'text-white placeholder:text-gray-500' : 'text-gray-800 placeholder:text-gray-400'}`}
              />
            </div>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className={`text-xs px-3 py-2 rounded-xl border outline-none ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-800'}`}
            >
              <option value="date">Mais recentes</option>
              <option value="amount">Maior valor</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className={`w-8 h-8 animate-spin ${isDark ? 'text-neon-purple' : 'text-purple-600'}`} />
          </div>
        ) : paged.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className={`w-12 h-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {search ? 'Nenhum pedido encontrado' : 'Nenhum pedido com PIX ainda'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {paged.map(order => {
              const cfg = statusConfig[order.pix_status || order.status] || statusConfig.pending;
              const StatusIcon = cfg.icon;
              const artist = order.artist;
              const amount = Number(order.amount) || 0;
              const artistShare = amount * 0.95;
              const pixStatusLabel = order.pix_status === 'transferred' ? 'Repassado' :
                order.pix_status === 'paid' ? 'Pago (Aguardando repasse)' :
                order.pix_status || order.status || 'Pendente';

              return (
                <div
                  key={order.id}
                  className={`p-4 rounded-2xl border transition-all ${isDark ? 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]' : 'bg-white border-gray-200 hover:shadow-md'}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                        {artist?.photo_url ? (
                          <img src={artist.photo_url} alt="" className="w-full h-full rounded-xl object-cover" />
                        ) : (
                          <User className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {artist?.artistic_name || 'Artista'}
                          </span>
                          <span className={`text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                            #{order.id}
                          </span>
                        </div>
                        <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {order.musica_titulo || 'Pedido'} · {order.user_name || 'Anônimo'}
                        </p>
                        {order.message && (
                          <p className={`text-xs mt-1 italic ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            "{order.message}"
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-lg text-neon-green">R$ {amount.toFixed(2)}</p>
                      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium mt-1 ${cfg.bg} ${cfg.color}`}>
                        {pixStatusLabel}
                      </div>
                      <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                        {formatTime(order.requested_at)}
                      </p>
                    </div>
                  </div>

                  {amount > 0 && (
                    <div className={`mt-3 pt-3 border-t ${isDark ? 'border-white/[0.06]' : 'border-gray-100'}`}>
                      <div className="flex items-center gap-4 text-xs">
                        <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>
                          Taxa 5%: <span className="text-white font-medium">R$ {(amount * 0.05).toFixed(2)}</span>
                        </span>
                        <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>
                          Artista: <span className="text-neon-green font-medium">R$ {artistShare.toFixed(2)}</span>
                        </span>
                        {artist?.pix_key && (
                          <button
                            onClick={() => copyPixKey(artist.pix_key, order.id)}
                            className={`flex items-center gap-1 transition-colors ${
                              copiedId === order.id ? 'text-neon-green' : isDark ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-gray-800'
                            }`}
                          >
                            {copiedId === order.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            PIX: {artist.pix_key}
                          </button>
                        )}
                        {order.pix_status === 'paid' && (
                          <span className="flex items-center gap-1 text-yellow-400">
                            <AlertTriangle className="w-3 h-3" />
                            Aguardando repasse
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className={`p-2 rounded-xl transition-colors disabled:opacity-30 ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
            >
              <ChevronLeft className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-800'}`} />
            </button>
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {page + 1} de {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className={`p-2 rounded-xl transition-colors disabled:opacity-30 ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
            >
              <ChevronRight className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-800'}`} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
