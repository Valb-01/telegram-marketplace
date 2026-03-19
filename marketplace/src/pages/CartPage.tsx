import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { useCartStore } from '@/lib/cart';
import { useTelegram } from '@/hooks/useTelegram';

export default function CartPage() {
  const [, navigate] = useLocation();
  const { items, removeItem, updateQuantity, totalStars, totalUsdt, clearCart } = useCartStore();
  const { haptic } = useTelegram();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <div className="text-7xl mb-4">🛒</div>
          <h2 className="text-xl font-bold text-white mb-2">Your cart is empty</h2>
          <p className="text-gray-400 text-sm mb-6">Browse our products and add them to your cart</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 rounded-2xl bg-gradient-brand text-white font-semibold text-sm"
          >
            Browse Products
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Your Cart</h1>
        <button
          onClick={() => { clearCart(); haptic.light(); }}
          className="text-xs text-gray-500 hover:text-red-400 transition-colors"
        >
          Clear all
        </button>
      </div>

      {/* Items */}
      <div className="space-y-3">
        <AnimatePresence>
          {items.map((item) => {
            const thumb = item.product.thumbnailUrl
              ? item.product.thumbnailUrl.startsWith('http')
                ? item.product.thumbnailUrl
                : `${import.meta.env.VITE_API_URL || ''}${item.product.thumbnailUrl}`
              : null;

            return (
              <motion.div
                key={item.product.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                className="bg-bg-card rounded-2xl p-3 border border-white/5 flex gap-3"
              >
                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-bg-hover">
                  {thumb ? (
                    <img src={thumb} alt={item.product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{item.product.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-yellow-400 text-xs">⭐</span>
                    <span className="text-white text-xs font-bold">{item.product.priceStars * item.quantity}</span>
                    {item.product.priceUsdt && parseFloat(item.product.priceUsdt) > 0 && (
                      <span className="text-gray-500 text-[10px]">
                        · ${(parseFloat(item.product.priceUsdt) * item.quantity).toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => { updateQuantity(item.product.id, item.quantity - 1); haptic.light(); }}
                      className="w-7 h-7 rounded-lg bg-bg-hover text-white flex items-center justify-center text-sm font-bold"
                    >
                      −
                    </button>
                    <span className="text-white text-sm font-semibold w-5 text-center">{item.quantity}</span>
                    <button
                      onClick={() => { updateQuantity(item.product.id, item.quantity + 1); haptic.light(); }}
                      className="w-7 h-7 rounded-lg bg-bg-hover text-white flex items-center justify-center text-sm font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Remove */}
                <button
                  onClick={() => { removeItem(item.product.id); haptic.light(); }}
                  className="text-gray-600 hover:text-red-400 transition-colors self-start p-1"
                >
                  ✕
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Summary */}
      <div className="bg-bg-card rounded-2xl p-4 border border-white/5 space-y-3">
        <h3 className="text-sm font-semibold text-white">Order Summary</h3>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Items</span>
          <span className="text-white">{items.reduce((s, i) => s + i.quantity, 0)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Total Stars</span>
          <div className="flex items-center gap-1">
            <span className="text-yellow-400">⭐</span>
            <span className="text-white font-bold">{totalStars()}</span>
          </div>
        </div>
        {totalUsdt() > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Total USDT</span>
            <span className="text-green-400 font-bold">${totalUsdt().toFixed(2)}</span>
          </div>
        )}
        <div className="pt-1 border-t border-white/5" />
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => { navigate('/checkout'); haptic.heavy(); }}
          className="w-full py-3.5 rounded-2xl bg-gradient-brand text-white font-bold text-sm"
        >
          Proceed to Checkout →
        </motion.button>
      </div>
    </div>
  );
}
