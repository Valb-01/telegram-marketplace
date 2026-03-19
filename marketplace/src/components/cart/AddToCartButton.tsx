import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/lib/cart';
import { useTelegram } from '@/hooks/useTelegram';
import type { Product } from '@/lib/api';

interface AddToCartButtonProps {
  product: Product;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export default function AddToCartButton({
  product,
  size = 'md',
  fullWidth = false,
}: AddToCartButtonProps) {
  const addItem = useCartStore((s) => s.addItem);
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const { haptic } = useTelegram();

  const cartItem = items.find((i) => i.product.id === product.id);
  const inCart = !!cartItem;

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-xl',
    md: 'px-4 py-2.5 text-sm rounded-xl',
    lg: 'px-5 py-3.5 text-sm rounded-2xl',
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (inCart) {
      removeItem(product.id);
      haptic.light();
    } else {
      addItem(product);
      haptic.medium();
    }
  };

  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={handleClick}
      className={`
        relative overflow-hidden font-semibold transition-all
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${inCart
          ? 'bg-green-500/15 text-green-400 border border-green-500/30'
          : 'bg-gradient-brand text-white'
        }
      `}
    >
      <AnimatePresence mode="wait">
        {inCart ? (
          <motion.span
            key="in-cart"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-center justify-center gap-1.5"
          >
            ✓ Added
          </motion.span>
        ) : (
          <motion.span
            key="add"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-center justify-center gap-1.5"
          >
            + Cart
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
