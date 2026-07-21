import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useAuth } from '@/lib/AuthContext';
import { useTheme } from '@/lib/ThemeContext';
import logoTocaMais from '@/assets/logo-tocamais.png';
import { supabase } from '@/lib/supabaseClient';
import { 
  Search, Bell, Home, Video, Mail, User as UserIcon, LogOut, Menu, X, Calendar, Music, Sun, Moon, Mailbox,
  Crown, CreditCard, Loader2, Check, Sparkles, ChevronDown, ChevronUp
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const navItems = {
  artist: [
    { icon: Home, label: 'Painel', path: '/artist' },
    { 
      label: 'Palco', 
      isSubmenu: true, 
      icon: Music, 
      items: [
        { label: 'Pedidos', path: '/artist/requests' },
        { label: 'Repertório', path: '/artist', hash: '#repertorio' },
        { label: 'Gorjetas', path: '/artist/onboarding' }
      ]
    },
    { icon: Calendar, label: 'Agenda', path: '/artist/agenda' },
    { icon: Video, label: 'Métricas', path: '/artist/metrics' },
    { icon: Mailbox, label: 'Propostas', path: '/artist/proposals' },
    { icon: Mail, label: 'Mensagens', path: '/artist/messages' },
    { icon: UserIcon, label: 'Perfil', path: '/artist/profile' },
  ],
  venue: [
    { icon: Home, label: 'Painel', path: '/venue' },
    { icon: Search, label: 'Artistas', path: '/venue/artists' },
    { icon: Calendar, label: 'Agenda', path: '/venue/schedule' },
    { icon: Mail, label: 'Mensagens', path: '/venue/messages' },
  ],
  contractor: [
    { icon: Home, label: 'Painel', path: '/contractor' },
    { icon: Search, label: 'Buscar', path: '/contractor/search' },
    { icon: Video, label: 'Favoritos', path: '/contractor/favorites' },
    { icon: Mail, label: 'Mensagens', path: '/contractor/messages' },
    { icon: UserIcon, label: 'Perfil', path: '/contractor/profile' },
  ],
  admin: [
    { icon: Home, label: 'Painel Admin', path: '/admin' },
    { icon: Mail, label: 'Pedidos PIX', path: '/admin/orders' },
  ],
};

export default function AppLayout({ children, role = 'artist' }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userProfile, logout, refreshProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('Maio 2026');
  const [notifications, setNotifications] = useState([]);
  const [showProModal, setShowProModal] = useState(false);
  const [proLoading, setProLoading] = useState(false);
  const [proError, setProError] = useState('');
  const [proSuccess, setProSuccess] = useState(false);
  const [proQrCode, setProQrCode] = useState(null);
  const [proPixPayload, setProPixPayload] = useState(null);
  const [proCpf, setProCpf] = useState('');
  const [proPaymentCompleted, setProPaymentCompleted] = useState(false);
  const [showPalcoSubmenu, setShowPalcoSubmenu] = useState(
    location.pathname === '/artist/requests' || location.pathname === '/artist/onboarding'
  );

  // Reset subscription modal state when closed
  useEffect(() => {
    if (!showProModal) {
      setProLoading(false);
      setProError('');
      setProSuccess(false);
      setProQrCode(null);
      setProPixPayload(null);
      setProPaymentCompleted(false);
    }
  }, [showProModal]);

  // Monitor payment success in real-time or via polling
  useEffect(() => {
    if (!showProModal || !proSuccess || !proQrCode || !user?.id || role !== 'artist') return;

    let intervalId;
    let channel;

    const checkPaymentStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('artists')
          .select('is_pro')
          .eq('user_id', user.id)
          .single();

        if (data && data.is_pro) {
          handlePaymentSuccess();
        }
      } catch (err) {
        console.error('Error polling payment status:', err);
      }
    };

    const triggerCelebration = () => {
      const duration = 4 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      const randomInRange = (min, max) => Math.random() * (max - min) + min;

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);
    };

    const handlePaymentSuccess = async () => {
      if (intervalId) clearInterval(intervalId);
      if (channel) supabase.removeChannel(channel);

      setProPaymentCompleted(true);
      triggerCelebration();
      if (refreshProfile) {
        await refreshProfile();
      }
    };

    // Realtime subscription
    channel = supabase
      .channel('pro-payment-realtime')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'artists',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        if (payload.new && payload.new.is_pro) {
          handlePaymentSuccess();
        }
      })
      .subscribe();

    // Polling interval backup
    intervalId = setInterval(checkPaymentStatus, 3000);

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (channel) supabase.removeChannel(channel);
    };
  }, [showProModal, proSuccess, proQrCode, user?.id, role, refreshProfile]);

  useEffect(() => {
    if (!user?.id) return;

    // Initial fetch
    supabase.from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data, error }) => {
        if (data) setNotifications(data);
      });

    // Realtime subscription for new notifications
    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev].slice(0, 20));
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        setNotifications(prev => prev.map(n => n.id === payload.new.id ? payload.new : n));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const activeRole = userProfile?.role || user?.user_metadata?.role || user?.role || role;
  const nav = navItems[activeRole] || navItems.artist;
  const username = user?.full_name || user?.name || 'Usuário';
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleSubscribePro = async () => {
    setProLoading(true);
    setProError('');
    setProQrCode(null);
    setProPixPayload(null);
    setProSuccess(false);
    try {
      const { data, error } = await supabase.functions.invoke('asaas-create-pix', {
        body: {
          amount: 49.90,
          customerName: username,
          customerEmail: user?.email,
          customerTaxId: proCpf.replace(/\D/g, ''),
          artistUserId: user?.id,
          billingType: 'PIX',
          description: 'TocaMais Pro - Assinatura Mensal',
          mode: 'subscription',
        }
      });
      if (error || data?.error) {
        throw new Error(data?.error || error?.message || 'Erro ao criar assinatura');
      }
      setProQrCode(data.pixQrCode);
      setProPixPayload(data.pixPayload);
      setProSuccess(true);
    } catch (err) {
      setProError(err.message || 'Erro inesperado');
    } finally {
      setProLoading(false);
    }
  };

  // Bottom nav mobile: artist gets only 4 core items
  const mobileBottomNav = activeRole === 'artist'
    ? [
        { icon: Home, label: 'Painel', path: '/artist' },
        { icon: Mailbox, label: 'Propostas', path: '/artist/proposals' },
        { icon: Music, label: 'Pedidos', path: '/artist/requests' },
        { icon: Mail, label: 'Mensagens', path: '/artist/messages' },
      ]
    : activeRole === 'admin'
      ? [
          { icon: Home, label: 'Painel Admin', path: '/admin' },
          { icon: Mail, label: 'Pedidos PIX', path: '/admin/orders' },
        ]
      : nav;

  const isDark = theme === 'dark';

  const formatCpf = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  };

  const isCpfValid = (cpf) => cpf.replace(/\D/g, '').length === 11;

  const renderNavItem = (item, isMobile = false) => {
    const Icon = item.icon;
    
    if (item.isSubmenu) {
      const isOpen = showPalcoSubmenu;
      return (
        <div key="palco-submenu-container" className="space-y-1">
          <button
            onClick={() => setShowPalcoSubmenu(!showPalcoSubmenu)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
              isOpen
                ? isDark 
                  ? 'text-white bg-white/5' 
                  : 'text-gray-900 bg-gray-100'
                : isDark
                  ? 'text-gray-400 hover:text-white hover:bg-white/5'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <Icon className={`w-5 h-5 ${isOpen ? 'text-neon-purple' : isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              <span className="text-sm">{item.label}</span>
            </div>
            {isOpen ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
          </button>
          {isOpen && (
            <div className="pl-6 space-y-1">
              {item.items.map((subItem) => {
                const active = location.pathname === subItem.path && (subItem.hash ? location.hash === subItem.hash : true);
                return (
                  <Link
                    key={subItem.label + subItem.path}
                    to={subItem.path + (subItem.hash || '')}
                    onClick={() => {
                      if (isMobile) setShowMobileSidebar(false);
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs transition-all ${
                      active
                        ? isDark
                          ? 'bg-neon-purple/20 text-white font-bold border-l-2 border-neon-purple'
                          : 'bg-neon-purple/10 text-neon-purple font-bold border-l-2 border-neon-purple'
                        : isDark
                          ? 'text-gray-400 hover:text-white'
                          : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <span>{subItem.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    const active = location.pathname === item.path;
    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={() => {
          if (isMobile) setShowMobileSidebar(false);
        }}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
          active 
            ? isDark 
              ? 'bg-neon-purple/20 text-white border-l-4 border-neon-purple font-bold shadow-[0_0_15px_rgba(123,46,255,0.15)]' 
              : 'bg-neon-purple/10 text-neon-purple border-l-4 border-neon-purple font-bold shadow-sm'
            : isDark 
              ? 'text-gray-400 hover:text-white hover:bg-white/5' 
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
        }`}
      >
        <Icon className={`w-5 h-5 ${active ? 'text-neon-purple' : isDark ? 'text-gray-400' : 'text-gray-500'}`} />
        <span className="text-sm">{item.label}</span>
      </Link>
    );
  };

  return (
    <div className={`min-h-screen font-poppins flex flex-col md:flex-row relative overflow-x-hidden transition-colors duration-300 ${
      isDark ? 'bg-[#08041A] text-white' : 'bg-[#F4F5FA] text-gray-800'
    }`}>
      
      {/* Background Glows */}
      {isDark ? (
        <>
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-[#7B2EFF]/5 blur-[120px] pointer-events-none z-0" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-[#39FF6A]/5 blur-[120px] pointer-events-none z-0" />
        </>
      ) : (
        <>
          <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-[#7B2EFF]/3 blur-[100px] pointer-events-none z-0" />
        </>
      )}

      {/* DESKTOP SIDEBAR */}
      <aside className={`hidden md:flex flex-col w-64 border-r p-6 h-screen sticky top-0 z-30 transition-colors duration-300 ${
        isDark ? 'bg-[#0F0926] border-white/5' : 'bg-[#FFFFFF] border-gray-200/80 shadow-sm'
      }`}>
          {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <img src={logoTocaMais} alt="TocaMais" className="w-9 h-9 rounded-xl object-cover" />
                    alt="Avatar" 
                    className="w-9 h-9 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <p className="text-xs font-bold truncate">{username}</p>
                      {role === 'artist' && userProfile?.is_pro && <Crown className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />}
                    </div>
                    <p className="text-[9px] text-neon-green uppercase font-bold tracking-wider">
                      {role === 'artist' ? 'Artista' : role === 'venue' ? 'Casa Show' : 'Contratante'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => logout()}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sair da Conta</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* SER PRO MODAL */}
      <Dialog open={showProModal} onOpenChange={setShowProModal}>
        <DialogContent className={`sm:max-w-md border-0 overflow-hidden ${
          isDark ? 'bg-[#0F0926] text-white' : 'bg-white text-gray-800'
        }`}>
          {/* Gradient top bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#7B2EFF] to-[#39FF6A]" />
          
          {proPaymentCompleted ? (
            <div className="flex flex-col items-center justify-center py-6 text-center space-y-6">
              <div className="relative mt-2 animate-bounce">
                {/* Glow ring */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#7B2EFF] to-[#39FF6A] blur-lg opacity-60 animate-pulse" />
                <div className={`relative w-20 h-20 rounded-full border-2 flex items-center justify-center ${
                  isDark ? 'bg-[#0F0926] border-[#39FF6A]' : 'bg-white border-[#39FF6A]'
                }`}>
                  <Check className="w-10 h-10 text-[#39FF6A] drop-shadow-[0_0_8px_rgba(57,255,106,0.5)]" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Parabéns! Você é Pro!
                </h3>
                <p className={`text-sm max-w-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Sua assinatura <span className="font-bold text-[#7B2EFF]">TocaMais Pro</span> foi ativada com sucesso. Aproveite todos os benefícios exclusivos!
                </p>
              </div>

              <div className={`rounded-xl p-4 w-full space-y-2 ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-2.5 text-left text-xs font-semibold">
                  <Check className="w-4 h-4 text-[#39FF6A]" />
                  <span>Selo Pro no seu perfil</span>
                </div>
                <div className="flex items-center gap-2.5 text-left text-xs font-semibold">
                  <Check className="w-4 h-4 text-[#39FF6A]" />
                  <span>Destaque nas buscas de contratantes</span>
                </div>
              </div>

              <button
                onClick={() => setShowProModal(false)}
                className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#7B2EFF] to-[#39FF6A] shadow-[0_0_25px_rgba(123,46,255,0.3)] hover:shadow-[0_0_35px_rgba(123,46,255,0.5)] transition-all flex items-center justify-center gap-2"
              >
                <span>Acessar Recursos Pro</span>
              </button>
            </div>
          ) : (
            <>
              <DialogHeader className="pt-2">
                <div className="flex items-center justify-center mb-3">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#7B2EFF] to-[#39FF6A] flex items-center justify-center shadow-[0_0_30px_rgba(123,46,255,0.4)]">
                    <Crown className="w-7 h-7 text-white" />
                  </div>
                </div>
                <DialogTitle className={`text-center text-xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  TocaMais Pro
                </DialogTitle>
                <DialogDescription className={`text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Desbloqueie recursos exclusivos para sua carreira musical
                </DialogDescription>
              </DialogHeader>

              {/* Features list */}
              <div className={`rounded-xl p-4 space-y-3 ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[#7B2EFF]/20 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-[#7B2EFF]" />
                  </div>
                  <span className="text-sm font-medium">Destaque nos resultados de busca</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[#39FF6A]/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-[#39FF6A]" />
                  </div>
                  <span className="text-sm font-medium">Selo de verificação Pro</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[#7B2EFF]/20 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-[#7B2EFF]" />
                  </div>
                  <span className="text-sm font-medium">100% das gorjetas</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[#39FF6A]/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-[#39FF6A]" />
                  </div>
                  <span className="text-sm font-medium">Suporte prioritário</span>
                </div>
              </div>

              {/* Price */}
              <div className="text-center py-2">
                <span className={`text-3xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>R$ 49,90</span>
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>/mês</span>
              </div>

              {/* CPF Input */}
              {!proSuccess && !proQrCode && (
                <div>
                  <label className={`text-xs font-semibold mb-1.5 block ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    CPF (obrigatório para assinatura)
                  </label>
                  <input
                    type="text"
                    value={proCpf}
                    onChange={(e) => setProCpf(formatCpf(e.target.value))}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium border outline-none transition-all ${
                      isDark
                        ? 'bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[#7B2EFF]'
                        : 'bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400 focus:border-[#7B2EFF]'
                    }`}
                  />
                </div>
              )}

              {/* Error */}
              {proError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
                  <p className="text-xs text-red-400 font-medium">{proError}</p>
                </div>
              )}

              {/* Success - Show QR Code */}
              {proSuccess && proQrCode ? (
                <div className="space-y-4">
                  <div className={`rounded-xl p-4 text-center space-y-3 ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                    <p className="text-xs font-bold text-neon-green uppercase tracking-wider">Pague com PIX</p>
                    <div className="bg-white rounded-xl p-3 inline-block">
                      <img 
                        src={`data:image/png;base64,${proQrCode}`} 
                        alt="QR Code PIX" 
                        className="w-48 h-48 mx-auto"
                      />
                    </div>
                    {proPixPayload && (
                      <div>
                        <p className={`text-[10px] mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Ou copie o código PIX:</p>
                        <button
                          onClick={() => navigator.clipboard.writeText(proPixPayload)}
                          className={`text-[10px] px-3 py-1.5 rounded-lg border transition-colors ${
                            isDark ? 'bg-white/5 border-white/10 hover:bg-white/10 text-gray-300' : 'bg-gray-100 border-gray-200 hover:bg-gray-200 text-gray-600'
                          }`}
                        >
                          Copiar código
                        </button>
                      </div>
                    )}
                  </div>
                  <p className={`text-[10px] text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    Após o pagamento, seu acesso Pro será ativado automaticamente.
                  </p>
                </div>
              ) : (
                /* Subscribe Button */
                <button
                  onClick={handleSubscribePro}
                  disabled={proLoading || !isCpfValid(proCpf)}
                  className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#7B2EFF] to-[#39FF6A] shadow-[0_0_25px_rgba(123,46,255,0.3)] hover:shadow-[0_0_35px_rgba(123,46,255,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {proLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Gerando cobrança...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Assinar Agora</span>
                    </>
                  )}
                </button>
              )}

              <p className={`text-[10px] text-center ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                Cobrança recorrente. Cancele quando quiser.
              </p>
            </>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
