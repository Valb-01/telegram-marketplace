import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface EmptyStateProps {
  emoji?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  children?: ReactNode;
}

export default function EmptyState({
  emoji = '📭',
  title,
  description,
  action,
  children,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[50vh] px-6 text-center"
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
        className="text-6xl mb-4"
      >
        {emoji}
      </motion.div>

      <h2 className="text-xl font-bold text-white mb-2">{title}</h2>

      {description && (
        <p className="text-gray-400 text-sm max-w-xs leading-relaxed mb-6">{description}</p>
      )}

      {action && (
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={action.onClick}
          className="px-6 py-3 rounded-2xl bg-gradient-brand text-white font-semibold text-sm"
        >
          {action.label}
        </motion.button>
      )}

      {children}
    </motion.div>
  );
}
