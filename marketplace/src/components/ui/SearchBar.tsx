import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { useProducts } from '@/hooks/useProducts';
import { useTelegram } from '@/hooks/useTelegram';

interface SearchBarProps {
  onClose?: () => void;
}

export default function SearchBar({ onClose }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [, navigate] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const { haptic } = useTelegram();

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const { data: results, isLoading } = useProducts({
    search: debouncedQuery,
    limit: 6,
    enabled: debouncedQuery.length >= 2,
  });

  const handleSelect = (slug: string) => {
    haptic.light();
    navigate(`/product/${slug}`);
    onClose?.();
  };

  return (
    <div className="w-full">
      {/* Input */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products..."
          className="w-full bg-bg-card border border-white/10 rounded-2xl pl-9 pr-10 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-brand-blue/40 transition-colors"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
          >
            ✕
          </button>
        )}
      </div>

      {/* Results */}
      <AnimatePresence>
        {debouncedQuery.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-2 bg-bg-card rounded-2xl border border-white/8 overflow-hidden"
          >
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3 items-center">
                    <div className="w-10 h-10 skeleton rounded-xl flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 skeleton rounded w-3/4" />
                      <div className="h-3 skeleton rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : results && results.length > 0 ? (
              <div>
                {results.map((product, i) => {
                  const thumb = product.thumbnailUrl
                    ? product.thumbnailUrl.startsWith('http')
                      ? product.thumbnailUrl
                      : `${import.meta.env.VITE_API_URL || ''}${product.thumbnailUrl}`
                    : null;

                  return (
                    <motion.button
                      key={product.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                      onClick={() => handleSelect(product.slug)}
                      className="w-full flex gap-3 items-center p-3 hover:bg-bg-hover transition-colors border-b border-white/5 last:border-0"
                    >
                      <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-bg-hover">
                        {thumb ? (
                          <img src={thumb} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg">📦</div>
                        )}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-white text-sm font-medium truncate">{product.name}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-yellow-400 text-xs">⭐</span>
                          <span className="text-white text-xs font-bold">{product.priceStars}</span>
                          {product.category && (
                            <span className="text-gray-500 text-xs">· {product.category.name}</span>
                          )}
                        </div>
                      </div>
                      <span className="text-gray-600 text-xs flex-shrink-0">→</span>
                    </motion.button>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center">
                <p className="text-gray-500 text-sm">No products found for "{debouncedQuery}"</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
