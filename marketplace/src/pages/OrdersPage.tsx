import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { ordersApi, type Order } from '@/lib/api';
import { useAuthStore } from '@/lib/auth';

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending:  { label: 'Pending',  color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  paid:     { label: 'Paid',     color: 'text-green-400',  bg: 'bg-green-400/10'  },
  failed:   { label: 'Failed',   color: 'text-red-400',    bg: 'bg-red-400/10'    },
  refunded: { label: 'Refunded', color: 'text-gray-400',   bg: 'bg-gray-400/10'   },
};

export default function OrdersPage() {
  const [, navigate] = useLocation();
  const user = useAuthStore((s) => s.user);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => ordersApi.myOrders().then((r) => r.data),
    enabled: !!user,
    refetchInterval: 15000,
  });

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <div className="text-5xl mb-4">🔐</div>
        <h2 className="text-xl font-bold text-white mb-2">Sign in required</h2>
        <p className="text-gray-400 text-sm">Open this app via Telegram to view your orders</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="px-4 py-4 space-y-3">
        <div className="h-7 skeleton rounded w-32" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 skeleton rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-xl font-bold text-white mb-2">No orders yet</h2>
          <p className="text-gray-400 text-sm mb-6">Your purchases will appear here</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 rounded-2xl bg-gradient-brand text-white font-semibold text-sm"
          >
            Shop Now
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-4">
      <h1 className="text-xl font-bold text-white">My Orders</h1>

      <div className="space-y-3">
        {orders.map((order: Order, i: number) => {
          const status = statusConfig[order.status] ?? statusConfig.pending;

          return (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-bg-card rounded-2xl p-4 border border-white/5"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-white font-semibold text-sm">Order #{order.id}</p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${status.color} ${status.bg}`}>
                  {status.label}
                </span>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <span className="text-gray-400 text-xs">Method:</span>
                  <span className="text-white text-xs font-medium">
                    {order.paymentMethod === 'stars' ? '⭐ Stars' : '💎 USDT'}
                  </span>
                </div>
                {order.totalStars && (
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-400 text-xs">⭐</span>
                    <span className="text-white text-xs font-bold">{order.totalStars}</span>
                  </div>
                )}
                {order.totalUsdt && (
                  <div className="flex items-center gap-1">
                    <span className="text-green-400 text-xs font-bold">${order.totalUsdt}</span>
                  </div>
                )}
              </div>

              {order.status === 'paid' && (
                <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2">
                  <span className="text-xs text-green-400">
                    {order.fileDelivered ? '✅ Files delivered to Telegram' : '⏳ Preparing delivery...'}
                  </span>
                </div>
              )}

              {order.status === 'pending' && order.paymentMethod === 'usdt_trc20' && (
                <div className="mt-3 pt-3 border-t border-white/5">
                  <p className="text-xs text-yellow-400">⏳ Waiting for USDT payment...</p>
                </div>
              )}

              {order.txHash && (
                <div className="mt-2">
                  <p className="text-[10px] text-gray-600 font-mono truncate">TX: {order.txHash}</p>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
