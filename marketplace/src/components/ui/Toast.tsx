import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

// Simple singleton store
let _addToast: ((toast: Omit<Toast, 'id'>) => void) | null = null;

export function toast(message: string, type: Toast['type'] = 'info') {
  _addToast?.({ message, type });
}
toast.success = (msg: string) => toast(msg, 'success');
toast.error   = (msg: string) => toast(msg, 'error');
toast.warning = (msg: string) => toast(msg, 'warning');

const icons: Record<Toast['type'], string> = {
  success: '✅',
  error:   '❌',
  info:    'ℹ️',
  warning: '⚠️',
};

const colors: Record<Toast['type'], string> = {
  success: 'border-green-500/30 bg-green-500/10',
  error:   'border-red-500/30 bg-red-500/10',
  info:    'border-brand-blue/30 bg-brand-blue/10',
  warning: 'border-yellow-500/30 bg-yellow-500/10',
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev.slice(-4), { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  useEffect(() => {
    _addToast = addToast;
    return () => { _addToast = null; };
  }, [addToast]);

  return (
    <div className="fixed top-16 left-0 right-0 z-[100] flex flex-col items-center gap-2 px-4 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border glass text-sm font-medium text-white shadow-lg pointer-events-auto max-w-sm w-full ${colors[t.type]}`}
          >
            <span>{icons[t.type]}</span>
            <span className="flex-1">{t.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
