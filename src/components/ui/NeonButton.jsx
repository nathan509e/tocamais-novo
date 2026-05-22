import { motion } from 'framer-motion';

export default function NeonButton({ children, variant = 'purple', size = 'md', onClick, className = '', disabled = false, type = 'button' }) {
  const variants = {
    purple: 'bg-neon-purple hover:bg-purple-600 text-white shadow-[0_4px_14px_rgba(123,46,255,0.39)] hover:shadow-[0_6px_20px_rgba(123,46,255,0.23)]',
    green: 'bg-neon-green hover:bg-green-400 text-black shadow-[0_4px_14px_rgba(57,255,106,0.39)] hover:shadow-[0_6px_20px_rgba(57,255,106,0.23)]',
    outline: 'bg-transparent border border-neon-purple text-neon-purple hover:bg-neon-purple/5',
    ghost: 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200',
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
<<<<<<< HEAD
}
=======
}
>>>>>>> cfaa0e1da1fafe997fd82dd3f64f0f9179b0d047
