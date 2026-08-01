import { useState } from 'react';
import { supabase } from './supabaseClient';

const DEFAULT_DURATION = 120;

function toMinutes(t) {
  const [h, m] = t.substring(0, 5).split(':').map(Number);
  return h * 60 + m;
}

async function checkArtistAvailability(artistId, date, time) {
  const { data: agendaBlocks } = await supabase
    .from('agendas')
    .select('*')
    .eq('artist_id', artistId)
    .eq('busy_date', date);

  if (agendaBlocks && agendaBlocks.length > 0) {
    for (const block of agendaBlocks) {
      let isFullDay = true;
      let blockStart = '00:00';
      let blockEnd = '23:59';
      let blockDesc = 'Compromisso';

      try {
        if (block.note && (block.note.startsWith('{') || block.note.startsWith('['))) {
          const parsed = JSON.parse(block.note);
          if (parsed.isTimeBlock) {
            isFullDay = false;
            blockStart = parsed.start_time;
            blockEnd = parsed.end_time;
            blockDesc = parsed.description || 'Compromisso';
          } else {
            blockDesc = parsed.description || 'Dia Todo';
          }
        } else {
          blockDesc = block.note || 'Compromisso';
        }
      } catch (e) {}

      if (isFullDay) {
        return { available: false, reason: `Artista indisponível nesta data (${blockDesc}).` };
      }

      const pStart = toMinutes(time || '20:00');
      const pEnd = pStart + DEFAULT_DURATION;
      const bStart = toMinutes(blockStart);
      const bEnd = toMinutes(blockEnd);
      if (pStart < bEnd && bStart < pEnd) {
        return { available: false, reason: `Horário indisponível. O artista tem um compromisso das ${blockStart} às ${blockEnd} (${blockDesc}).` };
      }
    }
  }

  const { data: existingEvents } = await supabase
    .from('events')
    .select('*')
    .eq('artist_id', artistId)
    .eq('date', date)
    .in('status', ['confirmed', 'pending', 'pending_artist_approval', 'proposed']);

  if (existingEvents && existingEvents.length > 0) {
    for (const ev of existingEvents) {
      const pStart = toMinutes(time || '20:00');
      const pEnd = pStart + DEFAULT_DURATION;
      const evStart = toMinutes(ev.time);
      const evEnd = evStart + (ev.duration || DEFAULT_DURATION);
      if (pStart < evEnd && evStart < pEnd) {
        const evEndLabel = new Date(new Date('2000-01-01T' + ev.time).getTime() + (ev.duration || DEFAULT_DURATION) * 60000)
          .toTimeString()
          .substring(0, 5);
        return {
          available: false,
          reason: `Horário indisponível. O artista já possui outro show das ${ev.time.substring(0, 5)} às ${evEndLabel} neste dia.`
        };
      }
    }
  }

  return { available: true };
}

async function ensureHirerId(hirerType, user, userProfile) {
  if (userProfile?.id) return userProfile.id;
  if (!user?.id) return null;

  const table = hirerType === 'venue' ? 'venues' : 'contractors';
  const { data: existing } = await supabase.from(table).select('id').eq('user_id', user.id).maybeSingle();
  if (existing?.id) return existing.id;

  const defaults = hirerType === 'venue'
    ? {
        user_id: user.id,
        venue_name: user?.user_metadata?.name || 'Minha Casa de Show',
        city: 'São Paulo',
        address: 'Endereço não definido',
        capacity: 100,
        average_budget: 0
      }
    : {
        user_id: user.id,
        phone: '',
        preferences: {}
      };

  const { data: created } = await supabase.from(table).insert(defaults).select('id').single();
  return created?.id || null;
}

// Fluxo único de contratação, usado pelos 3 pontos de entrada do app
// (VenueDashboard -> VenueArtists, VenueArtists direto, ContractorDashboard).
export function useHireArtist(hirerType, user, userProfile) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const hire = async (artist, form) => {
    setSubmitting(true);
    setError('');
    try {
      const hirerId = await ensureHirerId(hirerType, user, userProfile);
      if (!hirerId) {
        const label = hirerType === 'venue' ? 'da casa de show' : 'do contratante';
        setError(`Erro: perfil ${label} não encontrado.`);
        return false;
      }

      const availability = await checkArtistAvailability(artist.id, form.date, form.time);
      if (!availability.available) {
        setError(availability.reason);
        return false;
      }

      const eventPayload = {
        title: hirerType === 'venue' ? `Show: ${artist.artistic_name}` : `Show Particular: ${artist.artistic_name}`,
        description: form.message?.trim() || `Evento no dia ${form.date}`,
        date: form.date,
        time: form.time || '20:00',
        duration: DEFAULT_DURATION,
        status: 'pending',
        fee_proposed: form.fee,
        address: form.address || 'A definir',
        precisa_equipamento: form.precisaEquipamento,
        quantidade_pessoas: form.quantidadePessoas,
        artist_id: artist.id,
        [hirerType === 'venue' ? 'venue_id' : 'contractor_id']: hirerId
      };

      const { error: err1 } = await supabase.from('events').insert(eventPayload);
      if (err1) throw new Error('Erro ao criar evento: ' + err1.message);

      const senderName = user?.user_metadata?.name || user?.email || (hirerType === 'venue' ? 'Casa de Show' : 'Contratante');
      const msg = form.message?.trim() || `Olá! Proposta para show no dia ${form.date} às ${form.time}. Cachê: R$ ${form.fee}.`;

      const { error: err2 } = await supabase.from('notifications').insert({
        user_id: artist.user_id,
        title: 'Nova Proposta de Show',
        content: `${senderName} enviou uma proposta para ${form.date}.`,
        type: 'proposal'
      });
      if (err2) throw new Error('Erro ao criar notificação: ' + err2.message);

      const { error: err3 } = await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: artist.user_id,
        text: msg
      });
      if (err3) throw new Error('Erro ao criar mensagem: ' + err3.message);

      return true;
    } catch (e) {
      console.error('Erro ao contratar artista:', e);
      setError(e.message || 'Erro inesperado ao enviar proposta.');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return { hire, submitting, error, setError };
}
