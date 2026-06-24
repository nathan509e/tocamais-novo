import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, Copy, Check, Music, Search, X, Loader, Heart, Send, Sparkles, Star, ChevronDown, DollarSign } from 'lucide-react';
import { useTheme } from '../../lib/ThemeContext';
import { supabase } from '../../lib/supabaseClient';

const STAGE = {
  FORM: 0,
  ORDER_ONLY_THANKS: 1,
  TIP_VALUE: 2,
  PIX_PAYMENT: 3,
  FINAL_THANKS: 4,
};

export default function ArtistTip() {
  const { artistId } = useParams();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [stage, setStage] = useState(STAGE.FORM);
  const [artist, setArtist] = useState(null);
  const [repertorio, setRepertorio] = useState([]);
  const [searchRepertorio, setSearchRepertorio] = useState('');
  const [selectedMusic, setSelectedMusic] = useState(null);
  const [showMusicPicker, setShowMusicPicker] = useState(false);
  const [copied, setCopied] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [userName, setUserName] = useState('');
  const [message, setMessage] = useState('');
  const [tipAmount, setTipAmount] = useState(0);
  const [pixLoading, setPixLoading] = useState(false);
  const [pixError, setPixError] = useState('');
  const [pixQrCodeBase64, setPixQrCodeBase64] = useState('');
  const [pixQrCode, setPixQrCode] = useState('');
  const [pixPaymentId, setPixPaymentId] = useState(null);
  const [pixCreated, setPixCreated] = useState(false);
  const [rating, setRating] = useState(0);
  const [customerCpf, setCustomerCpf] = useState('');
  const autoConfirmedRef = useRef(false);
  const pollingRef = useRef(null);

  useEffect(() => {
    if (!pixCreated || !pixPaymentId) return;
    autoConfirmedRef.current = false;
    const checkPayment = async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke(
          'stripe-check-payment',
          { body: { payment_intent_id: pixPaymentId } }
        );
        if (!fnError && data?.mpStatus === 'approved' && !autoConfirmedRef.current) {
          autoConfirmedRef.current = true;
          if (pollingRef.current) clearInterval(pollingRef.current);
          processTipPayment();
        }
      } catch (e) {
        console.error('Polling error:', e);
      }
    };
    pollingRef.current = setInterval(checkPayment, 5000);
    checkPayment();
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [pixCreated, pixPaymentId]);

  useEffect(() => {
    async function loadArtist() {
      if (!artistId) return;
      try {
        const { data } = await supabase
          .from('artists')
          .select('*')
          .eq('user_id', artistId)
          .single();
        if (data) {
          setArtist(data);
          if (data.selected_musicas_ids?.length) {
            const { data: musicas } = await supabase
              .from('musicas_repertorio')
              .select('*')
              .in('id', data.selected_musicas_ids);
            setRepertorio(musicas || []);
          }
        } else {
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', artistId)
            .single();
          if (userData) {
            setArtist({
              artistic_name: userData.name || userData.email?.split('@')[0] || 'Artista',
              photo_url: userData.avatar_url || '',
              bio: userData.bio || '',
              city: 'Brasil'
            });
          }
        }
      } catch (e) {
        console.log('Loading artist from users table');
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', artistId)
          .single();
        if (userData) {
          setArtist({
            artistic_name: userData.name || userData.email?.split('@')[0] || 'Artista',
            photo_url: userData.avatar_url || '',
            bio: userData.bio || '',
            city: 'Brasil'
          });
        }
      }
    }
    loadArtist();
  }, [artistId]);

  const copyPixKey = () => {
    navigator.clipboard.writeText(pixQrCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const createPixPayment = async () => {
    if (!artistId || tipAmount < 2 || !customerCpf || customerCpf.length < 11) return;
    setPixLoading(true);
    setPixError('');
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'stripe-create-pix',
        {
          body: {
            amount: tipAmount,
            description: `Gorjeta para ${artist?.artistic_name || 'Artista'} - TocaMais`,
            customerName: userName || 'Cliente TocaMais',
            customerEmail: 'cliente@tocamais.com.br',
            customerTaxId: customerCpf
          }
        }
      );

      if (fnError) {
        // Supabase puts the edge function response body in data even on non-2xx
        const serverMsg = data?.error || fnError.message || 'Erro ao gerar PIX';
        const serverCode = data?.code || '';
        throw new Error(serverCode ? `${serverCode}: ${serverMsg}` : serverMsg);
      }

      setPixQrCodeBase64(data.qrCodeBase64);
      setPixQrCode(data.qrCode);
      setPixPaymentId(data.paymentIntentId);
      setPixCreated(true);
      setStage(STAGE.PIX_PAYMENT);
    } catch (err) {
      console.error('PIX error:', err);
      const msg = err.message || 'Erro ao gerar PIX';
      if (msg.includes('STRIPE_NOT_CONFIGURED') || msg.includes('não configurado') || msg.includes('not configured')) {
        setPixError('Sistema de pagamento temporariamente indisponível. Tente novamente mais tarde.');
      } else if (msg.includes('PIX_NOT_ACTIVATED') || msg.includes('não ativado') || msg.includes('not activated')) {
        setPixError('Método PIX não ativado no Stripe. Ative o Método PIX como Pagamento no Stripe.');
      } else if (msg.includes('non-2xx') || msg.includes('pix') || msg.includes('PIX')) {
        setPixError(`${msg} (Ative o Método PIX como Pagamento no Stripe)`);
      } else {
        setPixError(msg);
      }
    } finally {
      setPixLoading(false);
    }
  };

  const submitRequest = async () => {
    if (!artistId) return;
    setRequesting(true);

    try {
      const { error } = await supabase.from('music_requests').insert({
        artist_id: artistId,
        musica_id: selectedMusic?.id || null,
        musica_titulo: selectedMusic?.titulo || null,
        musica_artista: selectedMusic?.artista_nome || null,
        user_name: userName || 'Cliente',
        message: message || null,
        status: 'pending',
        requested_at: new Date().toISOString(),
        amount: 0
      });

      if (error) {
        console.error('Erro ao criar pedido:', error);
        alert('Erro: ' + error.message);
      } else {
        setStage(STAGE.ORDER_ONLY_THANKS);
      }
    } catch (e) {
      console.error('Error submitting request:', e);
      alert('Erro: ' + e.message);
    }

    setRequesting(false);
  };

  const processTipPayment = async (manualConfirm = false) => {
    if (!artistId || !pixPaymentId) return;
    setRequesting(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'stripe-process-tip',
        {
          body: {
            payment_intent_id: pixPaymentId,
            artist_id: artistId,
            amount: tipAmount,
            user_name: userName || 'Cliente',
            message: message || null,
            musica_id: selectedMusic?.id || null,
            musica_titulo: selectedMusic?.titulo || 'Pedido com Gorjeta',
            musica_artista: selectedMusic?.artista_nome || null,
            rating: rating || null
          }
        }
      );

      if (fnError) {
        if (manualConfirm) {
          await insertRequestDirectly();
          return;
        }
        console.error('Erro ao processar gorjeta:', fnError);
        alert('Erro ao confirmar pagamento: ' + fnError.message);
        return;
      }

      if (!data?.success) {
        if (manualConfirm) {
          await insertRequestDirectly();
          return;
        }
        alert('Erro: ' + (data?.error || 'Falha ao processar'));
        return;
      }

      setPixCreated(false);
      setPixQrCodeBase64('');
      setPixQrCode('');
      setPixPaymentId(null);
      setStage(STAGE.FINAL_THANKS);
    } catch (e) {
      console.error('Error processing tip:', e);
      if (manualConfirm) {
        await insertRequestDirectly();
        return;
      }
      alert('Erro: ' + e.message);
    }
    setRequesting(false);
  };

  const insertRequestDirectly = async () => {
    try {
      const { error } = await supabase.from('music_requests').insert({
        artist_id: artistId,
        musica_id: selectedMusic?.id || null,
        musica_titulo: selectedMusic?.titulo || 'Pedido com Gorjeta',
        musica_artista: selectedMusic?.artista_nome || null,
        user_name: userName || 'Cliente',
        message: message || null,
        status: 'pending',
        amount: tipAmount,
        pix_payment_id: pixPaymentId,
        pix_status: 'pending',
        requested_at: new Date().toISOString(),
        rating: rating || null
      });

      if (error) {
        console.error('Erro ao criar pedido:', error);
        alert('Erro ao criar pedido: ' + error.message);
      } else {
        setPixCreated(false);
        setPixQrCodeBase64('');
        setPixQrCode('');
        setPixPaymentId(null);
        setStage(STAGE.FINAL_THANKS);
      }
    } catch (e) {
      console.error('Error inserting request:', e);
      alert('Erro: ' + e.message);
    }
    setRequesting(false);
  };

  const quickTipValues = [2, 5, 10];

  const renderStage = () => {
    switch (stage) {
      case STAGE.FORM:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm"
          >
            {/* Banner */}
            <div className="w-full h-36 rounded-2xl overflow-hidden relative">
              {artist?.cover_url ? (
                <img
                  src={artist.cover_url}
                  alt="Banner"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full"
                  style={{ background: 'linear-gradient(135deg, #7B2EFF 0%, #4A1A8A 50%, #2D1066 100%)' }}
                />
              )}
            </div>

            {/* Profile section */}
            <div className="flex flex-col items-center -mt-12 relative z-10">
              <div
                className="w-24 h-24 rounded-full overflow-hidden border-4 border-white/20"
                style={{ boxShadow: '0 0 30px rgba(123,46,255,0.4)' }}
              >
                <img
                  src={artist?.photo_url || 'https://ui-avatars.com/api/?name=Artista&background=7B2EFF&color=fff&size=200'}
                  alt={artist?.artistic_name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h1 className={`mt-3 font-black text-xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {artist?.artistic_name || 'Artista'}
              </h1>
              {/* Star rating */}
              <div className="flex items-center gap-1 mt-1">
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Avaliação</span>
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={star}
                    className="w-3.5 h-3.5 text-yellow-400"
                    fill={star <= (artist?.rating || 4) ? 'currentColor' : 'none'}
                  />
                ))}
                <span className={`text-xs ml-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  ({artist?.rating?.toFixed(1) || '4.0'})
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className={`w-full h-px my-6 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />

            {/* Form fields */}
            <div className="space-y-5">
              {/* Name field */}
              <div>
                <label className={`text-xs font-bold uppercase tracking-wider block mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Seu Nome
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                  placeholder="DIGITE AQUI O SEU NOME"
                  className={`w-full p-4 rounded-2xl border-2 text-sm font-medium outline-none transition-all focus:border-neon-purple ${
                    isDark
                      ? 'bg-white/5 border-white/15 text-white placeholder:text-gray-500 placeholder:uppercase'
                      : 'bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400 placeholder:uppercase'
                  }`}
                />
              </div>

              {/* Music picker */}
              <div>
                <label className={`text-xs font-bold uppercase tracking-wider block mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Escolha uma Música
                </label>
                <button
                  onClick={() => setShowMusicPicker(true)}
                  className={`w-full p-4 rounded-2xl border-2 text-sm text-left flex items-center gap-3 transition-all focus:border-neon-purple ${
                    isDark
                      ? 'bg-white/5 border-white/15 text-white'
                      : 'bg-gray-50 border-gray-200 text-gray-800'
                  }`}
                >
                  <Music className="w-5 h-5 text-neon-purple flex-shrink-0" />
                  <span className="flex-1 truncate">
                    {selectedMusic ? (
                      `${selectedMusic.titulo} - ${selectedMusic.artista_nome}`
                    ) : (
                      <span className="text-gray-400">Selecionar do repertório...</span>
                    )}
                  </span>
                  <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </button>
                {repertorio.length > 0 && (
                  <p className={`text-xs mt-1.5 ml-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {repertorio.length} músicas disponíveis
                  </p>
                )}
              </div>

              {/* Dedication field */}
              <div>
                <label className={`text-xs font-bold uppercase tracking-wider block mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Dedicar para Alguém (Opcional)
                </label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Escreva uma mensagem para alguém especial..."
                  rows={3}
                  className={`w-full p-4 rounded-2xl border-2 text-sm outline-none resize-none transition-all focus:border-neon-purple ${
                    isDark
                      ? 'bg-white/5 border-white/15 text-white placeholder:text-gray-500'
                      : 'bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400'
                  }`}
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-8 space-y-3">
              <button
                onClick={() => setStage(STAGE.TIP_VALUE)}
                disabled={requesting}
                className="w-full py-4 px-6 rounded-2xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #7B2EFF, #39FF6A)',
                  boxShadow: '0 0 25px rgba(123,46,255,0.4)'
                }}
              >
                <DollarSign className="w-5 h-5" />
                Adicionar Gorjeta
              </button>

              <button
                onClick={submitRequest}
                disabled={requesting}
                className={`w-full py-4 px-6 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
                  isDark
                    ? 'bg-white/10 text-white hover:bg-white/15'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {requesting ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                Fazer Apenas o Pedido sem Gorjeta
              </button>
            </div>

            {/* Footer slogan */}
            <p className={`mt-8 text-xs text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              Toca Mais — Música ao vivo, gorjeta com amor 💜
            </p>
          </motion.div>
        );

      case STAGE.ORDER_ONLY_THANKS:
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="w-20 h-20 rounded-full bg-neon-green/20 flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-neon-green" />
            </div>
            <h2 className={`font-bold text-xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Obrigado por participar do show!
            </h2>
            <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Seu pedido foi enviado ao artista.
            </p>

            <button
              onClick={() => {
                setTipAmount(0);
                setStage(STAGE.TIP_VALUE);
              }}
              className="mt-8 text-sm text-neon-purple hover:underline"
            >
              Adicionar uma gorjeta agora →
            </button>
          </motion.div>
        );

      case STAGE.TIP_VALUE:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full max-w-sm"
          >
            <h2 className={`font-bold text-xl text-center mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Valor da Gorjeta
            </h2>

            <div className="mb-6">
              <input
                type="number"
                min="2"
                step="1"
                value={tipAmount}
                onChange={e => setTipAmount(Math.max(0, Number(e.target.value)))}
                className={`w-full p-4 rounded-2xl border-2 text-3xl font-bold text-center outline-none transition-all focus:border-neon-purple ${
                  isDark ? 'bg-white/5 border-white/15 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'
                }`}
                placeholder="R$ 0,00"
              />
              <p className={`text-xs text-center mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                Valor mínimo: R$ 2,00
              </p>
            </div>

            <div className="mb-6">
              <label className={`text-xs font-bold uppercase tracking-wider block mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                CPF (obrigatório para PIX)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={customerCpf}
                onChange={e => setCustomerCpf(e.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder="000.000.000-00"
                className={`w-full p-4 rounded-2xl border-2 text-sm outline-none transition-all focus:border-neon-purple ${
                  isDark ? 'bg-white/5 border-white/15 text-white placeholder:text-gray-500' : 'bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400'
                }`}
              />
            </div>

            <div className="grid grid-cols-3 gap-3 mb-8">
              {quickTipValues.map(value => (
                <button
                  key={value}
                  onClick={() => setTipAmount(value)}
                  className={`py-3 rounded-2xl font-bold text-sm transition-all ${
                    tipAmount === value
                      ? 'bg-neon-green text-white'
                      : isDark ? 'bg-white/5 text-white' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  R$ {value}
                </button>
              ))}
            </div>

            {pixError && (
              <p className="text-xs text-red-400 text-center mb-3">{pixError}</p>
            )}
            <button
              onClick={createPixPayment}
              disabled={tipAmount < 2 || !customerCpf || customerCpf.length < 11 || pixLoading}
              className="w-full py-4 rounded-2xl font-bold text-sm text-white transition-all disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #39FF6A, #2ECC40)',
                boxShadow: '0 0 20px rgba(57,255,106,0.3)'
              }}
            >
              {pixLoading ? 'Gerando PIX...' : 'Continuar para Pagamento'}
            </button>
          </motion.div>
        );

      case STAGE.PIX_PAYMENT:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full max-w-sm"
          >
            <div className={`p-6 rounded-3xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-lg'}`}>
              <div className="flex items-center gap-2 mb-4">
                <div className={`p-2 rounded-xl ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                  <QrCode className="w-5 h-5 text-neon-purple" />
                </div>
                <span className={`ml-2 font-bold text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  QR Code PIX
                </span>
              </div>

              <div className="flex justify-center mb-4">
                <div className="p-4 bg-white rounded-2xl">
                  {pixQrCodeBase64 ? (
                    <img
                      src={`data:image/png;base64,${pixQrCodeBase64}`}
                      alt="QR Code PIX"
                      className="w-40 h-40"
                    />
                  ) : (
                    <div className="w-40 h-40 flex items-center justify-center">
                      <Loader className="w-8 h-8 animate-spin text-neon-purple" />
                    </div>
                  )}
                </div>
              </div>

              <p className={`text-center text-xs mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Escaneie o código acima para fazer o pagamento
              </p>

              <div className="space-y-3">
                <div className={`p-3 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                  <p className={`text-[10px] uppercase tracking-wider mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    Código PIX (Copiar e Colar)
                  </p>
                  <div className="flex items-center justify-between">
                    <p className={`font-mono text-sm truncate ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {pixQrCode}
                    </p>
                    {pixQrCode && (
                      <button
                        onClick={copyPixKey}
                        className="p-2 rounded-lg bg-neon-purple/20 text-neon-purple hover:bg-neon-purple/30 transition-colors ml-2 flex-shrink-0"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>

                <div className={`p-3 rounded-xl bg-neon-green/10 border border-neon-green/30 text-center`}>
                  <p className={`text-neon-green font-bold text-sm`}>
                    Valor: R$ {tipAmount.toFixed(2)}
                  </p>
                </div>

                <button
                  onClick={() => processTipPayment(true)}
                  disabled={requesting}
                  className="w-full py-3 rounded-xl font-bold text-xs text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #7B2EFF, #39FF6A)' }}
                >
                  {requesting ? <Loader className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Já paguei - Confirmar Pedido
                </button>
              </div>
            </div>
          </motion.div>
        );

      case STAGE.FINAL_THANKS:
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="w-20 h-20 rounded-full bg-neon-green/20 flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-neon-green" />
            </div>
            <h2 className={`font-bold text-xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Obrigado!
            </h2>
            <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Seu pedido e gorjeta foram enviados com sucesso.
            </p>
            <p className={`mt-4 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              O artista foi notificado e seu pedido entrará na fila prioritária!
            </p>
          </motion.div>
        );
    }
  };

  return (
    <div className={`min-h-screen font-poppins flex flex-col ${isDark ? 'bg-app-dark' : 'bg-gray-50'}`}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon-green/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center px-4 py-8">
        {stage !== STAGE.FORM && stage !== STAGE.FINAL_THANKS && (
          <button
            onClick={() => {
              if (stage === STAGE.TIP_VALUE) { setStage(STAGE.FORM); setPixError(''); }
              else if (stage === STAGE.PIX_PAYMENT) setStage(STAGE.TIP_VALUE);
            }}
            className={`self-start mb-6 p-2 rounded-xl ${isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {renderStage()}
      </div>

      <AnimatePresence>
        {showMusicPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            onClick={() => setShowMusicPicker(false)}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className={`relative w-full max-w-lg max-h-[80vh] rounded-t-3xl sm:rounded-3xl p-4 ${
                isDark ? 'bg-[#08041A]' : 'bg-white'
              }`}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Escolha uma Música
                </h3>
                <button
                  onClick={() => setShowMusicPicker(false)}
                  className={`p-2 rounded-xl ${isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border mb-4 ${
                isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
              }`}>
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar música..."
                  value={searchRepertorio}
                  onChange={e => setSearchRepertorio(e.target.value)}
                  className={`flex-1 bg-transparent text-sm outline-none ${
                    isDark ? 'text-white placeholder:text-gray-500' : 'text-gray-800 placeholder:text-gray-400'
                  }`}
                />
              </div>

              <div className="space-y-2 overflow-y-auto max-h-[50vh] pr-2">
                {repertorio
                  .filter(m =>
                    searchRepertorio === '' ||
                    m.titulo?.toLowerCase().includes(searchRepertorio.toLowerCase()) ||
                    m.artista_nome?.toLowerCase().includes(searchRepertorio.toLowerCase())
                  )
                  .map((musica, index) => (
                    <motion.button
                      key={musica.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => {
                        setSelectedMusic(musica);
                        setShowMusicPicker(false);
                      }}
                      className={`w-full p-3 rounded-xl border flex items-center gap-3 transition-all ${
                        isDark ? 'bg-white/5 border-white/10 hover:border-neon-purple/50' : 'bg-gray-50 border-gray-200 hover:border-neon-purple/50'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-neon-purple/20 flex items-center justify-center flex-shrink-0">
                        <Music className="w-5 h-5 text-neon-purple" />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className={`font-semibold text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {musica.titulo}
                        </p>
                        <p className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {musica.artista_nome}
                        </p>
                      </div>
                      <Heart className="w-5 h-5 text-gray-400" />
                    </motion.button>
                  ))}
                {(repertorio.filter(m =>
                  searchRepertorio === '' ||
                  m.titulo?.toLowerCase().includes(searchRepertorio.toLowerCase()) ||
                  m.artista_nome?.toLowerCase().includes(searchRepertorio.toLowerCase())
                ).length) === 0 && (
                  <p className={`text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    Nenhuma música encontrada
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
