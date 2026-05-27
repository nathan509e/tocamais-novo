import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, MapPin, Clock, DollarSign, CheckCircle, X, AlertCircle } from 'lucide-react';
import AppLayout from '../../components/shared/AppLayout';
import { useAuth } from '../../lib/AuthContext';
import NeonButton from '../../components/ui/NeonButton';

const shows = [];

const daysOfWeek = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const days = Array.from({ length: 30 }, (_, i) => i + 1);

export default function ArtistAgenda() {
  const { user } = useAuth();

  const [selectedDay, setSelectedDay] = useState(null);
  const currentMonth = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const showDays = shows.map(s => s.day);
  const selectedShows = shows.filter(s => s.day === selectedDay);

  return (
    <AppLayout role="artist" userName={user?.name || ''}>
      <div className="px-4 py-5 space-y-5">
        <div>
          <h1 className="text-white font-bold text-xl">Minha Agenda</h1>
          <p className="text-gray-400 text-sm">Gerencie seus shows e disponibilidade</p>
        </div>

        {/* Calendar */}
        <div className="bg-white/5 border border-white/8 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <button className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
              <ChevronLeft className="w-4 h-4 text-gray-400" />
            </button>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-neon-purple" />
              <span className="text-white font-semibold">{currentMonth}</span>
            </div>
            <button className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {daysOfWeek.map((d, i) => (
              <div key={i} className="text-center text-gray-500 text-xs font-semibold py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {/* Offset for month start (Sunday) */}
            {[0, 1].map(i => <div key={`empty-${i}`} />)}
            {days.map(day => {
              const hasShow = showDays.includes(day);
              const isSelected = selectedDay === day;
              return (
                <motion.button
                  key={day}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={`
                    aspect-square rounded-xl text-xs font-semibold flex flex-col items-center justify-center transition-all relative
                    ${isSelected ? 'bg-neon-purple text-white shadow-[0_0_15px_rgba(123,46,255,0.5)]' :
                      hasShow ? 'bg-neon-purple/15 text-neon-purple hover:bg-neon-purple/25' :
                      'text-gray-400 hover:bg-white/5'}
                  `}
                >
                  {day}
                  {hasShow && !isSelected && <div className="w-1 h-1 bg-neon-green rounded-full mt-0.5" />}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Show Details */}
        <AnimatePresence>
          {selectedDay && selectedShows.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              <p className="text-gray-400 text-sm">Dia {selectedDay} de Junho</p>
              {selectedShows.map(show => (
                <div key={show.id} className="p-4 rounded-2xl bg-white/5 border border-white/8">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-white font-bold">{show.venue}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1 text-gray-400 text-xs">
                          <Clock className="w-3 h-3" /> {show.time}
                        </div>
                        <div className="flex items-center gap-1 text-gray-400 text-xs">
                          <MapPin className="w-3 h-3" /> {show.city}
                        </div>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${show.status === 'confirmed' ? 'bg-neon-green/15 text-neon-green' : 'bg-yellow-500/15 text-yellow-400'}`}>
                      {show.status === 'confirmed' ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                      {show.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-neon-green font-bold">
                      <DollarSign className="w-4 h-4" />
                      R$ {show.fee.toLocaleString()}
                    </div>
                    <div className="flex gap-2">
                      <NeonButton variant="ghost" size="sm">Ver detalhes</NeonButton>
                      {show.status === 'pending' && <NeonButton variant="green" size="sm">Aceitar</NeonButton>}
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
          {selectedDay && selectedShows.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="p-4 rounded-2xl bg-white/5 border border-dashed border-white/15 text-center">
              <p className="text-gray-400 text-sm">Você está livre neste dia</p>
              <p className="text-gray-600 text-xs mt-1">Perfeito para aceitar novas propostas!</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* All upcoming */}
        <div>
          <h3 className="text-white font-semibold text-sm mb-3">Todos os Eventos</h3>
          <div className="space-y-3">
            {shows.map((show, i) => (
              <motion.div key={show.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/8 hover:border-neon-purple/30 transition-all">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${show.status === 'confirmed' ? 'bg-neon-green/15' : 'bg-yellow-500/15'}`}>
                  <span className="text-white font-bold text-sm">{show.day}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{show.venue}</p>
                  <p className="text-gray-400 text-xs">{show.city} • {show.time}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-neon-green font-bold text-sm">R$ {show.fee.toLocaleString()}</p>
                  <span className={`text-[10px] ${show.status === 'confirmed' ? 'text-neon-green' : 'text-yellow-400'}`}>
                    {show.status === 'confirmed' ? '✓ Confirmado' : '⏳ Pendente'}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}