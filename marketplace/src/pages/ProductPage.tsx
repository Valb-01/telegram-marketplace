import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useParams, useLocation } from 'wouter';
import { productsApi } from '@/lib/api';
import { useCartStore } from '@/lib/cart';
import { useTelegram } from '@/hooks/useTelegram';

export default function ProductPage() {
  const params = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const addItem = useCartStore((s) => s.addItem);
  const items = useCartStore((s) => s.items);
  const { haptic, tg } = useTelegram();

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', params.slug],
    queryFn: () => productsApi.get(params.slug).then((r) => r.data),
    enabled: !!params.slug,
  });

  const inCart = items.some((i) => i.product.id === product?.id);

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product);
    haptic.success();
  };

  const handleBuyNow = () => {
    if (!product) return;
    if (!inCart) addItem(product);
    haptic.heavy();
    navigate('/checkout');
  };

  if (isLoading) {
    return (
      <div className="px-4 py-6 space-y-4 animate-pulse">
        <div className="aspect-video skeleton rounded-2xl" />
        <div className="h-6 skeleton rounded w-3/4" />
        <div className="h-4 skeleton rounded w-full" />
        <div className="h-4 skeleton rounded w-2/3" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <div className="text-5xl mb-4">😕</div>
        <h2 className="text-xl font-bold text-white mb-2">Product not found</h2>
        <button onClick={() => navigate('/')} className="text-brand-blue text-sm mt-4">
          ← Back to store
        </button>
      </div>
    );
  }

  const thumbnailUrl = product.thumbnailUrl
    ? product.thumbnailUrl.startsWith('http')
      ? product.thumbnailUrl
      : `${import.meta.env.VITE_API_URL || ''}${product.thumbnailUrl}`
    : null;

  return (
    <div className="pb-6">
      {/* Back button */}
      <button
        onClick={() => history.back()}
        className="flex items-center gap-2 text-gray-400 text-sm px-4 py-3 hover:text-white transition-colors"
      >
        ← Back
      </button>

      {/* Thumbnail */}
      <div className="mx-4 rounded-2xl overflow-hidden aspect-video bg-bg-hover mb-4">
        {thumbnailUrl ? (
          <motion.img
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            src={thumbnailUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-blue/10 via-brand-purple/10 to-brand-pink/10">
            <span className="text-7xl">📦</span>
          </div>
        )}
      </div>

      <div className="px-4 space-y-4">
        {/* Title & Category */}
        <div>
          {product.category && (
            <span className="text-xs text-brand-purple font-medium">{product.category.name}</span>
          )}
          <h1 className="text-xl font-bold text-white mt-1">{product.name}</h1>
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {product.tags.map((tag) => (
                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-bg-hover text-gray-400 border border-white/5">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Pricing */}
        <div className="bg-bg-card rounded-2xl p-4 border border-white/5">
          <p className="text-xs text-gray-500 mb-2">Price</p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⭐</span>
              <div>
                <span className="text-2xl font-bold text-white">{product.priceStars}</span>
                <span className="text-gray-400 text-sm ml-1">Stars</span>
              </div>
            </div>
            {product.priceUsdt && parseFloat(product.priceUsdt) > 0 && (
              <>
                <div className="w-px h-8 bg-white/10" />
                <div>
                  <span className="text-xl font-bold text-green-400">${product.priceUsdt}</span>
                  <span className="text-gray-400 text-sm ml-1">USDT</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Description */}
        {product.description && (
          <div className="bg-bg-card rounded-2xl p-4 border border-white/5">
            <p className="text-xs text-gray-500 mb-2">Description</p>
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
              {product.description}
            </p>
          </div>
        )}

        {/* File info */}
        {product.fileName && (
          <div className="bg-bg-card rounded-2xl p-4 border border-white/5">
            <p className="text-xs text-gray-500 mb-2">File Details</p>
            <div className="flex items-center gap-3">
              <span className="text-2xl">📁</span>
              <div>
                <p className="text-sm text-white font-medium">{product.fileName}</p>
                {product.fileSize && (
                  <p className="text-xs text-gray-500">
                    {(product.fileSize / 1024 / 1024).toFixed(2)} MB
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>↓ {product.downloadCount} downloads</span>
          <span>•</span>
          <span>Instant delivery</span>
          <span>•</span>
          <span>Secure payment</span>
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-3 pt-2">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleAddToCart}
            className={`flex-1 py-3.5 rounded-2xl font-semibold text-sm border transition-all ${
              inCart
                ? 'border-green-500/40 bg-green-500/10 text-green-400'
                : 'border-white/10 bg-bg-card text-white hover:border-brand-blue/40'
            }`}
          >
            {inCart ? '✓ In Cart' : '+ Add to Cart'}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleBuyNow}
            className="flex-1 py-3.5 rounded-2xl font-semibold text-sm bg-gradient-brand text-white"
          >
            Buy Now ⭐
          </motion.button>
        </div>
      </div>
    </div>
  );
}
