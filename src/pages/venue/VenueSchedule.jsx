import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import AppLayout from '../../components/shared/AppLayout';
import NeonButton from '../../components/ui/NeonButton';

const events = [
  { id: '1', artist: 'Lucas Volta', genre: 'Sertanejo', date: '10 Jun', time: '21h', status: 'confirmed', fee: 2800, audience: 200, avatar: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop' },
  { id: '2', artist: 'Dj Matteus', genre: 'Eletrônico', date: '14 Jun', time: '23h', status: 'confirmed', fee: 3200, audience: 350, avatar: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100&h=100&fit=crop' },
  { id: '3', artist: 'Sofia Neon', genre: 'Pop', date: '18 Jun', time: '21h', status: 'pending', fee: 1800, audience: 150, avatar: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&h=100&fit=crop' },
  { id: '4', artist: 'Trio Samba', genre: 'Samba', date: '21 Jun', time: '20h', status: 'confirmed', fee: 2500, audience: 180, avatar: 'https://images.unsplash.com/photo-1504898770365-14faca6a7320?w=100&h=100&fit=crop' },
  { id: '5', artist: 'Banda Nova Era', genre: 'Rock', date: '28 Jun', time: '21:30h', status: 'confirmed', fee: 4500, audience: 280, avatar: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&h=100&fit=crop' },
];

export default function VenueSchedule() {
  const [filter, setFilter] = useState('all');

  const filtered = events.filter(e => filter === 'all' || e.status === filter);
  const totalFee = filtered.reduce((acc, e) => acc + e.fee, 0);
  const confirmedCount = events.filter(e => e.status === 'confirmed').length;

  return (
    <AppLayout role="venue" userName="João Silva" venueName="Bar do João">
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