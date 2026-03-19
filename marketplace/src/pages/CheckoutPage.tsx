import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useCartStore } from '@/lib/cart';
import { useAuthStore } from '@/lib/auth';
import { useTelegram } from '@/hooks/useTelegram';
import { ordersApi, paymentsApi, type UsdtPaymentInfo } from '@/lib/api';

type PaymentMethod = 'stars' | 'usdt_trc20';
type CheckoutStep = 'method' | 'confirm' | 'usdt_waiting' | 'success';

export default function CheckoutPage() {
  const [, navigate] = useLocation();
  const { items, totalStars, totalUsdt, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const { tg, haptic } = useTelegram();

  const [method, setMethod] = useState<PaymentMethod>('stars');
  const [step, setStep] = useState<CheckoutStep>('method');
  const [orderId, setOrderId] = useState<number | null>(null);
  const [usdtInfo, setUsdtInfo] = useState<UsdtPaymentInfo | null>(null);
  const [countdown, setCountdown] = useState(1800); // 30 min

  // Countdown for USDT
  useEffect(() => {
    if (step !== 'usdt_waiting') return;
    const t = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(t); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [step]);

  // Poll payment status for USDT
  const { data: paymentStatus } = useQuery({
    queryKey: ['payment-status', orderId],
    queryFn: () => paymentsApi.checkStatus(orderId!).then((r) => r.data),
    enabled: !!orderId && step === 'usdt_waiting',
    refetchInterval: 10000,
  });

  useEffect(() => {
    if (paymentStatus?.status === 'paid') {
      setStep('success');
      clearCart();
      haptic.success();
    }
  }, [paymentStatus, clearCart, haptic]);

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      if (!tg || !user) throw new Error('Not authenticated');

      const telegramChatId = parseInt(user.telegramId, 10);
      const res = await ordersApi.create({
        items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        paymentMethod: method,
        telegramChatId,
      });
      return res.data;
    },
    onSuccess: async (data) => {
      setOrderId(data.orderId);

      if (method === 'stars') {
        // Invoice sent to Telegram — show success message
        haptic.success();
        tg?.showAlert(
          'Invoice sent! Please complete payment in your Telegram chat.',
          () => {
            clearCart();
            setStep('success');
          }
        );
      } else {
        // Create USDT payment
        const usdtRes = await paymentsApi.createUsdt(data.orderId);
        setUsdtInfo(usdtRes.data);
        setStep('usdt_waiting');
        haptic.medium();
      }
    },
    onError: (err) => {
      haptic.error();
      console.error(err);
    },
  });

  if (items.length === 0 && step !== 'success') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <div className="text-5xl mb-4">🛒</div>
        <p className="text-gray-400">Your cart is empty</p>
        <button onClick={() => navigate('/')} className="mt-4 text-brand-blue text-sm">Browse products</button>
      </div>
    );
  }

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="px-4 py-4 space-y-4">
      <button onClick={() => history.back()} className="text-gray-400 text-sm flex items-center gap-2">
        ← Back
      </button>
      <h1 className="text-xl font-bold text-white">Checkout</h1>

      <AnimatePresence mode="wait">

        {/* ── Step: Choose Method ── */}
        {step === 'method' && (
          <motion.div key="method" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">

            {/* Order Summary */}
            <div className="bg-bg-card rounded-2xl p-4 border border-white/5 space-y-2">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Order Summary</p>
              {items.map((item) => (
                <div key={item.product.id} className="flex justify-between text-sm">
                  <span className="text-gray-300 truncate flex-1 mr-2">{item.product.name} × {item.quantity}</span>
                  <span className="text-white font-medium flex-shrink-0">⭐ {item.product.priceStars * item.quantity}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-white/5 flex justify-between font-bold">
                <span className="text-white">Total</span>
                <div className="flex items-center gap-1">
                  <span className="text-yellow-400">⭐</span>
                  <span className="text-white">{totalStars()}</span>
                  {totalUsdt() > 0 && <span className="text-gray-400 text-xs ml-1">/ ${totalUsdt().toFixed(2)}</span>}
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="space-y-2">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Payment Method</p>

              {/* Stars */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => { setMethod('stars'); haptic.light(); }}
                className={`w-full p-4 rounded-2xl border transition-all text-left ${
                  method === 'stars'
                    ? 'border-brand-blue/60 bg-brand-blue/10'
                    : 'border-white/8 bg-bg-card'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-yellow-400/20 flex items-center justify-center text-xl">⭐</div>
                  <div className="flex-1">
                    <p className="text-white font-semibold text-sm">Telegram Stars</p>
                    <p className="text-gray-400 text-xs">Instant · Native Telegram payment</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-400 font-bold">{totalStars()}</span>
                    <span className="text-yellow-400 text-xs">⭐</span>
                  </div>
                  {method === 'stars' && <div className="w-4 h-4 rounded-full bg-brand-blue flex items-center justify-center text-[10px] text-white">✓</div>}
                </div>
              </motion.button>

              {/* USDT */}
              {totalUsdt() > 0 && (
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setMethod('usdt_trc20'); haptic.light(); }}
                  className={`w-full p-4 rounded-2xl border transition-all text-left ${
                    method === 'usdt_trc20'
                      ? 'border-green-500/60 bg-green-500/10'
                      : 'border-white/8 bg-bg-card'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center text-xl">💎</div>
                    <div className="flex-1">
                      <p className="text-white font-semibold text-sm">USDT TRC20</p>
                      <p className="text-gray-400 text-xs">Tron Network · 30 min window</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-green-400 font-bold">${totalUsdt().toFixed(2)}</span>
                    </div>
                    {method === 'usdt_trc20' && <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-[10px] text-white">✓</div>}
                  </div>
                </motion.button>
              )}
            </div>

            {/* Security notice */}
            <div className="flex items-start gap-2 p-3 rounded-xl bg-bg-card border border-white/5">
              <span className="text-sm mt-0.5">🔒</span>
              <p className="text-xs text-gray-400">All payments are processed securely. Digital files are delivered instantly after payment confirmation.</p>
            </div>

            {/* Confirm */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => createOrderMutation.mutate()}
              disabled={createOrderMutation.isPending}
              className="w-full py-4 rounded-2xl bg-gradient-brand text-white font-bold text-base disabled:opacity-60"
            >
              {createOrderMutation.isPending ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </div>
              ) : (
                method === 'stars' ? `Pay ⭐ ${totalStars()} Stars` : `Pay $${totalUsdt().toFixed(2)} USDT`
              )}
            </motion.button>

            {createOrderMutation.isError && (
              <p className="text-red-400 text-xs text-center">
                Failed to create order. Please try again.
              </p>
            )}
          </motion.div>
        )}

        {/* ── Step: USDT Waiting ── */}
        {step === 'usdt_waiting' && usdtInfo && (
          <motion.div key="usdt" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="bg-bg-card rounded-2xl p-5 border border-green-500/20 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold">Send USDT TRC20</h3>
                <span className={`text-sm font-mono font-bold ${countdown < 300 ? 'text-red-400' : 'text-green-400'}`}>
                  {formatTime(countdown)}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Network</p>
                  <p className="text-sm text-white font-semibold">TRON (TRC20)</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Wallet Address</p>
                  <div className="bg-bg-primary rounded-xl p-3 flex items-center gap-2">
                    <p className="text-sm text-white font-mono break-all flex-1">{usdtInfo.walletAddress}</p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(usdtInfo.walletAddress);
                        haptic.light();
                      }}
                      className="text-brand-blue text-xs flex-shrink-0"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Exact Amount (USDT)</p>
                  <div className="bg-bg-primary rounded-xl p-3 flex items-center gap-2">
                    <p className="text-xl text-green-400 font-bold font-mono flex-1">{usdtInfo.expectedAmount}</p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(usdtInfo.expectedAmount);
                        haptic.light();
                      }}
                      className="text-brand-blue text-xs flex-shrink-0"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-[10px] text-yellow-400/80 mt-1">⚠️ Send the exact amount shown above</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-bg-card rounded-2xl border border-white/5">
              <div className="w-5 h-5 border-2 border-brand-blue border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <div>
                <p className="text-white text-sm font-semibold">Waiting for payment...</p>
                <p className="text-gray-400 text-xs">We'll detect your transaction automatically</p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-gray-500">
              <p>• Send <strong className="text-white">only USDT on TRC20 network</strong></p>
              <p>• Files will be delivered to your Telegram after confirmation</p>
              <p>• Contact @xri3bot if you have issues</p>
            </div>
          </motion.div>
        )}

        {/* ── Step: Success ── */}
        {step === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center py-12 space-y-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
              className="w-24 h-24 rounded-full bg-gradient-brand flex items-center justify-center text-5xl"
            >
              ✅
            </motion.div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Payment Successful!</h2>
              <p className="text-gray-400 text-sm">
                {method === 'stars'
                  ? 'Your invoice was sent to Telegram. Complete payment there to receive your files.'
                  : 'Payment confirmed! Check your Telegram for the delivered files.'}
              </p>
            </div>
            <div className="w-full space-y-2 pt-4">
              <button
                onClick={() => navigate('/orders')}
                className="w-full py-3.5 rounded-2xl border border-white/10 text-white font-semibold text-sm"
              >
                View Orders
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full py-3.5 rounded-2xl bg-gradient-brand text-white font-semibold text-sm"
              >
                Continue Shopping
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
