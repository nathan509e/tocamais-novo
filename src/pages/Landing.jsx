import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Music, Building2, User, ArrowRight, Star, Zap } from 'lucide-react';
import WaveIcon from '../components/shared/WaveIcon';

const roles = [
  {
    id: 'artist',
    icon: Music,
    title: 'Sou Artista',
    description: 'Gerencie sua agenda, receba propostas e cresça sua carreira musical.',
    color: 'purple',
    gradient: 'from-neon-purple/20 to-purple-900/10',
    border: 'border-neon-purple/30',
    glow: 'hover:shadow-[0_0_40px_rgba(123,46,255,0.3)]',
    path: '/artist',
  },
  {
    id: 'venue',
    icon: Building2,
    title: 'Casa de Show',
    description: 'Encontre os melhores artistas para sua casa e gerencie seus eventos ao vivo.',
    color: 'green',
    gradient: 'from-neon-green/10 to-green-900/10',
    border: 'border-neon-green/30',
    glow: 'hover:shadow-[0_0_40px_rgba(57,255,106,0.25)]',
    path: '/venue',
  },
  {
    id: 'contractor',
    icon: User,
    title: 'Contratante',
    description: 'Contrate músicos para casamentos, aniversários e eventos especiais.',
    color: 'purple',
    gradient: 'from-purple-900/10 to-neon-purple/5',
    border: 'border-white/10',
    glow: 'hover:shadow-[0_0_40px_rgba(123,46,255,0.2)]',
    path: '/contractor',
  },
];

const stats = [
  { value: '12.000+', label: 'Artistas' },
  { value: '3.500+', label: 'Venues' },
  { value: '98K+', label: 'Shows realizados' },
  { value: '4.9', label: 'Avaliação média', icon: Star },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-app-dark font-poppins overflow-hidden">
      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-15%] left-[-5%] w-[500px] h-[500px] bg-neon-purple/12 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-neon-green/8 rounded-full blur-3xl" />
        <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] bg-neon-purple/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 px-5 py-8 max-w-lg mx-auto">
        {/* Logo / Hero */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-10"
        >
          <div className="flex justify-center mb-4">
            <motion.div
              animate={{ filter: ['drop-shadow(0 0 15px rgba(123,46,255,0.6))', 'drop-shadow(0 0 30px rgba(57,255,106,0.4))', 'drop-shadow(0 0 15px rgba(123,46,255,0.6))'] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-20 h-20 rounded-2xl bg-gradient-to-br from-neon-purple to-neon-green p-0.5"
            >
              <div className="w-full h-full rounded-2xl bg-app-dark flex items-center justify-center">
                <WaveIcon size={40} animated />
              </div>
            </motion.div>
          </div>

          <h1 className="text-4xl font-black text-white mb-1">
            Toca<span className="text-neon-purple" style={{ textShadow: '0 0 30px rgba(123,46,255,0.8)' }}>Mais</span>
          </h1>
          <p className="text-neon-green text-xs font-semibold tracking-widest uppercase mb-3">Live Music & Connection</p>
          <p className="text-gray-400 text-sm leading-relaxed">
            A plataforma que conecta artistas, casas de show e contratantes em uma experiência musical única.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-4 gap-2 mb-10"
        >
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="text-center p-2 rounded-xl bg-white/5 border border-white/8"
            >
              <div className="flex items-center justify-center gap-0.5">
                {s.icon && <s.icon className="w-3 h-3 text-yellow-400 fill-yellow-400" />}
                <p className="text-white font-bold text-sm">{s.value}</p>
              </div>
              <p className="text-gray-500 text-[9px] mt-0.5">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Role selection */}
        <div className="mb-8">
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-white font-bold text-lg mb-1"
          >
            Como você quer entrar?
          </motion.h2>
          <p className="text-gray-500 text-sm mb-5">Escolha seu perfil para personalizar sua experiência.</p>

          <div className="space-y-4">
            {roles.map((role, i) => {
              const Icon = role.icon;
              return (
                <motion.div
                  key={role.id}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(role.path)}
                  className={`relative p-5 rounded-2xl border ${role.border} bg-gradient-to-r ${role.gradient} cursor-pointer transition-all duration-300 ${role.glow} backdrop-blur-xl`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${role.color === 'purple' ? 'bg-neon-purple/20' : 'bg-neon-green/20'}`}>
                      <Icon className={`w-6 h-6 ${role.color === 'purple' ? 'text-neon-purple' : 'text-neon-green'}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-base">{role.title}</h3>
                      <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">{role.description}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="p-5 rounded-2xl bg-gradient-to-r from-neon-purple/10 to-neon-green/5 border border-neon-purple/20"
        >
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-neon-purple" />
            <span className="text-white font-semibold text-sm">Por que TocaMais?</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {['Pagamento seguro', 'Chat em tempo real', 'Artistas verificados', 'Contrato digital'].map((f, i) => (
              <div key={i} className="flex items-center gap-1.5 text-gray-300 text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-neon-green" />
                {f}
              </div>
            ))}
          </div>
        </motion.div>

        <p className="text-center text-gray-600 text-xs mt-6">
          Escolha a música e Viva o momento. ✨
        </p>
      </div>
    </div>
  );
}