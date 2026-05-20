import { motion } from 'framer-motion';

export default function GlassCard({ children, className = '', glow = false, glowColor = 'purple', onClick, animate = true }) {
  const glowStyles = {
    purple: 'hover:shadow-[0_0_30px_rgba(123,46,255,0.25)] hover:border-neon-purple/30',
    green: 'hover:shadow-[0_0_30px_rgba(57,255,106,0.25)] hover:border-neon-green/30',
  };

  const baseClass = `
    bg-white/5 backdrop-blur-xl border border-white/8 rounded-2xl
    transition-all duration-300
    ${glow ? glowStyles[glowColor] : ''}
    ${onClick ? 'cursor-pointer' : ''}
    ${className}
  `;

  if (!animate) return <div className={baseClass} onClick={onClick}>{children}</div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={baseClass}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}