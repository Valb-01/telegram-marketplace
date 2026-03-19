interface PriceProps {
  stars: number;
  usdt?: string | null;
  size?: 'sm' | 'md' | 'lg';
  showBoth?: boolean;
}

const textSizes = {
  sm: { stars: 'text-sm', usdt: 'text-[10px]', icon: 'text-xs' },
  md: { stars: 'text-base', usdt: 'text-xs', icon: 'text-sm' },
  lg: { stars: 'text-2xl', usdt: 'text-sm', icon: 'text-lg' },
};

export default function Price({ stars, usdt, size = 'md', showBoth = true }: PriceProps) {
  const s = textSizes[size];
  const hasUsdt = usdt && parseFloat(usdt) > 0;

  return (
    <div className="flex items-baseline gap-3">
      {/* Stars */}
      <div className="flex items-center gap-1">
        <span className={s.icon}>⭐</span>
        <span className={`font-bold text-white ${s.stars}`}>{stars}</span>
        <span className={`text-gray-400 ${s.usdt}`}>Stars</span>
      </div>

      {/* USDT */}
      {showBoth && hasUsdt && (
        <>
          <span className="text-gray-600 text-xs">or</span>
          <div className="flex items-center gap-1">
            <span className={`font-bold text-green-400 ${s.stars}`}>${usdt}</span>
            <span className={`text-gray-400 ${s.usdt}`}>USDT</span>
          </div>
        </>
      )}
    </div>
  );
}
