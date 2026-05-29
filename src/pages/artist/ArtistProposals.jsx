import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import AppLayout from '@/components/shared/AppLayout';
import { Check, X, Loader2, DollarSign, MapPin, Clock, Info, CalendarRange, AlertCircle, Users, Speaker, Eye } from 'lucide-react';

export default function ArtistProposals() {
  const { user, userProfile } = useAuth();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [venues, setVenues] = useState({});
  const [contractors, setContractors] = useState({});
  const [successToast, setSuccessToast] = useState('');
  const [errorToast, setErrorToast] = useState('');
  const [detailProposal, setDetailProposal] = useState(null);

  useEffect(() => {
    if (userProfile?.id) {
      fetchProposalsAndVenues();
    }
  }, [userProfile]);

  const fetchProposalsAndVenues = async () => {
    setLoading(true);
    try {
      // Fetch proposals for the artist
      const { data: proposalsData, error: proposalsError } = await supabase
        .from('events')
        .select('*')
        .eq('artist_id', userProfile.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (proposalsError) throw proposalsError;
      setProposals(proposalsData);

      // Fetch venue details for each proposal
      const venueIds = [...new Set(proposalsData.map(p => p.venue_id).filter(id => id != null))];
      let venuesMap = {};
      
      if (venueIds.length > 0) {
        const { data: venuesData, error: venuesError } = await supabase
          .from('venues')
          .select('id, venue_name, address, logo_url')
          .in('id', venueIds);
        
        if (venuesError) throw venuesError;
        
        venuesMap = venuesData.reduce((acc, venue) => {
          acc[venue.id] = venue;
          return acc;
        }, {});
      }
      setVenues(venuesMap);

      // Fetch contractor details for proposals from contractors
      const contractorIds = [...new Set(proposalsData.map(p => p.contractor_id).filter(id => id != null))];
      let contractorsMap = {};
      
      if (contractorIds.length > 0) {
        const { data: contractorsData, error: contractorsError } = await supabase
          .from('contractors')
          .select('*')
          .in('id', contractorIds);
        
        if (contractorsError) throw contractorsError;
        
        contractorsMap = contractorsData.reduce((acc, c) => {
          acc[c.id] = c;
          return acc;
        }, {});
      }
      setContractors(contractorsMap);

    } catch (e) {
      console.error('Error fetching proposals:', e);
      setErrorToast('Erro ao carregar propostas.');
      setTimeout(() => setErrorToast(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProposalStatus = async (proposalId, status) => {
    try {
      await supabase
        .from('events')
        .update({ status: status })
        .eq('id', proposalId);
      
      setProposals(prev => prev.filter(p => p.id !== proposalId));
      setSuccessToast(`Proposta ${status === 'confirmed' ? 'aceita' : 'recusada'} com sucesso!`);
      setTimeout(() => setSuccessToast(''), 3000);

      const proposal = proposals.find(p => p.id === proposalId);
      if (proposal) {
        await supabase.from('notifications').insert({
          user_id: proposal.venue_id || proposal.contractor_id,
          title: `Proposta ${status === 'confirmed' ? 'Aceita' : 'Recusada'}`,
          content: `${userProfile?.artistic_name || user?.name} ${status === 'confirmed' ? 'aceitou' : 'recusou'} sua proposta para o show no dia ${proposal.date}.`,
          type: 'proposal_response',
          read: false,
        });
      }

    } catch (e) {
      console.error('Error updating proposal status:', e);
      setErrorToast('Erro ao atualizar status da proposta.');
      setTimeout(() => setErrorToast(''), 3000);
    }
  };

  const getSenderName = (proposal) => {
    if (proposal.venue_id) {
      const venue = venues[proposal.venue_id];
      return venue?.venue_name || 'Casa de Show';
    }
    if (proposal.contractor_id) {
      const contractor = contractors[proposal.contractor_id];
      return contractor?.venue_name || 'Contratante';
    }
    return 'Proposta de Show';
  };

  const getSenderAddress = (proposal) => {
    if (proposal.venue_id) {
      const venue = venues[proposal.venue_id];
      return venue?.address || '';
    }
    return '';
  };

  return (
    <AppLayout role="artist" userName={user?.name || ''}>
      <div className="max-w-4xl mx-auto px-4 py-5 space-y-6">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-white font-black text-2xl tracking-tight">Minhas Propostas</h1>
            <p className="text-gray-400 text-sm">Visualize, aceite ou recuse propostas de shows</p>
          </div>
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
          {errorToast && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-semibold flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4" />
              {errorToast}
            </motion.div>
          )}
        </AnimatePresence>

        {/* PROPOSALS LIST */}
        <div className="space-y-4">
          {loading ? (
            <div className="h-40 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-8 h-8 text-neon-purple animate-spin" />
              <span className="text-gray-400 text-xs">Carregando propostas...</span>
            </div>
          ) : proposals.length === 0 ? (
            <div className="p-5 text-center bg-white/5 rounded-2xl border border-white/5">
              <p className="text-gray-400 text-xs">Nenhuma proposta pendente no momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {proposals.map((proposal, i) => {
                const formattedDate = new Date(proposal.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
                const formattedFee = Number(proposal.fee_proposed).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                
                return (
                  <motion.div 
                    key={proposal.id} 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: i * 0.05 }}
                    className="bg-white/5 border border-white/8 rounded-3xl p-5 space-y-4"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-white font-bold text-lg">{getSenderName(proposal)}</h3>
                        <p className="text-gray-400 text-xs flex items-center gap-2 mt-1">
                          <CalendarRange className="w-3.5 h-3.5 text-neon-purple" /> {formattedDate}
                          {proposal.time && <><span className="mx-1">•</span> <Clock className="w-3.5 h-3.5 text-neon-purple" /> {proposal.time.substring(0, 5)}</>}
                        </p>
                        {proposal.address && (
                           <p className="text-gray-400 text-xs flex items-center gap-2 mt-0.5">
                             <MapPin className="w-3.5 h-3.5 text-neon-purple" /> {proposal.address}
                           </p>
                        )}
                      </div>
                      <span className="text-neon-green font-black text-lg flex items-center">
                        <DollarSign className="w-5 h-5" /> {formattedFee}
                      </span>
                    </div>

                    <p className="text-gray-300 text-sm leading-relaxed mb-4">
                      {proposal.description || 'Nenhuma mensagem adicional fornecida.'}
                    </p>

                    <div className="flex gap-2 pt-3 border-t border-white/5">
                      <button
                        onClick={() => setDetailProposal(proposal)}
                        className="px-3 py-3 rounded-2xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 font-bold text-xs transition-all flex items-center justify-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="hidden sm:inline">Mostrar Detalhes</span>
                      </button>
                      <button
                        onClick={() => handleUpdateProposalStatus(proposal.id, 'confirmed')}
                        className="flex-1 py-3 rounded-2xl bg-neon-green/15 text-neon-green hover:bg-neon-green/30 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        <span>Aceitar</span>
                      </button>
                      <button
                        onClick={() => handleUpdateProposalStatus(proposal.id, 'rejected')}
                        className="flex-1 py-3 rounded-2xl bg-red-500/15 text-red-400 hover:bg-red-500/30 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        <span>Recusar</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* DETAIL MODAL */}
        <AnimatePresence>
          {detailProposal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setDetailProposal(null)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-sm bg-[#0F0926] border border-white/10 p-6 shadow-2xl rounded-2xl z-10"
              >
                <button onClick={() => setDetailProposal(null)} className="absolute top-3 right-3 p-1 rounded bg-white/5 hover:bg-white/10">
                  <X className="w-4 h-4" />
                </button>

                <div className="text-center space-y-5">
                  <div>
                    <h3 className="font-black text-white text-lg">Detalhes da Proposta</h3>
                    <h4 className="font-bold text-neon-purple text-sm mt-1">{getSenderName(detailProposal)}</h4>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex flex-col items-center gap-1.5 p-3 bg-white/5 rounded-xl border border-white/5">
                      <MapPin className="w-4 h-4 text-neon-purple" />
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Local</p>
                      <p className="text-sm text-white font-medium text-center">{detailProposal.address || 'Não informado'}</p>
                    </div>

                    <div className="flex flex-col items-center gap-1.5 p-3 bg-white/5 rounded-xl border border-white/5">
                      <Speaker className="w-4 h-4 text-neon-purple" />
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Equipamento</p>
                      <p className={`text-sm font-bold text-center ${detailProposal.precisa_equipamento ? 'text-yellow-400' : 'text-neon-green'}`}>
                        {detailProposal.precisa_equipamento ? 'Precisa levar equipamento' : 'Equipamento já disponível no local'}
                      </p>
                    </div>

                    <div className="flex flex-col items-center gap-1.5 p-3 bg-white/5 rounded-xl border border-white/5">
                      <Users className="w-4 h-4 text-neon-purple" />
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Público</p>
                      <p className="text-sm text-white font-medium text-center">{detailProposal.quantidade_pessoas || 'Não informado'} pessoas</p>
                    </div>

                    <div className="flex flex-col items-center gap-1.5 p-3 bg-white/5 rounded-xl border border-white/5">
                      <DollarSign className="w-4 h-4 text-neon-purple" />
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Cachê</p>
                      <p className="text-sm text-neon-green font-bold text-center">
                        {Number(detailProposal.fee_proposed).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                    </div>

                    <div className="flex flex-col items-center gap-1.5 p-3 bg-white/5 rounded-xl border border-white/5">
                      <CalendarRange className="w-4 h-4 text-neon-purple" />
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Data</p>
                      <p className="text-sm text-white font-medium text-center">
                        {new Date(detailProposal.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                        {detailProposal.time && <> às {detailProposal.time.substring(0, 5)}</>}
                      </p>
                    </div>
                  </div>

                  {detailProposal.description && (
                    <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-center">
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1">Mensagem</p>
                      <p className="text-sm text-gray-300">{detailProposal.description}</p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={() => { handleUpdateProposalStatus(detailProposal.id, 'confirmed'); setDetailProposal(null); }}
                      className="flex-1 py-3 rounded-2xl bg-neon-green/15 text-neon-green hover:bg-neon-green/30 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Aceitar
                    </button>
                    <button
                      onClick={() => { handleUpdateProposalStatus(detailProposal.id, 'rejected'); setDetailProposal(null); }}
                      className="flex-1 py-3 rounded-2xl bg-red-500/15 text-red-400 hover:bg-red-500/30 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Recusar
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </AppLayout>
  );
}