import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Send, CheckCheck, ArrowLeft } from 'lucide-react';
import AppLayout from '../../components/shared/AppLayout';

const conversations = [
  { id: '1', name: 'Bar do João', avatar: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100&h=100&fit=crop', lastMessage: 'Confirmado para sexta!', time: '14:32', unread: 2, online: true },
  { id: '2', name: 'Maria Santos', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop', lastMessage: 'Quanto você cobra para casamento?', time: '12:10', unread: 0, online: false },
  { id: '3', name: 'Casa Noturna SP', avatar: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100&h=100&fit=crop', lastMessage: 'Proposta enviada! Veja os detalhes...', time: 'Ontem', unread: 1, online: true },
  { id: '4', name: 'Pedro Alves', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop', lastMessage: 'Obrigado pela apresentação incrível! 🎵', time: '2 dias', unread: 0, online: false },
];

const mockMessages = [
  { id: '1', text: 'Olá! Gostaria de contratar você para nosso evento de Sexta-feira.', sender: 'other', time: '14:20' },
  { id: '2', text: 'Olá! Claro, tenho disponibilidade. Qual é o evento?', sender: 'me', time: '14:22' },
  { id: '3', text: 'É um aniversário de 50 anos, bem animado. Esperamos 150 pessoas.', sender: 'other', time: '14:25' },
  { id: '4', text: 'Perfeito! Para essa quantidade, o cachê seria R$ 2.800. Inclui 2 horas de show. O que acha?', sender: 'me', time: '14:28' },
  { id: '5', text: 'Confirmado para sexta!', sender: 'other', time: '14:32' },
];

export default function MessagesPage({ role = 'artist' }) {
  const [activeChat, setActiveChat] = useState(null);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState(mockMessages);

  const sendMessage = () => {
    if (!message.trim()) return;
    setMessages(prev => [...prev, { id: String(prev.length + 1), text: message, sender: 'me', time: 'Agora' }]);
    setMessage('');
  };

  const filtered = conversations.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  if (activeChat) {
    return (
      <div className="min-h-screen bg-app-dark font-poppins flex flex-col">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-64 h-64 bg-neon-purple/8 rounded-full blur-3xl" />
        </div>

        {/* Chat Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-app-dark/90 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setActiveChat(null)} className="p-2 rounded-xl bg-white/5">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="relative">
            <img src={activeChat.avatar} alt={activeChat.name} className="w-10 h-10 rounded-xl object-cover" />
            {activeChat.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-neon-green rounded-full border-2 border-app-dark" />}
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold text-sm">{activeChat.name}</p>
            <p className={`text-xs ${activeChat.online ? 'text-neon-green' : 'text-gray-400'}`}>
              {activeChat.online ? 'Online agora' : 'Offline'}
            </p>
          </div>
        </header>

        {/* Messages */}
        <main className="flex-1 pt-20 pb-24 px-4 overflow-y-auto">
          <div className="space-y-3 py-4">
            {messages.map((msg, i) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${msg.sender === 'me' ? 'bg-neon-purple text-white rounded-br-sm' : 'bg-white/10 text-white rounded-bl-sm'}`}
                  style={msg.sender === 'me' ? { boxShadow: '0 0 15px rgba(123,46,255,0.3)' } : {}}
                >
                  <p className="text-sm">{msg.text}</p>
                  <div className={`flex items-center gap-1 mt-1 ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-[10px] opacity-60">{msg.time}</span>
                    {msg.sender === 'me' && <CheckCheck className="w-3 h-3 text-neon-green" />}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </main>

        {/* Input */}
        <div className="fixed bottom-0 left-0 right-0 bg-app-dark/90 backdrop-blur-xl border-t border-white/5 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 focus-within:border-neon-purple/50 transition-colors">
              <input
                type="text"
                placeholder="Mensagem..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-gray-500"
              />
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={sendMessage}
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #7B2EFF, #39FF6A)', boxShadow: '0 0 20px rgba(123,46,255,0.4)' }}
            >
              <Send className="w-5 h-5 text-white" />
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AppLayout role={role} userName="Lucas Volta">
      <div className="px-4 py-5 space-y-4">
        <div>
          <h1 className="text-white font-bold text-xl">Mensagens</h1>
          <p className="text-gray-400 text-sm">Suas conversas</p>
        </div>

        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus-within:border-neon-purple/50 transition-colors">
          <Search className="w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Buscar conversas..." value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-gray-500" />
        </div>

        <div className="space-y-2">
          {filtered.map((conv, i) => (
            <motion.div
              key={conv.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}
              onClick={() => setActiveChat(conv)}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/8 hover:border-neon-purple/30 transition-all cursor-pointer"
            >
              <div className="relative">
                <img src={conv.avatar} alt={conv.name} className="w-12 h-12 rounded-xl object-cover" />
                {conv.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-neon-green rounded-full border-2 border-app-dark" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-white font-semibold text-sm">{conv.name}</p>
                  <span className="text-gray-500 text-xs">{conv.time}</span>
                </div>
                <p className="text-gray-400 text-xs truncate">{conv.lastMessage}</p>
              </div>
              {conv.unread > 0 && (
                <span className="w-5 h-5 bg-neon-purple rounded-full text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                  {conv.unread}
                </span>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}