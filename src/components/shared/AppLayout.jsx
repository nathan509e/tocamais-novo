import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { useTheme } from '@/lib/ThemeContext';
import { supabase } from '@/lib/supabaseClient';
import { 
  Search, Bell, Home, Video, Mail, User as UserIcon, LogOut, Menu, X, Calendar, Music, Sun, Moon, Mailbox
} from 'lucide-react';

const navItems = {
  artist: [
    { icon: Home, label: 'Painel', path: '/artist' },
    { icon: Calendar, label: 'Agenda', path: '/artist/agenda' },
    { icon: Video, label: 'Métricas', path: '/artist/metrics' },
    { icon: Mailbox, label: 'Propostas', path: '/artist/proposals' },
    { icon: Music, label: 'Pedidos', path: '/artist/requests' },
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
};

export default function AppLayout({ children, role = 'artist' }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userProfile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('Maio 2026');
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user?.id) return;
    supabase.from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) setNotifications(data);
      });
  }, [user?.id]);

  const nav = navItems[role] || navItems.artist;
  const username = user?.full_name || user?.name || 'Usuário';
  const unreadCount = notifications.filter(n => !n.read).length;

  const mobileNav = role === 'artist'
    ? [
        { icon: Home, label: 'Painel', path: '/artist' },
        { icon: Calendar, label: 'Agenda', path: '/artist/agenda' },
        { icon: Music, label: 'Pedidos', path: '/artist/requests' },
        { icon: Mail, label: 'Mensagens', path: '/artist/messages' },
        { icon: UserIcon, label: 'Perfil', path: '/artist/profile' },
      ]
    : nav;

  const isDark = theme === 'dark';

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
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7B2EFF] to-[#39FF6A] flex items-center justify-center shadow-[0_0_15px_rgba(123,46,255,0.4)]">
            <span className="text-white font-black text-sm">T</span>
          </div>
          <span className={`text-lg font-black tracking-wider ${isDark ? 'text-white' : 'text-gray-900'}`}>TocaMais</span>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-2">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-4 px-2">Menu Principal</p>
          {nav.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  active 
                    ? isDark 
                      ? 'bg-neon-purple/20 text-white border-l-4 border-neon-purple shadow-[0_0_15px_rgba(123,46,255,0.15)] font-bold' 
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
          })}
        </nav>

        {/* User profile section at the bottom of sidebar */}
        <div className={`border-t pt-4 mt-auto ${isDark ? 'border-white/5' : 'border-gray-200'}`}>
          <div className="flex items-center gap-3 mb-3">
            <img 
              src={userProfile?.photo_url || userProfile?.logo_url || user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop'} 
              alt="Avatar" 
              className="w-10 h-10 rounded-xl object-cover border border-white/10"
            />
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{username}</p>
              <p className="text-[10px] text-neon-green uppercase font-bold tracking-wider">
                {role === 'artist' ? 'Artista' : role === 'venue' ? 'Casa Show' : 'Contratante'}
              </p>
            </div>
          </div>
          <button 
            onClick={() => logout()}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair da Conta</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 z-10 pb-20 md:pb-0">
        
        {/* HEADER */}
        <header className={`sticky top-0 backdrop-blur-md border-b px-4 md:px-8 py-4 flex items-center justify-between z-30 transition-colors duration-300 ${
          isDark ? 'bg-[#08041A]/80 border-white/5' : 'bg-white/80 border-gray-200 shadow-xs'
        }`}>
          <div className="flex items-center gap-3">
            {/* Mobile Sidebar Trigger */}
            <button 
              onClick={() => setShowMobileSidebar(true)} 
              className={`md:hidden p-2 rounded-lg border ${
                isDark ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'
              }`}
            >
              <Menu className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-700'}`} />
            </button>
            
            {/* Page Header text */}
            <div className="hidden sm:block">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Plataforma Digital</span>
              <h2 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>TocaMais • Conexão Musical</h2>
            </div>
            
            {/* Mobile Logo */}
            <div className="flex md:hidden items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#7B2EFF] to-[#39FF6A] flex items-center justify-center">
                <span className="text-white font-black text-xs">T</span>
              </div>
              <span className={`text-sm font-black tracking-wider ${isDark ? 'text-white' : 'text-gray-900'}`}>TocaMais</span>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl border transition-colors ${
                isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-gray-100 border-gray-200 hover:bg-gray-200'
              }`}
              title={isDark ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-yellow-400" />
              ) : (
                <Moon className="w-4 h-4 text-purple-600" />
              )}
            </button>

            {/* Month selector */}
            {(role === 'venue' || role === 'artist') && (
              <div className="relative">
                <select 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className={`border text-xs rounded-xl px-3 py-1.5 outline-none cursor-pointer focus:border-neon-purple/50 appearance-none pr-8 transition-colors ${
                    isDark ? 'bg-white/5 border-white/10 text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-700'
                  }`}
                >
                  <option value="Maio 2026" className={isDark ? 'bg-[#0F0926]' : 'bg-white'}>Maio 2026</option>
                  <option value="Junho 2026" className={isDark ? 'bg-[#0F0926]' : 'bg-white'}>Junho 2026</option>
                  <option value="Julho 2026" className={isDark ? 'bg-[#0F0926]' : 'bg-white'}>Julho 2026</option>
                </select>
                <Calendar className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}

            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2 rounded-xl border transition-colors relative ${
                  isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-gray-100 border-gray-200 hover:bg-gray-200'
                }`}
              >
                <Bell className={`w-4 h-4 ${isDark ? 'text-white' : 'text-gray-700'}`} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-neon-purple rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowNotifications(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className={`absolute right-0 mt-2 w-80 border rounded-2xl p-4 shadow-2xl z-40 ${
                        isDark ? 'bg-[#0F0926] border-white/10 text-white' : 'bg-white border-gray-200 text-gray-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
                        <h4 className="text-xs font-bold uppercase tracking-wider">Notificações</h4>
                        <span className="text-[10px] text-neon-green font-semibold cursor-pointer">Limpar tudo</span>
                      </div>
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {notifications.length === 0 && (
                          <p className="text-xs text-gray-500 text-center py-4">Nenhuma notificação</p>
                        )}
                        {notifications.map(n => (
                          <div 
                            key={n.id} 
                            className={`p-2.5 rounded-xl transition-colors cursor-pointer ${
                              isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'
                            } ${!n.read ? 'border-l-2 border-neon-purple' : ''}`}
                          >
                            <p className="text-xs font-bold">{n.title}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{n.content}</p>
                            <span className="text-[9px] text-gray-500 mt-1 block">
                              {new Date(n.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Logout Mobile */}
            <button 
              onClick={() => logout()}
              className="md:hidden p-2 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors"
            >
              <LogOut className="w-4 h-4 text-red-400" />
            </button>
          </div>
        </header>

        {/* CONTENT AREA */}
        <main className="flex-1 px-4 md:px-8 py-6 w-full max-w-7xl mx-auto z-10">
          {children}
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 border-t px-4 py-2 flex items-center justify-around z-40 pb-5 ${
        isDark ? 'bg-[#0F0926] border-white/5' : 'bg-[#FFFFFF] border-gray-200 shadow-sm'
      }`}>
        {nav.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center gap-1 py-1"
            >
              <motion.div whileTap={{ scale: 0.9 }}>
                <Icon className={`w-5 h-5 ${active ? 'text-neon-purple' : isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              </motion.div>
              <span className={`text-[9px] uppercase tracking-wider ${active ? 'font-semibold text-neon-purple' : isDark ? 'font-medium text-gray-400' : 'font-medium text-gray-500'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* MOBILE SIDEBAR DRAWER */}
      <AnimatePresence>
        {showMobileSidebar && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileSidebar(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className={`fixed top-0 bottom-0 left-0 w-64 p-6 z-50 flex flex-col md:hidden ${
                isDark ? 'bg-[#0F0926] text-white' : 'bg-white text-gray-800 border-r border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7B2EFF] to-[#39FF6A] flex items-center justify-center">
                    <span className="text-white font-black text-xs">T</span>
                  </div>
                  <span className="text-sm font-black tracking-wider">TocaMais</span>
                </div>
                <button 
                  onClick={() => setShowMobileSidebar(false)}
                  className={`p-1 rounded-lg border ${
                    isDark ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <nav className="flex-1 space-y-2">
        {mobileNav.map((item) => {
                  const Icon = item.icon;
                  const active = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setShowMobileSidebar(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        active 
                          ? isDark 
                            ? 'bg-neon-purple/20 text-white border-l-4 border-neon-purple font-bold' 
                            : 'bg-neon-purple/10 text-neon-purple border-l-4 border-neon-purple font-bold shadow-xs'
                          : isDark 
                            ? 'text-gray-400 hover:text-white' 
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className={`border-t pt-4 mt-auto ${isDark ? 'border-white/5' : 'border-gray-200'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <img 
              src={userProfile?.photo_url || userProfile?.logo_url || user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop'} 
                    alt="Avatar" 
                    className="w-9 h-9 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold truncate">{username}</p>
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

    </div>
  );
}
