import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Search, MessageCircle, User, Music, Calendar,
  Bell, Settings, Menu, X, TrendingUp, Star, Zap
} from 'lucide-react';

const navItems = {
  artist: [
    { icon: Home, label: 'Início', path: '/artist' },
    { icon: Calendar, label: 'Agenda', path: '/artist/agenda' },
    { icon: TrendingUp, label: 'Métricas', path: '/artist/metrics' },
    { icon: MessageCircle, label: 'Mensagens', path: '/artist/messages' },
    { icon: User, label: 'Perfil', path: '/artist/profile' },
  ],
  venue: [
    { icon: Home, label: 'Painel', path: '/venue' },
    { icon: Search, label: 'Artistas', path: '/venue/artists' },
    { icon: Calendar, label: 'Agenda', path: '/venue/schedule' },
    { icon: MessageCircle, label: 'Chat', path: '/venue/messages' },
    { icon: Settings, label: 'Config', path: '/venue/settings' },
  ],
  contractor: [
    { icon: Home, label: 'Início', path: '/contractor' },
    { icon: Search, label: 'Buscar', path: '/contractor/search' },
    { icon: Star, label: 'Favoritos', path: '/contractor/favorites' },
    { icon: MessageCircle, label: 'Chat', path: '/contractor/messages' },
    { icon: User, label: 'Perfil', path: '/contractor/profile' },
  ],
};

export default function AppLayout({ children, role = 'artist', userName = 'Usuário', userAvatar = null, venueName = null }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifications] = useState(3);
  const location = useLocation();
  const nav = navItems[role] || navItems.artist;

  return (
    <div className="min-h-screen bg-app-dark font-poppins flex flex-col">
      {/* Ambient background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-neon-green/8 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-app-dark/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setMenuOpen(true)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
              <Menu className="w-5 h-5 text-white" />
            </button>
            <div>
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-gradient-neon flex items-center justify-center">
                  <Music className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-bold text-white text-sm">
                  Toca<span className="text-neon-purple">Mais</span>
                </span>
              </div>
              {venueName && <p className="text-gray-400 text-xs">{venueName}</p>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="relative p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
              <Bell className="w-5 h-5 text-white" />
              {notifications > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-neon-purple rounded-full text-white text-[9px] flex items-center justify-center font-bold">
                  {notifications}
                </span>
              )}
            </button>
            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-neon-purple/50 cursor-pointer">
              {userAvatar ? (
                <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-neon-purple to-neon-green flex items-center justify-center text-white font-bold text-xs">
                  {userName.charAt(0)}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Side Menu */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-app-dark border-r border-white/8 z-50 p-6"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-neon flex items-center justify-center">
                    <Music className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-bold text-white text-lg">
                    Toca<span className="text-neon-purple">Mais</span>
                  </span>
                </div>
                <button onClick={() => setMenuOpen(false)} className="p-2 rounded-xl bg-white/5">
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <nav className="space-y-1">
                {nav.map((item) => {
                  const Icon = item.icon;
                  const active = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/30' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium text-sm">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="absolute bottom-6 left-6 right-6">
                <Link
                  to="/"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all text-sm"
                >
                  <Zap className="w-4 h-4" />
                  <span>Trocar conta</span>
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 pt-16 pb-20 overflow-y-auto relative z-0">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-app-dark/90 backdrop-blur-xl border-t border-white/5">
        <div className="flex items-center justify-around px-2 py-2">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${active ? 'text-neon-purple' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <motion.div whileTap={{ scale: 0.9 }}>
                  <Icon className="w-5 h-5" />
                </motion.div>
                <span className="text-[10px] font-medium">{item.label}</span>
                {active && (
                  <motion.div layoutId="bottomNavIndicator" className="absolute bottom-0 w-6 h-0.5 bg-neon-purple rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}