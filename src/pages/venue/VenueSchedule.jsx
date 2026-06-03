import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, DollarSign, Users, CheckCircle, Plus } from 'lucide-react';
import AppLayout from '../../components/shared/AppLayout';
import { useAuth } from '../../lib/AuthContext';
import NeonButton from '../../components/ui/NeonButton';
import { supabase } from '../../lib/supabaseClient';

export default function VenueSchedule() {
  const { user, userProfile } = useAuth();
  const [events, setEvents] = useState([]);
  const [artistsMap, setArtistsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchEvents = async () => {
    if (!userProfile?.id) { setLoading(false); return; }
    try {
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('venue_id', userProfile.id)
        .order('date', { ascending: true });
      if (data) {
        const artistIds = [...new Set(data.map(e => e.artist_id).filter(Boolean))];
        let artists = {};
        if (artistIds.length > 0) {
          const { data: artistsData } = await supabase
            .from('artists')
            .select('id, artistic_name, photo_url, genre')
            .in('id', artistIds);
          if (artistsData) {
            artists = artistsData.reduce((acc, a) => { acc[a.id] = a; return acc; }, {});
          }
        }
        setArtistsMap(artists);
        setEvents(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [userProfile]);

  const filtered = events.filter(e => {
    if (filter === 'all') return true;
    if (filter === 'confirmed') return e.status === 'confirmed';
    if (filter === 'pending') return ['pending', 'pending_artist_approval', 'proposed'].includes(e.status);
    return false;
  });

  const totalFee = filtered.reduce((acc, e) => acc + Number(e.fee_proposed || e.fee_agreed || 0), 0);
  const confirmedCount = events.filter(e => e.status === 'confirmed').length;

  return (
    <AppLayout role="venue" userName={user?.name || ''} venueName={userProfile?.venue_name || ''}>
      <div className="px-4 py-5 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white font-bold text-xl">Agenda de Shows</h1>
            <p className="text-gray-400 text-sm">{new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
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
            <p className="text-white font-bold text-sm">R$ {totalFee.toLocaleString('pt-BR')}</p>
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
          {loading ? (
            <div className="h-32 flex items-center justify-center bg-white/5 rounded-2xl border border-white/5">
              <div className="w-5 h-5 border-2 border-neon-purple border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center bg-white/5 rounded-2xl border border-white/5">
              <Calendar className="w-10 h-10 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400 text-sm font-semibold">Nenhum evento encontrado</p>
              <p className="text-gray-500 text-xs mt-1">Os eventos aparecerão aqui após serem contratados.</p>
            </div>
          ) : filtered.map((event, i) => {
            const artist = artistsMap[event.artist_id];
            const formattedDate = new Date(event.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
            const fee = Number(event.fee_proposed || event.fee_agreed || 0);
            const isConfirmed = event.status === 'confirmed';
            return (
            <motion.div key={event.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className={`p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-4 transition-all ${isConfirmed ? 'bg-white/5 border border-neon-green/10 hover:border-neon-green/20' : 'bg-white/5 border border-white/8 hover:border-yellow-400/20'}`}>
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={`w-2 h-16 rounded-full flex-shrink-0 ${isConfirmed ? 'bg-neon-green' : 'bg-yellow-400'}`} />
                <img src={artist?.photo_url || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop'} alt={artist?.artistic_name || 'Artista'} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-white">{artist?.artistic_name || 'Artista'}</h4>
                    {isConfirmed ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-neon-green" />
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-neon-green/10 text-neon-green border border-neon-green/20">Confirmado</span>
                      </>
                    ) : (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">Pendente</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{artist?.genre || ''}</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-neon-green" /> {formattedDate}
                      {event.time && <> às {event.time.substring(0, 5)}</>}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-neon-green" /> {event.address || 'Local não informado'}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-neon-green" /> R$ {fee.toLocaleString('pt-BR')}
                    </span>
                    {event.quantidade_pessoas && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-neon-green" /> {event.quantidade_pessoas} pessoas
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}