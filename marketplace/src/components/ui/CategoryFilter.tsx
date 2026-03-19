import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { categoriesApi, type Category } from '@/lib/api';
import { useTelegram } from '@/hooks/useTelegram';

interface CategoryFilterProps {
  selected?: string;
  onChange: (slug: string | undefined) => void;
}

export default function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
  const { haptic } = useTelegram();

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list().then((r) => r.data),
    staleTime: 1000 * 60 * 10,
  });

  const handleSelect = (slug: string | undefined) => {
    haptic.light();
    onChange(slug);
  };

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
      {/* All */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => handleSelect(undefined)}
        className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
          !selected
            ? 'bg-gradient-brand text-white shadow-lg shadow-brand-blue/20'
            : 'bg-bg-card border border-white/8 text-gray-400 hover:border-brand-blue/30'
        }`}
      >
        All
      </motion.button>

      {categories?.map((cat: Category) => (
        <motion.button
          key={cat.id}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleSelect(cat.slug)}
          className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
            selected === cat.slug
              ? 'bg-gradient-brand text-white shadow-lg shadow-brand-blue/20'
              : 'bg-bg-card border border-white/8 text-gray-400 hover:border-brand-blue/30'
          }`}
        >
          {cat.icon && <span>{cat.icon}</span>}
          {cat.name}
        </motion.button>
      ))}
    </div>
  );
}
