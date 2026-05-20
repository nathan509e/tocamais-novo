import { motion } from 'framer-motion';
import { User, MapPin, Phone, Edit3, Star, Calendar, DollarSign } from 'lucide-react';
import AppLayout from '../../components/shared/AppLayout';
import NeonButton from '../../components/ui/NeonButton';

export default function ContractorProfile() {
  return (
    <AppLayout role="contractor" userName="Maria Santos">
      <div className="px-4 py-5 space-y-5">
        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-3xl text-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(123,46,255,0.2), rgba(57,255,106,0.1))', border: '1px solid rgba(123,46,255,0.3)' }}
        >
          <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto mb-3 border-2 border-neon-purple/50"
            style={{ boxShadow: '0 0 25px rgba(123,46,255,0.4)' }}>
            <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop" alt="Maria" className="w-full h-full object-cover" />
          </div>
          <h2 className="text-white font-black text-xl">Maria Santos</h2>
          <p className="text-gray-400 text-sm mt-0.5">Contratante Particular</p>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <MapPin className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-400 text-xs">São Paulo, SP</span>
          </div>
          <button className="absolute top-4 right-4 p-2 rounded-xl bg-white/10">
            <Edit3 className="w-4 h-4 text-gray-300" />
          </button>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Contratações', value: '8', icon: Calendar },
            { label: 'Avaliações dadas', value: '6', icon: Star },
            { label: 'Total gasto', value: 'R$22K', icon: DollarSign },
          ].map(({ label, value, icon: Icon }, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="p-3 rounded-2xl bg-white/5 border border-white/8 text-center">
              <Icon className="w-5 h-5 text-neon-purple mx-auto mb-1" />
              <p className="text-white font-bold text-base">{value}</p>
              <p className="text-gray-500 text-[10px]">{label}</p>
            </motion.div>
          ))}
        </div>

        {/* Info */}
        <div className="bg-white/5 border border-white/8 rounded-2xl p-4 space-y-4">
          <h3 className="text-white font-semibold text-sm">Informações</h3>
          {[
            { label: 'Nome', value: 'Maria Santos' },
            { label: 'Email', value: 'maria@gmail.com' },
            { label: 'Telefone', value: '(11) 99999-0000' },
            { label: 'Cidade', value: 'São Paulo, SP' },
          ].map((field, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <span className="text-gray-400 text-sm">{field.label}</span>
              <span className="text-white text-sm font-medium">{field.value}</span>
            </div>
          ))}
        </div>

        <NeonButton variant="gradient" size="lg" className="w-full">
          Editar Perfil
        </NeonButton>

        <NeonButton variant="ghost" size="lg" className="w-full text-red-400 border-red-400/30 hover:bg-red-400/10">
          Sair da conta
        </NeonButton>
      </div>
    </AppLayout>
  );
}