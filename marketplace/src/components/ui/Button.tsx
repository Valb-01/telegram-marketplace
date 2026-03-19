import { ReactNode, ButtonHTMLAttributes } from 'react';
import { motion } from 'framer-motion';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: ReactNode;
  fullWidth?: boolean;
}

const variants = {
  primary:   'bg-gradient-brand text-white',
  secondary: 'bg-bg-card border border-white/10 text-white hover:border-brand-blue/40',
  ghost:     'text-gray-400 hover:text-white',
  danger:    'bg-red-500/10 border border-red-500/20 text-red-400',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-xl',
  md: 'px-4 py-3 text-sm rounded-2xl',
  lg: 'px-6 py-4 text-base rounded-2xl',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  fullWidth = false,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      {...(props as any)}
      disabled={disabled || loading}
      className={`
        font-semibold transition-all flex items-center justify-center gap-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {loading ? (
        <>
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Loading...
        </>
      ) : (
        children
      )}
    </motion.button>
  );
}
