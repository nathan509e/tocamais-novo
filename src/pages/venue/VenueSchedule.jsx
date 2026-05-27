import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import AppLayout from '../../components/shared/AppLayout';
import { useAuth } from '../../lib/AuthContext';
import NeonButton from '../../components/ui/NeonButton';

const events = [];

export default function VenueSchedule() {
  const { user, userProfile } = useAuth();

  const [filter, setFilter] = useState('all');

  const filtered = events.filter(e => filter === 'all' || e.status === filter);
  const totalFee = filtered.reduce((acc, e) => acc + e.fee, 0);
  const confirmedCount = events.filter(e => e.status === 'confirmed').length;

  return (
    <AppLayout role="venue" userName={user?.name || ''} venueName={userProfile?.venue_name || ''}>
      <div className="px-4 py-5 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white font-bold text-xl">Agenda de Shows</h1>
            <p className="text-gray-400 text-sm">Junho 2026</p>
          </div>
          <NeonButton variant="purple" size="sm">
            <Plus className="w-4 h-4 inline mr-1" />
            Novo evento
          </NeonButton>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/8 text-center">
            <p className="text-neon-purple font-bold text-lg">{events.length}</p>
            <p className="text-gray-400 text-[10px]">Eventos totais</p>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/8 text-center">
            <p className="text-neon-green font-bold text-lg">{confirmedCount}</p>
            <p className="text-gray-400 text-[10px]">Confirmados</p>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/8 text-center">
            <p className="text-white font-bold text-sm">R${(totalFee / 1000).toFixed(0)}K</p>
            <p className="text-gray-400 text-[10px]">Total cachês</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {['all', 'confirmed', 'pending'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${filter === f ? 'bg-neon-purple text-white' : 'bg-white/5 text-gray-400 border border-white/10'}`}>
              {f === 'all' ? 'Todos' : f === 'confirmed' ? 'Confirmados' : 'Pendentes'}
            </button>
          ))}
        </div>

        {/* Events List */}
        <div className="space-y-3">
          {filtered.map((event, i) => (
            <motion.div key={event.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/8 hover:border-neon-purple/30 transition-all">
              <div className={`w-2 h-14 rounded-full flex-shrink-0 ${event.status === 'confirmed' ? 'bg-neon-green' : 'bg-yellow-400'}`} />
              <img src={event.avatar} alt={event.artist} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm">{event.artist}</p>
                <p className="text-gray-400 text-xs">{event.genre}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1 text-gray-400 text-xs">
                    <Calendar className="w-3 h-3" /> {event.date}
                  </div>
                  <div className="flex items-center gap-1 text-gray-400 text-xs">
                    <Clock className="w-3 h-3" /> {event.time}
                  </div>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-neon-green font-bold text-sm">R$ {event.fee.toLocaleString()}</p>
                <div className={`flex items-center gap-1 text-[10px] font-semibold mt-1 ${event.status === 'confirmed' ? 'text-neon-green' : 'text-yellow-400'}`}>
                  {event.status === 'confirmed' ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                  {event.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}