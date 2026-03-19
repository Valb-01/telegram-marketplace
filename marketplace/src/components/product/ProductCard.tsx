import { motion } from 'framer-motion';
import { Link } from 'wouter';
import type { ProductWithCategory } from '@/lib/api';
import { useCartStore } from '@/lib/cart';
import { useTelegram } from '@/hooks/useTelegram';

interface ProductCardProps {
  product: ProductWithCategory;
  index?: number;
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const items = useCartStore((s) => s.items);
  const { haptic } = useTelegram();

  const inCart = items.some((i) => i.product.id === product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    haptic.medium();
  };

  const thumbnailUrl = product.thumbnailUrl
    ? product.thumbnailUrl.startsWith('http')
      ? product.thumbnailUrl
      : `${import.meta.env.VITE_API_URL || ''}${product.thumbnailUrl}`
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileTap={{ scale: 0.97 }}
    >
      <Link href={`/product/${product.slug}`}>
        <div className="bg-bg-card rounded-2xl overflow-hidden border border-white/5 hover:border-white/10 transition-all cursor-pointer group">
          {/* Thumbnail */}
          <div className="relative aspect-video bg-bg-hover overflow-hidden">
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-blue/10 via-brand-purple/10 to-brand-pink/10">
                <span className="text-4xl">📦</span>
              </div>
            )}
            {product.isFeatured && (
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-gradient-brand text-white text-[10px] font-bold uppercase tracking-wide">
                Featured
              </div>
            )}
            {product.category && (
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur text-gray-300 text-[10px]">
                {product.category.name}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-3">
            <h3 className="text-sm font-semibold text-white truncate mb-0.5">{product.name}</h3>
            {product.shortDescription && (
              <p className="text-xs text-gray-500 line-clamp-2 mb-3">{product.shortDescription}</p>
            )}

            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="text-yellow-400 text-xs">⭐</span>
                  <span className="text-white font-bold text-sm">{product.priceStars}</span>
                </div>
                {product.priceUsdt && parseFloat(product.priceUsdt) > 0 && (
                  <span className="text-gray-500 text-[10px]">${product.priceUsdt} USDT</span>
                )}
              </div>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleAddToCart}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  inCart
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-gradient-brand text-white'
                }`}
              >
                {inCart ? (
                  <>✓ Added</>
                ) : (
                  <>
                    <span>+</span> Cart
                  </>
                )}
              </motion.button>
            </div>

            {/* Downloads */}
            <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-1 text-[10px] text-gray-600">
              <span>↓</span>
              <span>{product.downloadCount} downloads</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
