import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Send, CheckCheck, ArrowLeft } from 'lucide-react';
import AppLayout from '../../components/shared/AppLayout';
import { useAuth } from '../../lib/AuthContext';
import { useTheme } from '../../lib/ThemeContext';
import { supabase } from '../../lib/supabaseClient';

export default function MessagesPage({ role = 'artist' }) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [activeChat, setActiveChat] = useState(null);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    if (!user?.id) return;
    console.log('MessagesPage user.id:', user.id);
    loadConversations();
  }, [user?.id]);

  const loadConversations = async () => {
    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    console.log('msgs', msgs);

    if (!msgs) return;

    const partnerIds = new Set();
    msgs.forEach(m => {
      const pid = m.sender_id === user.id ? m.receiver_id : m.sender_id;
      partnerIds.add(pid);
    });

    console.log('partnerIds', partnerIds);

    const convs = [];
    for (const pid of partnerIds) {
      const partnerMsgs = msgs.filter(m => (m.sender_id === pid && m.receiver_id === user.id) || (m.sender_id === user.id && m.receiver_id === pid));
      const last = partnerMsgs[0];

      let name = pid.slice(0, 8);
      let photo = '';

      const { data: u } = await supabase.from('users').select('name').eq('id', pid).single();
      if (u) name = u.name;

      const { data: artist } = await supabase.from('artists').select('artistic_name, photo_url').eq('user_id', pid).single();
      if (artist) { name = artist.artistic_name; photo = artist.photo_url || ''; }

      if (!photo) {
        const { data: venue } = await supabase.from('venues').select('venue_name, logo_url').eq('user_id', pid).single();
        if (venue) { name = venue.venue_name; photo = venue.logo_url || ''; }
      }

      if (!photo) {
        const { data: ctr } = await supabase.from('contractors').select('photo_url').eq('user_id', pid).single();
        if (ctr) photo = ctr.photo_url || '';
      }

      convs.push({
        id: pid,
        name,
        avatar: photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7B2EFF&color=fff`,
        lastMessage: last.text,
        time: new Date(last.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        unread: 0
      });
    }

    console.log('convs', convs);

    setConversations(convs);
  };

  const openChat = async (conv) => {
    setActiveChat(conv);
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${conv.id}),and(sender_id.eq.${conv.id},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });

    setMessages((data || []).map(m => ({
      id: m.id,
      text: m.text,
      sender: m.sender_id === user.id ? 'me' : 'them',
      time: new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    })));
  };

  const sendMessage = async () => {
    if (!message.trim() || !activeChat) return;

    const { data } = await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: activeChat.id,
      text: message.trim()
    }).select().single();

    if (data) {
      setMessages(prev => [...prev, {
        id: data.id,
        text: data.text,
        sender: 'me',
        time: new Date(data.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      }]);
    }

    setMessage('');
  };

  const filtered = conversations.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  if (activeChat) {
    return (
      <div className={`min-h-screen font-poppins flex flex-col ${isDark ? 'bg-app-dark' : 'bg-gray-50'}`}>
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-64 h-64 bg-neon-purple/8 rounded-full blur-3xl" />
        </div>

        <header className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b px-4 py-3 flex items-center gap-3 ${
          isDark ? 'bg-app-dark/90 border-white/5' : 'bg-white/90 border-gray-200'
        }`}>
          <button onClick={() => setActiveChat(null)} className={`p-2 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
            <ArrowLeft className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-700'}`} />
          </button>
          <div className="relative">
            <img src={activeChat.avatar} alt={activeChat.name} className="w-10 h-10 rounded-xl object-cover" />
          </div>
          <div className="flex-1">
            <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{activeChat.name}</p>
          </div>
        </header>

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
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                  msg.sender === 'me'
                    ? 'bg-neon-purple text-white rounded-br-sm'
                    : isDark ? 'bg-white/10 text-white rounded-bl-sm' : 'bg-gray-200 text-gray-800 rounded-bl-sm'
                }`}
                  style={msg.sender === 'me' ? { boxShadow: '0 0 15px rgba(123,46,255,0.3)' } : {}}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                  <div className={`flex items-center gap-1 mt-1 ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-[10px] opacity-60">{msg.time}</span>
                    {msg.sender === 'me' && <CheckCheck className="w-3 h-3 text-neon-green" />}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </main>

        <div className={`fixed bottom-0 left-0 right-0 backdrop-blur-xl border-t px-4 py-3 ${
          isDark ? 'bg-app-dark/90 border-white/5' : 'bg-white/90 border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`flex-1 flex items-center gap-2 px-4 py-3 rounded-2xl border focus-within:border-neon-purple/50 transition-colors ${
              isDark ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'
            }`}>
              <input
                type="text"
                placeholder="Mensagem..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                className={`flex-1 bg-transparent text-sm outline-none placeholder:text-gray-500 ${isDark ? 'text-white' : 'text-gray-900'}`}
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
    <AppLayout role={role} userName={user?.name || ''}>
      <div className="px-4 py-5 space-y-4">
        <div>
          <h1 className={`font-bold text-xl ${isDark ? 'text-white' : 'text-gray-900'}`}>Mensagens</h1>
          <p className="text-gray-400 text-sm">Suas conversas</p>
        </div>

        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border focus-within:border-neon-purple/50 transition-colors ${
          isDark ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'
        }`}>
          <Search className="w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Buscar conversas..." value={search} onChange={e => setSearch(e.target.value)}
            className={`flex-1 bg-transparent text-sm outline-none placeholder:text-gray-500 ${isDark ? 'text-white' : 'text-gray-900'}`} />
        </div>

        <div className="space-y-2">
          {filtered.length === 0 && (
            <p className="text-gray-500 text-xs text-center py-8">Nenhuma conversa ainda.</p>
          )}
          {filtered.map((conv, i) => (
            <motion.div
              key={conv.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}
              onClick={() => openChat(conv)}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                isDark ? 'bg-white/5 border-white/8 hover:border-neon-purple/30' : 'bg-white border-gray-200 hover:border-neon-purple/30 shadow-sm'
              }`}
            >
              <div className="relative">
                <img src={conv.avatar} alt={conv.name} className="w-12 h-12 rounded-xl object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{conv.name}</p>
                  <span className="text-gray-500 text-xs">{conv.time}</span>
                </div>
                <p className="text-gray-400 text-xs truncate">{conv.lastMessage}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
