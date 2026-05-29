import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  Clock, 
  DollarSign, 
  CheckCircle, 
  X, 
  AlertCircle, 
  RefreshCw, 
  Settings, 
  Check, 
  Lock, 
  ShieldAlert, 
  ArrowLeftRight, 
  HelpCircle, 
  Loader2, 
  CalendarRange, 
  Eye, 
  Speaker, 
  Users 
} from 'lucide-react';
import AppLayout from '../../components/shared/AppLayout';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import NeonButton from '../../components/ui/NeonButton';

// Inline Google Logo SVG Component for Authenticity
const GoogleIcon = () => (
  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const daysOfWeek = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export default function ArtistAgenda() {
  const { user, userProfile } = useAuth();
  
  // Calendar Month Navigation State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  
  // Database States
  const [shows, setShows] = useState([]);
  const [busyDates, setBusyDates] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);

  // Google Sync States (Stored in localStorage for persistence in demo)
  const [isGoogleConnected, setIsGoogleConnected] = useState(() => {
    return localStorage.getItem('tocamais_google_connected') === 'true';
  });
  const [googleEmail, setGoogleEmail] = useState(() => {
    return localStorage.getItem('tocamais_google_email') || 'lucas.volta@gmail.com';
  });
  const [selectedCalendar, setSelectedCalendar] = useState('primary');
  const [syncOptions, setSyncOptions] = useState({
    importBlocks: true,
    exportShows: true,
    autoSync: true
  });
  const [lastSync, setLastSync] = useState(() => {
    return localStorage.getItem('tocamais_google_last_sync') || '';
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authStep, setAuthStep] = useState(1);
  const [successToast, setSuccessToast] = useState('');
  const [detailShow, setDetailShow] = useState(null);

  // Fetch Agenda Details
  const fetchAgendaData = async () => {
    if (!userProfile?.id) return;
    setLoading(true);
    try {
      // Fetch shows
      const { data: eventsData, error: eventsErr } = await supabase
        .from('events')
        .select('*')
        .eq('artist_id', userProfile.id);
      
      if (eventsData) {
        setShows(eventsData);
      }

      // Fetch busy dates
      const { data: agendaData, error: agendaErr } = await supabase
        .from('agendas')
        .select('*')
        .eq('artist_id', userProfile.id);

      if (agendaData) {
        setBusyDates(agendaData);
      }

      // Fetch venues for display names
      const { data: venueData } = await supabase.from('venues').select('*');
      if (venueData) {
        setVenues(venueData);
      }

    } catch (e) {
      console.error('Error fetching agenda data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userProfile?.id) {
      fetchAgendaData();
    }
  }, [userProfile]);

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-11
  const monthYearString = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  // Get index of first day of the month (e.g. 0 = Sunday, 1 = Monday)
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);

  // Month navigation
  const prevMonth = () => {
    setSelectedDay(null);
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setSelectedDay(null);
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Convert calendar cell day into YYYY-MM-DD string
  const getDateStr = (day) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  // Check state of cell
  const getDayInfo = (day) => {
    const dateStr = getDateStr(day);
    const dayShows = shows.filter(s => s.date === dateStr);
    const block = busyDates.find(b => b.busy_date === dateStr);
    return {
      hasShow: dayShows.length > 0,
      shows: dayShows,
      isBlocked: !!block,
      blockNote: block?.note || ''
    };
  };

  // Interactive toggle block/unblock date
  const handleToggleBlockDate = async (day) => {
    if (!userProfile?.id) return;
    const dateStr = getDateStr(day);
    const dayInfo = getDayInfo(day);

    if (dayInfo.isBlocked) {
      // Unblock
      try {
        await supabase
          .from('agendas')
          .delete()
          .eq('artist_id', userProfile.id)
          .eq('busy_date', dateStr);
        
        setSuccessToast('Data desbloqueada com sucesso!');
        setTimeout(() => setSuccessToast(''), 3000);
      } catch (e) {
        console.error(e);
      }
    } else {
      // Block
      try {
        await supabase
          .from('agendas')
          .insert({
            artist_id: userProfile.id,
            busy_date: dateStr,
            note: 'Bloqueio manual'
          });

        setSuccessToast('Data bloqueada com sucesso!');
        setTimeout(() => setSuccessToast(''), 3000);
      } catch (e) {
        console.error(e);
      }
    }
    fetchAgendaData();
  };

  // Connect Google Calendar - Open OAuth Mock Modal
  const handleConnectGoogle = () => {
    setAuthStep(1);
    setShowAuthModal(true);
  };

  const handleCompleteAuth = (email) => {
    setGoogleEmail(email);
    localStorage.setItem('tocamais_google_connected', 'true');
    localStorage.setItem('tocamais_google_email', email);
    setIsGoogleConnected(true);
    setShowAuthModal(false);
    
    setSuccessToast(`Google Agenda conectada: ${email}`);
    setTimeout(() => setSuccessToast(''), 4000);

    // Auto-sync after connection
    handleStartSync(true);
  };

  const handleDisconnectGoogle = () => {
    localStorage.removeItem('tocamais_google_connected');
    localStorage.removeItem('tocamais_google_email');
    localStorage.removeItem('tocamais_google_last_sync');
    setIsGoogleConnected(false);
    setLastSync('');
    
    setSuccessToast('Google Agenda desconectada com sucesso.');
    setTimeout(() => setSuccessToast(''), 3000);
  };

  // Google Sync Action
  const handleStartSync = async (forceImport = false) => {
    if (!isGoogleConnected) return;
    setIsSyncing(true);

    // Simulate network delay for API calls
    setTimeout(async () => {
      const nowStr = new Date().toLocaleString('pt-BR');
      setLastSync(nowStr);
      localStorage.setItem('tocamais_google_last_sync', nowStr);

      // If "Import Blocks" option is checked, inject some mock Google Calendar events into Supabase agendas
      if (syncOptions.importBlocks || forceImport) {
        try {
          // Block specific days from Google Calendar simulation
          // We'll block the 5th and 18th of the current selected month
          const googleBlock1 = `${year}-${String(month + 1).padStart(2, '0')}-05`;
          const googleBlock2 = `${year}-${String(month + 1).padStart(2, '0')}-18`;

          // Check if they are already blocked
          const datesToBlock = [
            { date: googleBlock1, note: 'Compromisso Pessoal (Google Calendar)' },
            { date: googleBlock2, note: 'Consulta Médica (Google Calendar)' }
          ];

          for (const item of datesToBlock) {
            const alreadyBlocked = busyDates.some(b => b.busy_date === item.date);
            if (!alreadyBlocked) {
              await supabase
                .from('agendas')
                .insert({
                  artist_id: userProfile.id,
                  busy_date: item.date,
                  note: item.note
                });
            }
          }
        } catch (e) {
          console.error('Error importing google events:', e);
        }
      }

      await fetchAgendaData();
      setIsSyncing(false);
      setSuccessToast('Sincronização com Google Agenda realizada!');
      setTimeout(() => setSuccessToast(''), 3000);
    }, 2000);
  };

  const selectedShows = selectedDay ? getDayInfo(selectedDay).shows : [];
  const selectedDayInfo = selectedDay ? getDayInfo(selectedDay) : null;

  return (
    <AppLayout role="artist" userName={user?.name || ''}>
      <div className="px-4 py-5 space-y-6">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-white font-black text-2xl tracking-tight">Minha Agenda</h1>
            <p className="text-gray-400 text-sm">Organize seus shows e sincronize com serviços externos</p>
          </div>

          {/* Sync status quick indicator */}
          {isGoogleConnected && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon-green/10 border border-neon-green/30 text-neon-green text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
              <span>Sincronizado com Google Agenda</span>
            </div>
          )}
        </div>

        {/* TOAST SUCCESS */}
        <AnimatePresence>
          {successToast && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-3 bg-neon-green/10 border border-neon-green/30 rounded-xl text-neon-green text-xs font-semibold flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              {successToast}
            </motion.div>
          )}
        </AnimatePresence>

        {/* MAIN GRID */}
        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* LEFT/CENTER COLUMN: CALENDAR & DETAILS */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Calendar Widget */}
            <div className="bg-white/5 border border-white/8 rounded-3xl p-5 backdrop-blur-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-neon-purple/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <CalendarRange className="w-5 h-5 text-neon-purple" />
                  <span className="text-white font-bold text-lg capitalize">{monthYearString}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={prevMonth}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={nextMonth}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Days label header */}
              <div className="grid grid-cols-7 gap-2 mb-3">
                {daysOfWeek.map((d, i) => (
                  <div key={i} className="text-center text-gray-500 text-xs font-black py-1">{d}</div>
                ))}
              </div>

              {/* Days cells */}
              {loading ? (
                <div className="h-64 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-8 h-8 text-neon-purple animate-spin" />
                  <span className="text-gray-400 text-xs">Carregando agenda...</span>
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-2">
                  {/* Offset empty spaces */}
                  {Array.from({ length: firstDayIndex }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square" />
                  ))}

                  {daysArray.map(day => {
                    const info = getDayInfo(day);
                    const isSelected = selectedDay === day;
                    const isGoogleEvent = info.isBlocked && info.blockNote.includes('Google Calendar');

                    return (
                      <motion.button
                        key={day}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedDay(isSelected ? null : day)}
                        className={`
                          aspect-square rounded-2xl text-sm font-bold flex flex-col items-center justify-between p-2 transition-all relative
                          ${isSelected 
                            ? 'bg-neon-purple text-white shadow-[0_0_15px_rgba(123,46,255,0.4)]' 
                            : info.hasShow 
                            ? 'bg-neon-green/10 border border-neon-green/30 text-neon-green hover:bg-neon-green/20' 
                            : info.isBlocked 
                            ? isGoogleEvent 
                              ? 'bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20' 
                              : 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20' 
                            : 'text-gray-400 hover:bg-white/5 border border-transparent'}
                        `}
                      >
                        <span className="self-start text-[11px]">{day}</span>
                        
                        <div className="flex items-center gap-0.5 mt-auto">
                          {info.hasShow && (
                            <div className="w-1.5 h-1.5 bg-neon-green rounded-full shadow-[0_0_8px_rgba(57,255,106,0.8)]" />
                          )}
                          {info.isBlocked && (
                            <Lock className={`w-3 h-3 ${isGoogleEvent ? 'text-blue-400' : 'text-red-400'}`} />
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {/* Legend */}
              <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-white/5 text-[11px] font-semibold text-gray-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-neon-green/20 border border-neon-green/50" />
                  <span>Show Agendado</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50" />
                  <span>Bloqueado Manualmente</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500/20 border border-blue-500/50" />
                  <span>Bloqueado via Google</span>
                </div>
              </div>
            </div>

            {/* Selected Day Details Panel */}
            <AnimatePresence mode="wait">
              {selectedDay && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  className="bg-white/5 border border-white/8 rounded-3xl p-5 backdrop-blur-md space-y-4"
                >
                  <div className="flex justify-between items-center pb-3 border-b border-white/5">
                    <div>
                      <h3 className="text-white font-bold text-base">Dia {selectedDay} de {currentDate.toLocaleDateString('pt-BR', { month: 'long' })}</h3>
                      <p className="text-gray-400 text-xs">Visão geral do dia e controle de disponibilidade</p>
                    </div>
                    <button 
                      onClick={() => setSelectedDay(null)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Show Information if available */}
                  {selectedShows.length > 0 ? (
                    <div className="space-y-3">
                      {selectedShows.map(show => {
                        const dbVenue = venues.find(v => v.id === show.venue_id);
                        return (
                          <div key={show.id} className="p-4 rounded-2xl bg-white/5 border border-white/8">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <p className="text-white font-bold text-base">{dbVenue?.venue_name || show.title}</p>
                                <div className="flex flex-wrap items-center gap-4 mt-2">
                                  <div className="flex items-center gap-1 text-gray-400 text-xs">
                                    <Clock className="w-3.5 h-3.5 text-neon-purple" /> {show.time.substring(0, 5)}
                                  </div>
                                  <div className="flex items-center gap-1 text-gray-400 text-xs">
                                    <MapPin className="w-3.5 h-3.5 text-neon-purple" /> {show.address}
                                  </div>
                                </div>
                              </div>
                              <span className={`text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full flex items-center gap-1 bg-neon-green/15 text-neon-green`}>
                                <CheckCircle className="w-3.5 h-3.5" />
                                {show.status === 'confirmed' ? 'Confirmado' : show.status}
                              </span>
                            </div>
                            <div className="flex items-center justify-between pt-3 border-t border-white/5">
                              <div className="flex items-center gap-1 text-neon-green font-extrabold text-base">
                                <DollarSign className="w-4 h-4" />
                                R$ {Number(show.fee_agreed || show.fee_proposed).toLocaleString()}
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setDetailShow(show)}
                                  className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 font-bold text-xs transition-all flex items-center gap-1.5"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  Detalhes
                                </button>
                                {isGoogleConnected && (
                                  <div className="flex items-center gap-1 text-[10px] text-blue-400 font-bold bg-blue-500/10 px-2 py-1 rounded-lg">
                                    <GoogleIcon />
                                    <span>Exportado</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-white/5 border border-dashed border-white/10 text-center space-y-1">
                      <p className="text-gray-300 font-semibold text-sm">Sem shows agendados</p>
                      <p className="text-gray-500 text-xs">Seu perfil está visível para propostas neste dia.</p>
                    </div>
                  )}

                  {/* Actions (Block/Unblock) */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2">
                    <div>
                      <p className="text-xs text-gray-400">
                        {selectedDayInfo?.isBlocked 
                          ? `Indisponível: ${selectedDayInfo.blockNote}` 
                          : 'Quer fechar este dia para folga ou outros compromissos?'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggleBlockDate(selectedDay)}
                      className={`
                        py-2 px-5 rounded-xl text-xs font-bold transition-all w-full sm:w-auto
                        ${selectedDayInfo?.isBlocked 
                          ? 'border border-red-500/30 text-red-400 hover:bg-red-500/10' 
                          : 'bg-white/5 hover:bg-white/10 text-white'}
                      `}
                    >
                      {selectedDayInfo?.isBlocked ? 'Desbloquear Data' : 'Bloquear Data'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* List of all Shows */}
            <div className="space-y-4">
              <h3 className="text-white font-bold text-base">Próximos Eventos Confirmados</h3>
              <div className="space-y-3">
                {shows.filter(s => s.status === 'confirmed').length === 0 ? (
                  <div className="p-5 text-center bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-gray-400 text-xs">Você não tem shows confirmados futuros na agenda.</p>
                  </div>
                ) : (
                  shows.filter(s => s.status === 'confirmed').map((show, i) => {
                    const dbVenue = venues.find(v => v.id === show.venue_id);
                    const showDayNum = new Date(show.date + 'T00:00:00').getDate();
                    return (
                      <motion.div 
                        key={show.id} 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ delay: i * 0.05 }}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white/5 border border-white/8 hover:border-neon-purple/30 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-neon-purple/15 flex flex-col items-center justify-center text-white border border-neon-purple/30">
                            <span className="text-[10px] text-neon-purple uppercase font-black">DIA</span>
                            <span className="font-black text-lg line-height-1 -mt-1">{showDayNum}</span>
                          </div>
                          <div>
                            <p className="text-white font-bold text-sm">{dbVenue?.venue_name || show.title}</p>
                            <p className="text-gray-400 text-xs flex items-center gap-2 mt-1">
                              <span>{show.address}</span>
                              <span>•</span>
                              <span>{show.time.substring(0, 5)}</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 border-white/5 pt-2 sm:pt-0">
                          <p className="text-neon-green font-bold text-sm">R$ {Number(show.fee_agreed || show.fee_proposed).toLocaleString()}</p>
                          <button
                            onClick={() => setDetailShow(show)}
                            className="px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 font-bold text-xs transition-all flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {isGoogleConnected && (
                            <div className="flex items-center gap-1 text-[10px] text-blue-400 font-bold bg-blue-500/10 px-2.5 py-1 rounded-full">
                              <GoogleIcon />
                              <span>Sincronizado</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: GOOGLE SYNC SETTINGS */}
          <div className="space-y-6">
            
            {/* Google Sync Integration Panel */}
            <div className="border border-blue-500/20 rounded-3xl p-5 backdrop-blur-md space-y-5 relative overflow-hidden"
              style={{ backgroundImage: 'linear-gradient(to bottom right, rgba(var(--google-sync-gradient-from), 0.4), var(--google-sync-gradient-to))' }}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex items-center justify-between">
                <h3 className="text-white font-black text-base flex items-center gap-2">
                  <GoogleIcon />
                  Google Agenda
                </h3>
                <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${isGoogleConnected ? 'bg-neon-green/10 text-neon-green border border-neon-green/30' : 'bg-gray-500/10 text-gray-400 border border-white/10'}`}>
                  {isGoogleConnected ? 'Conectado' : 'Desconectado'}
                </span>
              </div>

              {!isGoogleConnected ? (
                <div className="space-y-4">
                  <p className="text-gray-400 text-xs leading-relaxed">
                    Sincronize automaticamente seus shows confirmados e bloqueie sua agenda nos dias em que tiver compromissos no seu Google Calendar.
                  </p>
                  
                  <button 
                    onClick={handleConnectGoogle}
                    className="w-full py-3 rounded-2xl bg-white text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-gray-100 hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all"
                  >
                    <GoogleIcon />
                    <span>Conectar Google Agenda</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  
                  {/* Account detail */}
                  <div className="flex justify-between items-center p-3 rounded-2xl bg-white/5 border border-white/8 text-xs">
                    <div>
                      <p className="text-gray-400 text-[10px]">Conta Conectada</p>
                      <p className="text-white font-bold">{googleEmail}</p>
                    </div>
                    <button 
                      onClick={handleDisconnectGoogle}
                      className="text-[10px] text-red-400 hover:underline uppercase font-bold"
                    >
                      Desconectar
                    </button>
                  </div>

                  {/* Sync Settings */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs text-white font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Settings className="w-3.5 h-3.5 text-blue-400" />
                      Preferências
                    </h4>

                    {/* Dropdown calendar selection */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 uppercase font-bold">Agenda de Destino</label>
                      <select 
                        value={selectedCalendar}
                        onChange={e => setSelectedCalendar(e.target.value)}
                        className="w-full bg-[#0F0926] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-blue-500/50"
                      >
                        <option value="primary">Pessoal ({googleEmail})</option>
                        <option value="shows">TocaMais - Shows (Criada automaticamente)</option>
                        <option value="work">Trabalho</option>
                      </select>
                    </div>

                    {/* Sync checkboxes */}
                    <div className="space-y-2 pt-2">
                      <label className="flex items-center gap-2.5 cursor-pointer text-xs text-gray-300">
                        <input 
                          type="checkbox"
                          checked={syncOptions.importBlocks}
                          onChange={e => setSyncOptions(prev => ({ ...prev, importBlocks: e.target.checked }))}
                          className="rounded border-white/20 bg-[#0F0926] text-blue-500 focus:ring-0 focus:ring-offset-0 w-4 h-4"
                        />
                        <span>Importar compromissos como bloqueios</span>
                      </label>

                      <label className="flex items-center gap-2.5 cursor-pointer text-xs text-gray-300">
                        <input 
                          type="checkbox"
                          checked={syncOptions.exportShows}
                          onChange={e => setSyncOptions(prev => ({ ...prev, exportShows: e.target.checked }))}
                          className="rounded border-white/20 bg-[#0F0926] text-blue-500 focus:ring-0 focus:ring-offset-0 w-4 h-4"
                        />
                        <span>Exportar shows para o Google</span>
                      </label>

                      <label className="flex items-center gap-2.5 cursor-pointer text-xs text-gray-300">
                        <input 
                          type="checkbox"
                          checked={syncOptions.autoSync}
                          onChange={e => setSyncOptions(prev => ({ ...prev, autoSync: e.target.checked }))}
                          className="rounded border-white/20 bg-[#0F0926] text-blue-500 focus:ring-0 focus:ring-offset-0 w-4 h-4"
                        />
                        <span>Sincronização automática em 2° plano</span>
                      </label>
                    </div>

                  </div>

                  {/* Sync status & manual sync button */}
                  <div className="pt-4 border-t border-white/5 space-y-3">
                    <div className="flex justify-between items-center text-[10px] text-gray-400 font-semibold">
                      <span>Última Sincronização:</span>
                      <span className="text-white font-bold">{lastSync || 'Nunca'}</span>
                    </div>

                    <button 
                      onClick={() => handleStartSync(false)}
                      disabled={isSyncing}
                      className="w-full py-3 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] disabled:opacity-50"
                    >
                      {isSyncing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Sincronizando...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          <span>Sincronizar Agora</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>
              )}

            </div>

            {/* Info Box */}
            <div className="p-4 bg-white/5 border border-white/8 rounded-3xl space-y-2">
              <h4 className="text-white font-bold text-xs flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-neon-purple" />
                Como funciona a sincronização?
              </h4>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Ao ativar, criamos uma agenda específica na sua conta Google. Quaisquer shows aprovados aqui serão exportados. Eventos da sua agenda pessoal marcarão esses dias como "Ocupado" no TocaMais, evitando que contratantes enviem propostas em datas indisponíveis.
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* MOCK AUTH OAUTH POPUP MODAL */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#181829] border border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-6"
            >
              {/* Top logo */}
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                  <GoogleIcon />
                </div>
                <h3 className="text-white font-bold text-lg">Fazer login com o Google</h3>
                <p className="text-gray-400 text-xs">para prosseguir para o app <span className="text-neon-purple font-bold">TocaMais</span></p>
              </div>

              {authStep === 1 ? (
                <div className="space-y-3">
                  <p className="text-[11px] text-gray-500 uppercase font-black tracking-wider">Escolha uma conta</p>
                  
                  {/* Account selections */}
                  <button 
                    onClick={() => setAuthStep(2)}
                    className="w-full p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-white/20 text-left flex items-center gap-3 transition-all"
                  >
                    <img 
                      src={userProfile?.photo_url || user?.avatar_url || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop'} 
                      alt="Avatar" 
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div className="text-xs">
                      <p className="text-white font-bold">{userProfile?.artistic_name || user?.name || 'Lucas Volta'}</p>
                      <p className="text-gray-400">lucas.volta@gmail.com</p>
                    </div>
                  </button>

                  <button 
                    onClick={() => handleCompleteAuth('nathan.contato@gmail.com')}
                    className="w-full p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-white/20 text-left flex items-center gap-3 transition-all"
                  >
                    <div className="w-8 h-8 rounded-full bg-neon-purple/20 text-neon-purple font-bold flex items-center justify-center text-xs">
                      N
                    </div>
                    <div className="text-xs">
                      <p className="text-white font-bold">Nathan Silva</p>
                      <p className="text-gray-400">nathan.contato@gmail.com</p>
                    </div>
                  </button>

                  <button 
                    onClick={() => {
                      const email = prompt('Digite outro e-mail do Google:');
                      if (email) handleCompleteAuth(email);
                    }}
                    className="w-full p-3 rounded-2xl border border-dashed border-white/10 hover:border-white/30 text-center text-xs text-gray-400 hover:text-white transition-all"
                  >
                    Usar outra conta
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-gray-300 leading-relaxed">
                    O app <span className="text-neon-purple font-bold">TocaMais</span> quer acessar sua conta Google:
                  </p>

                  <div className="space-y-2 p-3.5 rounded-2xl bg-white/5 border border-white/5 text-xs text-gray-400">
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-neon-green flex-shrink-0 mt-0.5" />
                      <span>Ver, editar, compartilhar e excluir permanentemente todos os calendários que você pode acessar usando o Google Agenda.</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-gray-500 leading-normal">
                    Ao clicar em "Permitir", você autoriza o TocaMais a usar suas informações de acordo com os Termos de Serviço e a Política de Privacidade deles.
                  </p>

                  <div className="flex gap-3 pt-2">
                    <button 
                      onClick={() => setAuthStep(1)}
                      className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-300 text-xs font-bold hover:bg-white/5 transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={() => handleCompleteAuth('lucas.volta@gmail.com')}
                      className="flex-1 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold transition-all"
                    >
                      Permitir
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DETAIL MODAL */}
      <AnimatePresence>
        {detailShow && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDetailShow(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-[#0F0926] border border-white/10 p-6 shadow-2xl rounded-2xl z-10"
            >
              <button onClick={() => setDetailShow(null)} className="absolute top-3 right-3 p-1 rounded bg-white/5 hover:bg-white/10">
                <X className="w-4 h-4" />
              </button>

              <div className="text-center space-y-5">
                <div>
                  <h3 className="font-black text-white text-lg">Detalhes do Show</h3>
                  <h4 className="font-bold text-neon-purple text-sm mt-1">{venues.find(v => v.id === detailShow.venue_id)?.venue_name || detailShow.title}</h4>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div className="flex flex-col items-center gap-1.5 p-3 bg-white/5 rounded-xl border border-white/5">
                    <MapPin className="w-4 h-4 text-neon-purple" />
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Local</p>
                    <p className="text-sm text-white font-medium text-center">{detailShow.address || 'Não informado'}</p>
                  </div>

                  <div className="flex flex-col items-center gap-1.5 p-3 bg-white/5 rounded-xl border border-white/5">
                    <Speaker className="w-4 h-4 text-neon-purple" />
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Equipamento</p>
                    <p className={`text-sm font-bold text-center ${detailShow.precisa_equipamento ? 'text-yellow-400' : 'text-neon-green'}`}>
                      {detailShow.precisa_equipamento ? 'Precisa levar equipamento' : 'Equipamento já disponível no local'}
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-1.5 p-3 bg-white/5 rounded-xl border border-white/5">
                    <Users className="w-4 h-4 text-neon-purple" />
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Público</p>
                    <p className="text-sm text-white font-medium text-center">{detailShow.quantidade_pessoas || 'Não informado'} pessoas</p>
                  </div>

                  <div className="flex flex-col items-center gap-1.5 p-3 bg-white/5 rounded-xl border border-white/5">
                    <DollarSign className="w-4 h-4 text-neon-purple" />
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Cachê</p>
                    <p className="text-sm text-neon-green font-bold text-center">
                      {Number(detailShow.fee_agreed || detailShow.fee_proposed).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-1.5 p-3 bg-white/5 rounded-xl border border-white/5">
                    <CalendarRange className="w-4 h-4 text-neon-purple" />
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Data</p>
                    <p className="text-sm text-white font-medium text-center">
                      {new Date(detailShow.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      {detailShow.time && <> às {detailShow.time.substring(0, 5)}</>}
                    </p>
                  </div>
                </div>

                {detailShow.description && (
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-center">
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1">Mensagem</p>
                    <p className="text-sm text-gray-300">{detailShow.description}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </AppLayout>
  );
}