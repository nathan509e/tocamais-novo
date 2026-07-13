import { useState, useEffect } from 'react';
import { ShoppingBag, Search, ChevronLeft, ChevronRight, RefreshCw, Copy, Check, AlertTriangle, Loader, User, Crown, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import { useTheme } from '../../lib/ThemeContext';
import { supabase } from '../../lib/supabaseClient';
import AppLayout from '../../components/shared/AppLayout';

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
  const { user, userProfile } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('tips'); // 'tips' or 'pro'
  const [statusFilter, setStatusFilter] = useState('all');
  const [orders, setOrders] = useState([]);
  const [proSubscriptions, setProSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [copiedId, setCopiedId] = useState(null);
  const [page, setPage] = useState(0);
  const perPage = 25;

  useEffect(() => {
    const role = userProfile?.role || user?.user_metadata?.role || user?.role;
    if (!role) return; // Wait until loaded
    if (role !== 'admin') {
      navigate('/', { replace: true });
      return;
    }
    loadData();
  }, [user, userProfile]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('search');
    if (q) {
      setSearch(decodeURIComponent(q));
    }
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load tips (music requests)
      const { data, error } = await supabase.functions.invoke('get-admin-orders');
      if (!error && data?.success) {
        setOrders(data.data || []);
      } else {
        console.error('Error loading orders:', error);
      }

      // Load PRO subscriptions (artists where is_pro is true)
      const { data: artistsData, error: artistsErr } = await supabase
        .from('artists')
        .select('user_id, artistic_name, photo_url, is_pro, asaas_subscription_id, created_at')
        .eq('is_pro', true)
        .order('created_at', { ascending: false });

      if (!artistsErr) {
        setProSubscriptions(artistsData || []);
      } else {
        console.error('Error loading PRO subscriptions:', artistsErr);
      }
    } catch (e) {
      console.error('Error:', e);
    }
    setLoading(false);
  };

  const copyPixKey = async (key, id) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
  };

  // Filter and sort tips
  const filteredTips = orders.filter(r => {
    const q = search.toLowerCase();
    const artist = r.artist?.artistic_name || '';
    const name = r.user_name || '';
    const music = r.musica_titulo || '';
    const matchesSearch = !search || artist.toLowerCase().includes(q) || name.toLowerCase().includes(q) || music.toLowerCase().includes(q) || String(r.id).toLowerCase().includes(q);

    // Status filter logic
    const status = r.pix_status || r.status;
    const amount = Number(r.amount) || 0;
    
    let matchesStatus = true;
    if (statusFilter === 'paid') {
      matchesStatus = status === 'paid';
    } else if (statusFilter === 'transferred') {
      matchesStatus = status === 'transferred';
    } else if (statusFilter === 'pending_transfer') {
      matchesStatus = status === 'paid' && amount > 0;
    } else if (statusFilter === 'cancelled') {
      matchesStatus = r.status === 'cancelled';
    } else if (statusFilter === 'pending') {
      matchesStatus = status === 'pending';
    }

    return matchesSearch && matchesStatus;
  });

  const sortedTips = [...filteredTips].sort((a, b) => {
    if (sortBy === 'amount') return (Number(b.amount) || 0) - (Number(a.amount) || 0);
    return new Date(b.requested_at || 0).getTime() - new Date(a.requested_at || 0).getTime();
  });

  // Filter and sort PRO Subscriptions
  const filteredPro = proSubscriptions.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.artistic_name?.toLowerCase().includes(q) || s.asaas_subscription_id?.toLowerCase().includes(q);
  });

  const activeList = activeTab === 'tips' ? sortedTips : filteredPro;
  const totalPages = Math.ceil(activeList.length / perPage);
  const paged = activeList.slice(page * perPage, (page + 1) * perPage);

  // Financial Stats
  const totalAmount = sortedTips.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const totalTransferred = sortedTips
    .filter(r => r.pix_status === 'transferred')
    .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const totalPendingTransfer = sortedTips
    .filter(r => r.pix_status === 'paid' && (Number(r.amount) || 0) > 0)
    .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  return (
    <AppLayout role="admin">
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-neon-purple/20 rounded-2xl">
              <ShoppingBag className="w-6 h-6 text-neon-purple" />
            </div>
            <div>
              <h1 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>Pedidos e Pagamentos</h1>
              <p className="text-xs text-gray-400">Gerencie gorjetas recebidas e assinantes PRO da plataforma.</p>
            </div>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className={`p-2.5 rounded-xl border transition-colors self-start sm:self-center ${
              isDark ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white' : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
            }`}
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className={`p-4 rounded-2xl border transition-all ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-200 shadow-sm'}`}>
            <p className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Total Gorjetas</p>
            <p className="text-xl font-black text-neon-green mt-1">R$ {totalAmount.toFixed(2)}</p>
          </div>
          <div className={`p-4 rounded-2xl border transition-all ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-200 shadow-sm'}`}>
            <p className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Repassado</p>
            <p className="text-xl font-black text-blue-400 mt-1">R$ {totalTransferred.toFixed(2)}</p>
          </div>
          <div className={`p-4 rounded-2xl border transition-all ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-gray-200 shadow-sm'}`}>
            <p className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Aguardando Repasse</p>
            <p className="text-xl font-black text-yellow-400 mt-1">R$ {totalPendingTransfer.toFixed(2)}</p>
          </div>
        </div>

        {/* Tabs switcher */}
        <div className={`flex border-b ${isDark ? 'border-white/5' : 'border-gray-200'}`}>
          <button
            onClick={() => { setActiveTab('tips'); setPage(0); }}
            className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'tips'
                ? 'border-neon-purple text-neon-purple'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Gorjetas Recebidas ({sortedTips.length})
          </button>
          <button
            onClick={() => { setActiveTab('pro'); setPage(0); }}
            className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all ${
              activeTab === 'pro'
                ? 'border-neon-purple text-neon-purple'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Assinantes PRO ({filteredPro.length})
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className={`flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border ${
            isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              placeholder={activeTab === 'tips' ? "Buscar por artista, cliente ou música..." : "Buscar por artista ou código..."}
              className={`flex-1 bg-transparent text-xs outline-none ${
                isDark ? 'text-white placeholder:text-gray-600' : 'text-gray-800 placeholder:text-gray-400'
              }`}
            />
          </div>
          {activeTab === 'tips' && (
            <>
              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
                className={`text-xs px-4 py-2.5 rounded-xl border outline-none ${
                  isDark ? 'bg-[#0f0a26] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-700'
                }`}
              >
                <option value="all">Todos os Status</option>
                <option value="paid">Pagos</option>
                <option value="transferred">Repassados</option>
                <option value="pending_transfer">Precisam ser repassados</option>
                <option value="cancelled">Cancelados</option>
                <option value="pending">Pendentes</option>
              </select>

              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className={`text-xs px-4 py-2.5 rounded-xl border outline-none ${
                  isDark ? 'bg-[#0f0a26] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-700'
                }`}
              >
                <option value="date">Mais recentes</option>
                <option value="amount">Maior valor</option>
              </select>
            </>
          )}
        </div>

        {/* List Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader className="w-8 h-8 animate-spin text-neon-purple" />
          </div>
        ) : paged.length === 0 ? (
          <div className={`text-center py-20 rounded-2xl border ${isDark ? 'bg-white/[0.02] border-white/5' : 'bg-white border-gray-200'}`}>
            <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-gray-500" />
            <p className="text-sm text-gray-500 italic">
              {search ? 'Nenhum resultado encontrado para a busca.' : 'Nenhum registro encontrado.'}
            </p>
          </div>
        ) : activeTab === 'tips' ? (
          // Tips list (Gorjetas)
          <div className="space-y-3">
            {paged.map(order => {
              const cfg = statusConfig[order.pix_status || order.status] || statusConfig.pending;
              const artist = order.artist;
              const amount = Number(order.amount) || 0;
              const artistShare = amount * 0.70; // 70% share as per system config
              const pixStatusLabel = order.pix_status === 'transferred' ? 'Repassado' :
                order.pix_status === 'paid' ? 'Pago (Aguardando repasse)' :
                order.pix_status || order.status || 'Pendente';

              return (
                <div
                  key={order.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isDark ? 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]' : 'bg-white border-gray-200 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isDark ? 'bg-white/10' : 'bg-gray-100'
                      }`}>
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
                            #{String(order.id).substring(0, 8)}
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
                      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold mt-1 ${cfg.bg} ${cfg.color}`}>
                        {pixStatusLabel}
                      </div>
                      <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {formatTime(order.requested_at)}
                      </p>
                    </div>
                  </div>

                  {amount > 0 && (
                    <div className={`mt-3 pt-3 border-t ${isDark ? 'border-white/[0.06]' : 'border-gray-100'}`}>
                      <div className="flex flex-wrap items-center gap-4 text-xs">
                        <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>
                          Taxa TM (30%): <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>R$ {(amount * 0.30).toFixed(2)}</span>
                        </span>
                        <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>
                          Artista (70%): <span className="text-neon-green font-bold">R$ {artistShare.toFixed(2)}</span>
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
                          <span className="flex items-center gap-1 text-yellow-500 font-semibold">
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
        ) : (
          // PRO Subscriptions list
          <div className="space-y-3">
            {paged.map(sub => (
              <div
                key={sub.user_id}
                className={`p-4 rounded-2xl border transition-all ${
                  isDark ? 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]' : 'bg-white border-gray-200 hover:shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isDark ? 'bg-white/10' : 'bg-gray-100'
                    }`}>
                      {sub.photo_url ? (
                        <img src={sub.photo_url} alt="" className="w-full h-full rounded-xl object-cover" />
                      ) : (
                        <User className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {sub.artistic_name || 'Artista'}
                        </span>
                        <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />
                      </div>
                      <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        Assinatura: <span className="font-mono text-[10px]">{sub.asaas_subscription_id || 'Ativação Manual / Sem ID'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-lg text-neon-green">R$ 49,90</p>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-neon-green/10 text-neon-green mt-1">
                      Ativa
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className={`p-2.5 rounded-xl border transition-colors disabled:opacity-30 ${
                isDark ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white' : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {page + 1} de {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className={`p-2.5 rounded-xl border transition-colors disabled:opacity-30 ${
                isDark ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white' : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
