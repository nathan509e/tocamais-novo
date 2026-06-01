import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, Share2, Copy, Check, Music, Search, X, ShoppingCart, Heart, Send, Loader } from 'lucide-react';
import { useTheme } from '../../lib/ThemeContext';
import { supabase } from '../../lib/supabaseClient';

export default function ArtistTip() {
  const { artistId } = useParams();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [artist, setArtist] = useState(null);
  const [repertorio, setRepertorio] = useState([]);
  const [searchRepertorio, setSearchRepertorio] = useState('');
  const [selectedMusic, setSelectedMusic] = useState(null);
  const [showMusicPicker, setShowMusicPicker] = useState(false);
  const [copied, setCopied] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [userName, setUserName] = useState('');

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
            city: 'Brasil'
          });
        }
      }
    }
    loadArtist();
  }, [artistId]);

  const copyPixKey = () => {
    if (artist?.pix_key) {
      navigator.clipboard.writeText(artist.pix_key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const qrCodeValue = artist?.pix_key 
    ? `00020101021126580014br.gov.bcb.pix0136${artist.pix_key}5204000053039865802BR5913${artist.artistic_name || 'Artista'}6008${artist.city || 'São Paulo'}62610505TocaMais`
    : `https://staging.tocamais.com.br/pix/${artistId}`;

  const submitMusicRequest = async () => {
    if (!selectedMusic || !artistId) return;
    setRequesting(true);
    
    try {
      const { error } = await supabase.from('music_requests').insert({
        artist_id: artistId,
        musica_id: selectedMusic.id,
        musica_titulo: selectedMusic.titulo,
        musica_artista: selectedMusic.artista_nome,
        user_name: userName || 'Cliente',
        status: 'approved',
        requested_at: new Date().toISOString(),
        amount: 0
      });

      if (error) {
        console.error('Erro ao criar pedido:', error);
        alert('Erro: ' + error.message + '\n\nCertifique-se de criar a tabela music_requests no Supabase.');
      } else {
        setRequestSuccess(true);
        setTimeout(() => {
          setRequestSuccess(false);
          setSelectedMusic(null);
        }, 3000);
      }
    } catch (e) {
      console.error('Error submitting request:', e);
      alert('Erro: ' + e.message);
    }
    
    setRequesting(false);
  };

  return (
    <div className={`min-h-screen font-poppins flex flex-col ${isDark ? 'bg-app-dark' : 'bg-gray-50'}`}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon-green/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className={`font-black text-2xl ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Gorjeta para
          </h1>
          <h2 className={`font-bold text-xl mt-1 ${isDark ? 'text-neon-purple' : 'text-neon-purple'}`}>
            {artist?.artistic_name || 'Artista'}
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="relative mb-8"
        >
          <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-neon-purple/30"
            style={{ boxShadow: '0 0 40px rgba(123,46,255,0.4)' }}>
            <img 
              src={artist?.photo_url || 'https://ui-avatars.com/api/?name=Artista&background=7B2EFF&color=fff&size=200'} 
              alt={artist?.artistic_name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-neon-purple flex items-center justify-center"
            style={{ boxShadow: '0 0 20px rgba(123,46,255,0.5)' }}>
            <Music className="w-5 h-5 text-white" />
          </div>
        </motion.div>

        {repertorio.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="w-full max-w-sm mb-6"
          >
            <button
              onClick={() => setShowMusicPicker(true)}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2"
              style={{ 
                background: 'linear-gradient(135deg, #7B2EFF, #39FF6A)',
                boxShadow: '0 0 20px rgba(123,46,255,0.4)'
              }}
            >
              <Music className="w-5 h-5" />
              Pedir uma Música
            </button>
            <p className={`text-center text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {repertorio.length} músicas disponíveis
            </p>
          </motion.div>
        )}

        {selectedMusic && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`w-full max-w-sm p-4 rounded-xl border mb-6 ${
              isDark ? 'bg-neon-purple/10 border-neon-purple/30' : 'bg-neon-purple/10 border-neon-purple/30'
            }`}
          >
            <p className={`text-xs font-bold uppercase tracking-wider mb-1 text-neon-purple`}>
              Música Selecionada
            </p>
            <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {selectedMusic.titulo}
            </p>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {selectedMusic.artista_nome}
            </p>

            {requestSuccess ? (
              <div className="mt-3 p-3 rounded-lg bg-neon-green/20 border border-neon-green/30">
                <p className="text-neon-green font-bold text-sm text-center">
                  Pedido enviado com sucesso!
                </p>
              </div>
            ) : (
              <>
                <div className="mt-3">
                  <label className="text-xs text-gray-400 font-bold block mb-1">
                    Seu nome
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={e => setUserName(e.target.value)}
                    placeholder="Digite seu nome"
                    className={`w-full p-2.5 rounded-xl border text-xs outline-none ${
                      isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-gray-500' : 'bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400'
                    }`}
                  />
                </div>
                <button
                  onClick={submitMusicRequest}
                  disabled={requesting}
                  className="w-full mt-3 py-3 rounded-xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ 
                    background: 'linear-gradient(135deg, #7B2EFF, #39FF6A)',
                    boxShadow: '0 0 20px rgba(123,46,255,0.4)'
                  }}
                >
                  {requesting ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                  Enviar Pedido
                </button>
              </>
            )}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`w-full max-w-sm p-6 rounded-3xl border ${
            isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-lg'
          }`}
        >
          <div className="flex items-center justify-center mb-4">
            <div className={`p-2 rounded-xl ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
              <QrCode className="w-5 h-5 text-neon-purple" />
            </div>
            <span className={`ml-2 font-bold text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>
              QR Code PIX
            </span>
          </div>

          <div className="flex justify-center mb-4">
            <div className="p-4 bg-white rounded-2xl">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeValue)}&bgcolor=ffffff&color=000000`}
                alt="QR Code PIX"
                className="w-40 h-40"
              />
            </div>
          </div>

          <p className={`text-center text-xs mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Escaneie o código acima para fazer uma gorjeta
          </p>

          {artist?.pix_key && (
            <div className="space-y-3">
              <div className={`p-3 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                <p className={`text-[10px] uppercase tracking-wider mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Chave PIX
                </p>
                <div className="flex items-center justify-between">
                  <p className={`font-mono text-sm truncate ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    {artist.pix_key}
                  </p>
                  <button
                    onClick={copyPixKey}
                    className="p-2 rounded-lg bg-neon-purple/20 text-neon-purple hover:bg-neon-purple/30 transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                onClick={() => navigator.clipboard.writeText(artist.pix_key)}
                className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all"
                style={{ 
                  background: 'linear-gradient(135deg, #7B2EFF, #39FF6A)',
                  boxShadow: '0 0 20px rgba(123,46,255,0.4)'
                }}
              >
                Copiar Chave PIX
              </button>
            </div>
          )}

          {!artist?.pix_key && (
            <div className={`text-center p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Configure sua chave PIX no seu perfil para receber gorjetas
              </p>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 flex gap-3"
        >
          <button className={`p-3 rounded-xl border ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-700'}`}>
            <Share2 className="w-5 h-5" />
          </button>
        </motion.div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          onClick={async () => {
            const musica = selectedMusic || repertorio[0];
            if (!musica || !artistId) return;
            setRequesting(true);
            try {
              const { error } = await supabase.from('music_requests').insert({
                artist_id: artistId,
                musica_id: musica.id,
                musica_titulo: musica.titulo,
                musica_artista: musica.artista_nome,
                user_name: userName || 'Cliente (Teste)',
                status: 'approved',
                requested_at: new Date().toISOString(),
                amount: 5
              });
              if (error) {
                console.error('Erro ao criar pedido:', error);
                alert('Erro: ' + error.message + '\n\nCertifique-se de criar a tabela music_requests no Supabase.');
              } else {
                setSelectedMusic(musica);
                setRequestSuccess(true);
                setTimeout(() => setRequestSuccess(false), 3000);
              }
            } catch (e) {
              console.error(e);
              alert('Erro: ' + e.message);
            }
            setRequesting(false);
          }}
          className="w-full max-w-sm py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
          style={{
            background: 'linear-gradient(135deg, #39FF6A, #2ECC40)',
            boxShadow: '0 0 20px rgba(57,255,106,0.3)',
            opacity: requesting ? 0.5 : 1
          }}
        >
          <Check className="w-5 h-5" />
          {requesting ? 'Enviando...' : requestSuccess ? 'Pedido enviado!' : 'PIX Enviado (Teste)'}
        </motion.button>

        <p className={`mt-8 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          Powered by TocaMais
        </p>
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