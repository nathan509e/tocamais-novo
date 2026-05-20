import { motion } from 'framer-motion';

export default function NeonButton({ children, variant = 'purple', size = 'md', onClick, className = '', disabled = false, type = 'button' }) {
  const variants = {
    purple: 'bg-neon-purple hover:bg-purple-600 text-white shadow-[0_0_20px_rgba(123,46,255,0.5)] hover:shadow-[0_0_30px_rgba(123,46,255,0.8)]',
    green: 'bg-neon-green hover:bg-green-400 text-black shadow-[0_0_20px_rgba(57,255,106,0.5)] hover:shadow-[0_0_30px_rgba(57,255,106,0.8)]',
    outline: 'bg-transparent border border-neon-purple text-neon-purple hover:bg-neon-purple/10 hover:shadow-[0_0_20px_rgba(123,46,255,0.3)]',
    ghost: 'bg-white/5 hover:bg-white/10 text-white border border-white/10',
    gradient: 'text-white border-0',
  };

  const sizes = {
    sm: 'px-4 py-1.5 text-xs rounded-full',
    md: 'px-6 py-2.5 text-sm rounded-full',
    lg: 'px-8 py-3.5 text-base rounded-full',
    xl: 'px-10 py-4 text-lg rounded-full',
  };

  const gradientStyle = variant === 'gradient' ? {
    background: 'linear-gradient(135deg, #7B2EFF 0%, #39FF6A 100%)',
    boxShadow: '0 0 25px rgba(123,46,255,0.5)',
  } : {};

  return (
    <motion.button
      type={type}
      whileHover={{ scale: disabled ? 1 : 1.04 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      onClick={onClick}
      disabled={disabled}
      style={gradientStyle}
      className={`font-poppins font-semibold transition-all duration-300 ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
    >
      {children}
    </motion.button>
  );
}