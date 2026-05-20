import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({ title, value, change, changeLabel, icon: Icon, iconColor = 'purple', delay = 0 }) {
  const isPositive = change > 0;
  const iconBg = iconColor === 'purple' ? 'bg-neon-purple/20' : 'bg-neon-green/20';
  const iconText = iconColor === 'purple' ? 'text-neon-purple' : 'text-neon-green';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-white/5 backdrop-blur-xl border border-white/8 rounded-2xl p-4 hover:border-neon-purple/30 hover:shadow-[0_0_20px_rgba(123,46,255,0.15)] transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconText}`} />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${isPositive ? 'bg-neon-green/15 text-neon-green' : 'bg-red-500/15 text-red-400'}`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <p className="text-gray-400 text-xs mb-1">{title}</p>
      <p className="text-white font-bold text-xl font-poppins">{value}</p>
      {changeLabel && <p className="text-gray-500 text-xs mt-1">{changeLabel}</p>}
    </motion.div>
  );
}