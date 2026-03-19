interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple';
  size?: 'sm' | 'md';
}

const variants = {
  default: 'bg-bg-hover text-gray-300 border-white/8',
  success: 'bg-green-500/10 text-green-400 border-green-500/20',
  warning: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  error:   'bg-red-500/10 text-red-400 border-red-500/20',
  info:    'bg-brand-blue/10 text-brand-blue border-brand-blue/20',
  purple:  'bg-brand-purple/10 text-brand-purple border-brand-purple/20',
};

const sizes = {
  sm: 'text-[10px] px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
};

export function Badge({ children, variant = 'default', size = 'md' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full border font-semibold ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  );
}
