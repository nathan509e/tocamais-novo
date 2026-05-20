import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Bell, Home, Search as SearchIcon, Radio, MessageCircle, User } from 'lucide-react';

const liveStreams = [
  {
    id: 1,
    artist: 'Laxy Music',
    subtitle: 'Emma Namest',
    viewers: '4,7M',
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&h=200&fit=crop',
    live: true,
  },
  {
    id: 2,
    artist: 'Ranwita Minra',
    subtitle: 'Sono Music',
    viewers: '4,1M',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=200&fit=crop',
    live: true,
  },
  {
    id: 3,
    artist: "What's Hap",
    subtitle: 'Haria Moono',
    viewers: '4,2M',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=200&fit=crop',
    live: true,
  },
];

const musicians = [
  { id: 1, name: 'Laxy Music', image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=120&h=120&fit=crop&face', online: true, path: '/contractor' },
  { id: 2, name: 'Jonss', image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=120&h=120&fit=crop', online: true, path: '/venue' },
  { id: 3, name: 'Verdy Pairra', image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=120&h=120&fit=crop', online: false, path: '/contractor' },
  { id: 4, name: 'Jalisa', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=120&h=120&fit=crop', online: true, path: '/contractor' },
];

const tabs = [
  { id: 'home', icon: Home, label: 'Home', path: null },
  { id: 'search', icon: SearchIcon, label: 'Search', path: '/contractor/search' },
  { id: 'live', icon: Radio, label: 'Live', path: '/artist' },
  { id: 'messages', icon: MessageCircle, label: 'Messages', path: '/artist/messages' },
  { id: 'profile', icon: User, label: 'Profile', path: '/contractor/profile' },
];

export default function Landing() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  const [activeFilter, setActiveFilter] = useState('live');

  return (
    <div className="min-h-screen bg-white font-poppins flex flex-col max-w-md mx-auto relative">
      {/* Status bar spacer */}
      <div className="h-2" />

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <h1 className="text-2xl font-black text-gray-900">
          TocaMais
        </h1>
        <div className="flex items-center gap-3">
          <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
            <Search className="w-4 h-4 text-gray-600" />
          </button>
          <button className="relative w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
            <Bell className="w-4 h-4 text-gray-600" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-3 px-5 mb-5">
        <button
          onClick={() => setActiveFilter('live')}
          className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
            activeFilter === 'live'
              ? 'text-white'
              : 'bg-gray-100 text-gray-500'
          }`}
          style={activeFilter === 'live' ? { background: 'linear-gradient(90deg, #7B2EFF, #39FF6A)' } : {}}
        >
          Live Music
        </button>
        <button
          onClick={() => setActiveFilter('search')}
          className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
            activeFilter === 'search'
              ? 'text-white'
              : 'bg-gray-100 text-gray-500'
          }`}
          style={activeFilter === 'search' ? { background: 'linear-gradient(90deg, #7B2EFF, #39FF6A)' } : {}}
        >
          Search
        </button>
      </div>

      {/* Popular Live Streams */}
      <div className="px-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-gray-900 font-bold text-base">Popular Live Streams</h2>
          <button onClick={() => navigate('/artist')} className="text-neon-purple text-sm font-semibold">See All</button>
        </div>
        <div className="flex gap-3 overflow-x-auto scrollbar-none -mx-5 px-5">
          {liveStreams.map((stream, i) => (
            <motion.div
              key={stream.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => navigate('/artist')}
              className="flex-shrink-0 w-36 cursor-pointer"
            >
              <div className="relative w-36 h-24 rounded-2xl overflow-hidden">
                <img src={stream.image} alt={stream.artist} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                {stream.live && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    LIVE
                  </div>
                )}
                <div className="absolute bottom-2 left-2 flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-white/20 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  </div>
                  <span className="text-white text-[10px] font-semibold">{stream.viewers}</span>
                </div>
              </div>
              <div className="mt-1.5">
                <p className="text-gray-900 font-semibold text-xs">{stream.artist}</p>
                <p className="text-gray-400 text-[10px]">{stream.subtitle}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Find Musicians */}
      <div className="px-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-gray-900 font-bold text-base">Find Musicians</h2>
          <button onClick={() => navigate('/contractor/search')} className="text-neon-purple text-sm font-semibold">See All</button>
        </div>
        <div className="flex gap-4 overflow-x-auto scrollbar-none -mx-5 px-5 pb-1">
          {musicians.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
              className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer"
              onClick={() => navigate(m.path)}
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-md">
                  <img src={m.image} alt={m.name} className="w-full h-full object-cover" />
                </div>
                {m.online && (
                  <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-neon-green rounded-full border-2 border-white" />
                )}
              </div>
              <p className="text-gray-800 text-[11px] font-semibold text-center w-16 truncate">{m.name}</p>
              <button
                className="px-4 py-1 rounded-full text-[11px] font-bold text-white"
                style={{ background: 'linear-gradient(90deg, #7B2EFF, #39FF6A)' }}
              >
                Join
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* My Profile */}
      <div className="px-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-gray-900 font-bold text-base">My Profile</h2>
          <button className="text-neon-purple text-sm font-semibold">See All</button>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          onClick={() => navigate('/artist')}
          className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
        >
          <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
            <img
              src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop"
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1">
            <p className="text-gray-900 font-bold text-sm">JoseMoith</p>
            <p className="text-gray-400 text-xs">@jonsontmcmtooni</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center">
            <span className="text-gray-400 text-lg">›</span>
          </div>
        </motion.div>
      </div>

      {/* Spacer for bottom nav */}
      <div className="flex-1" />

      {/* Bottom Navigation */}
      <div className="sticky bottom-0 bg-white border-t border-gray-100 px-2 py-3">
        <div className="flex items-center justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.path) navigate(tab.path);
                }}
                className="flex flex-col items-center gap-1 px-3"
              >
                <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-neon-purple' : 'text-gray-400'}`} />
                <span className={`text-[10px] font-medium ${isActive ? 'text-neon-purple' : 'text-gray-400'}`}>
                  {tab.label}
                </span>
                {isActive && (
                  <div className="w-1 h-1 rounded-full bg-neon-purple" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}