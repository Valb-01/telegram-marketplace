import { type ProductWithCategory } from '@/lib/api';
import ProductCard from './ProductCard';
import { ProductCardSkeleton } from '@/components/ui/Skeleton';

interface ProductGridProps {
  products?: ProductWithCategory[];
  isLoading?: boolean;
  skeletonCount?: number;
  emptyMessage?: string;
  columns?: 1 | 2;
}

export default function ProductGrid({
  products,
  isLoading = false,
  skeletonCount = 6,
  emptyMessage = 'No products found.',
  columns = 2,
}: ProductGridProps) {
  const gridClass = columns === 1 ? 'grid-cols-1' : 'grid-cols-2';

  if (isLoading) {
    return (
      <div className={`grid ${gridClass} gap-3`}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-3">🌊</div>
        <p className="text-gray-400 text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`grid ${gridClass} gap-3`}>
      {products.map((product, i) => (
        <ProductCard key={product.id} product={product} index={i} />
      ))}
    </div>
  );
}
