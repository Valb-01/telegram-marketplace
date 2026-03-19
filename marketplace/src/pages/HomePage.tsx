import { useState } from 'react';
import { motion } from 'framer-motion';
import { useProducts, useFeaturedProducts } from '@/hooks/useProducts';
import ProductCard from '@/components/product/ProductCard';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';
import CategoryFilter from '@/components/ui/CategoryFilter';
import { useTelegram } from '@/hooks/useTelegram';
import { useAuthStore } from '@/lib/auth';

type SortOption = 'newest' | 'price_asc' | 'price_desc';

export default function HomePage() {
  const { user: tgUser } = useTelegram();
  const authUser = useAuthStore((s) => s.user);
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [sort, setSort] = useState<SortOption>('newest');

  const { data: featured, isLoading: loadingFeatured } = useFeaturedProducts();

  const { data: products, isLoading: loadingProducts } = useProducts({
    category,
    sort,
    limit: 20,
  });

  const displayName =
    authUser?.firstName || tgUser?.first_name || 'Explorer';

  return (
    <div className="px-4 py-4 space-y-8">
      {/* Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl overflow-hidden p-6 border border-white/8"
        style={{
          background: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(139,92,246,0.12) 50%, rgba(236,72,153,0.08) 100%)',
        }}
      >
        {/* Decorative orbs */}
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-brand-purple/10 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-brand-blue/10 blur-xl pointer-events-none" />

        <div className="relative">
          <p className="text-gray-400 text-sm mb-1">Welcome back,</p>
          <h1 className="text-2xl font-bold text-white mb-1">
            {displayName} 👋
          </h1>
          <p className="text-gray-400 text-sm mb-4">
            Discover premium digital products
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-black/30 rounded-full px-3 py-1.5 border border-white/5">
              <span className="text-yellow-400 text-sm">⭐</span>
              <span className="text-white text-xs font-medium">Telegram Stars</span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/30 rounded-full px-3 py-1.5 border border-white/5">
              <span className="text-green-400 text-sm">💎</span>
              <span className="text-white text-xs font-medium">USDT TRC20</span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/30 rounded-full px-3 py-1.5 border border-white/5">
              <span className="text-brand-blue text-sm">⚡</span>
              <span className="text-white text-xs font-medium">Instant Delivery</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Featured Products */}
      {(loadingFeatured || (featured && featured.length > 0)) && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="gradient-text">Featured</span>
              <span>⭐</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {loadingFeatured
              ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
              : featured?.slice(0, 4).map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
          </div>
        </section>
      )}

      {/* Browse All */}
      <section>
        {/* Section header */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-white">Browse All</h2>
          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="bg-bg-card border border-white/10 rounded-xl px-2 py-1.5 text-gray-300 text-xs focus:outline-none focus:border-brand-blue/40 cursor-pointer"
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price ↑</option>
            <option value="price_desc">Price ↓</option>
          </select>
        </div>

        {/* Category Filter */}
        <div className="mb-4">
          <CategoryFilter selected={category} onChange={setCategory} />
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 gap-3">
          {loadingProducts
            ? Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : products?.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
        </div>

        {!loadingProducts && products?.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">🌊</div>
            <p className="text-gray-400 text-sm">
              {category ? 'No products in this category yet.' : 'No products available yet.'}
            </p>
            {category && (
              <button
                onClick={() => setCategory(undefined)}
                className="mt-3 text-brand-blue text-xs"
              >
                View all products
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
