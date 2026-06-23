import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { Music, Home, User, Mail, ArrowRight } from 'lucide-react';
import NeonButton from '../components/ui/NeonButton';

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [role, setRole] = useState('artist'); // artist, venue, contractor
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { loginWithRole, signUpWithRole } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    if (!email) {
      setErrorMsg('Por favor, preencha o e-mail.');
      setIsLoading(false);
      return;
    }

    if (!password) {
      setErrorMsg('Por favor, preencha a senha.');
      setIsLoading(false);
      return;
    }

    try {
      if (isRegistering) {
        if (!name) {
          setErrorMsg('Por favor, preencha o seu nome.');
          setIsLoading(false);
          return;
        }
        const { error } = await signUpWithRole({ email, password, name, role, phone });
        if (error) {
          setErrorMsg(error.message || 'Erro ao cadastrar.');
        } else {
          // Navigate to correct dashboard based on role
          navigate(role === 'artist' ? '/artist' : role === 'venue' ? '/venue' : '/contractor');
        }
      } else {
        const { error, user } = await loginWithRole(email, password);
        if (error) {
          setErrorMsg(error.message || 'Dados inválidos ou usuário não cadastrado.');
        } else if (user) {
          const role = (user.user_metadata?.role || user.role || 'contractor').replace('bar_owner', 'venue');
          navigate(role === 'artist' ? '/artist' : role === 'venue' ? '/venue' : '/contractor');
        }
      }
    } catch (err) {
      setErrorMsg('Ocorreu um erro inesperado.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (quickEmail) => {
    setErrorMsg('');
    setIsLoading(true);
    
    const timeout = setTimeout(() => {
      setErrorMsg('Login demorando demais...');
      setIsLoading(false);
    }, 10000);
    
    try {
      const result = await loginWithRole(quickEmail, '123456');
      clearTimeout(timeout);
      const { error, user } = result;
      if (error) {
        setErrorMsg(error.message || 'Erro ao fazer login');
      } else if (user) {
        const role = (user.user_metadata?.role || user.role || 'contractor').replace('bar_owner', 'venue');
        navigate(role === 'artist' ? '/artist' : role === 'venue' ? '/venue' : '/contractor');
      } else {
        setErrorMsg('Resposta inválida do servidor');
      }
    } catch (err) {
      clearTimeout(timeout);
      setErrorMsg('Erro no login rápido: ' + (err?.message || err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08041A] text-white flex flex-col justify-center items-center px-4 relative overflow-hidden font-poppins">
      
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#7B2EFF]/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-[#39FF6A]/10 blur-[100px] pointer-events-none" />

      {/* Main Container */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md bg-white/5 border border-white/10 backdrop-blur-2xl rounded-3xl p-8 relative z-10 shadow-2xl"
      >
        {/* Title / Logo */}
        <div className="text-center mb-8">
          <motion.div 
            animate={{ scale: [1, 1.05, 1] }} 
            transition={{ repeat: Infinity, duration: 4 }}
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#7B2EFF] to-[#39FF6A] p-3 mb-4 shadow-[0_0_20px_rgba(123,46,255,0.4)]"
          >
            <Music className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent">TocaMais</h1>
          <p className="text-gray-400 text-sm mt-1">Conectando artistas e contratantes com facilidade</p>
        </div>

        {/* Quick Logins for Demo */}
        {!isRegistering && (
          <div className="mb-6 p-4 rounded-2xl bg-white/5 border border-white/5">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-2">Entrar rápido (Demonstração):</p>
            <div className="grid grid-cols-3 gap-2">
              <button 
                type="button" 
                onClick={() => handleQuickLogin('lucas@gmail.com')}
                className="py-2 px-1 rounded-xl bg-neon-purple/10 border border-neon-purple/20 text-[10px] font-bold text-purple-300 hover:bg-neon-purple/25 transition-all text-center"
              >
                👨‍🎤 Artista
              </button>
              <button 
                type="button" 
                onClick={() => handleQuickLogin('joao@gmail.com')}
                className="py-2 px-1 rounded-xl bg-neon-green/10 border border-neon-green/20 text-[10px] font-bold text-green-300 hover:bg-neon-green/25 transition-all text-center"
              >
                🏢 Casa Show
              </button>
              <button 
                type="button" 
                onClick={() => handleQuickLogin('maria@gmail.com')}
                className="py-2 px-1 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-300 hover:bg-blue-500/25 transition-all text-center"
              >
                👤 Particular
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <AnimatePresence mode="wait">
            {errorMsg && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-500/15 border border-red-500/30 text-red-300 p-3.5 rounded-xl text-xs font-semibold text-center"
              >
                {errorMsg}
              </motion.div>
            )}
          </AnimatePresence>

          {isRegistering && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Full Name */}
              <div>
                <label className="text-xs text-gray-400 font-bold block mb-1.5 uppercase tracking-wider">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input 
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome ou nome artístico"
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-neon-purple/50 transition-all placeholder:text-gray-600"
                  />
                </div>
              </div>

              {/* Phone (Only for registration) */}
              <div>
                <label className="text-xs text-gray-400 font-bold block mb-1.5 uppercase tracking-wider">Telefone</label>
                <input 
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-neon-purple/50 transition-all placeholder:text-gray-600"
                />
              </div>

              {/* Role Selection Picker */}
              <div>
                <label className="text-xs text-gray-400 font-bold block mb-2 uppercase tracking-wider">Tipo de Perfil</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'artist', label: 'Artista', icon: Music },
                    { id: 'venue', label: 'Casa Show', icon: Home },
                    { id: 'contractor', label: 'Contratante', icon: User }
                  ].map((item) => {
                    const IconComp = item.icon;
                    const active = role === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setRole(item.id)}
                        className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all ${
                          active 
                            ? 'bg-neon-purple/20 border-neon-purple/60 text-white shadow-[0_0_15px_rgba(123,46,255,0.25)]' 
                            : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                        }`}
                      >
                        <IconComp className={`w-5 h-5 mb-1.5 ${active ? 'text-neon-purple' : 'text-gray-400'}`} />
                        <span className="text-[10px] font-bold">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* Email Address */}
          <div>
            <label className="text-xs text-gray-400 font-bold block mb-1.5 uppercase tracking-wider">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplo@gmail.com"
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-neon-purple/50 transition-all placeholder:text-gray-600"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-xs text-gray-400 font-bold block mb-1.5 uppercase tracking-wider">Senha</label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-neon-purple/50 transition-all placeholder:text-gray-600"
            />
          </div>

          {/* Login / Register Button */}
          <NeonButton 
            variant="gradient" 
            size="lg" 
            className="w-full flex items-center justify-center gap-2 mt-2 h-12"
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {isRegistering ? 'Criar Conta' : 'Entrar'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </NeonButton>
        </form>

        {/* Footer toggler */}
        <div className="text-center mt-6 text-xs text-gray-400">
          <span>{isRegistering ? 'Já tem uma conta?' : 'Não tem conta ainda?'}</span>
          <button 
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setErrorMsg('');
            }}
            className="text-neon-green font-bold ml-1.5 hover:underline"
          >
            {isRegistering ? 'Faça login' : 'Cadastre-se gratuitamente'}
          </button>
        </div>

      </motion.div>
    </div>
  );
}
