import { useQuery } from '@tanstack/react-query';
import { productsApi, type ProductWithCategory } from '@/lib/api';

interface UseProductsOptions {
  category?: string;
  featured?: boolean;
  search?: string;
  sort?: 'newest' | 'price_asc' | 'price_desc';
  limit?: number;
  offset?: number;
  enabled?: boolean;
}

export function useProducts(opts: UseProductsOptions = {}) {
  const { enabled = true, ...params } = opts;

  return useQuery({
    queryKey: ['products', params],
    queryFn: () =>
      productsApi
        .list({
          category: params.category,
          featured: params.featured,
          search: params.search,
          sort: params.sort,
          limit: params.limit ?? 20,
          offset: params.offset ?? 0,
        })
        .then((r) => r.data),
    enabled,
    staleTime: 1000 * 60 * 2,
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: () => productsApi.get(slug).then((r) => r.data),
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
  });
}

export function useFeaturedProducts() {
  return useProducts({ featured: true, limit: 6 });
}
