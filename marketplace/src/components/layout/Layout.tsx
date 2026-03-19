import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/lib/cart';
import { useAuthStore } from '@/lib/auth';
import SearchBar from '@/components/ui/SearchBar';

const navItems = [
  { path: '/', icon: HomeIcon, label: 'Home' },
  { path: '/cart', icon: CartIcon, label: 'Cart', badge: true },
  { path: '/orders', icon: OrdersIcon, label: 'Orders' },
];

export default function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const totalItems = useCartStore((s) => s.totalItems());
  const isAdmin = useAuthStore((s) => s.isAdmin());
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-dvh bg-bg-primary">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/5">
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/">
            <span className="gradient-text font-bold text-lg tracking-tight no-select cursor-pointer">
              𝟩𝗌𝗇𝖺𝗐𝗂 𝖲𝗍𝗈𝗋𝖾
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen((v) => !v)}
              className="w-8 h-8 rounded-xl bg-bg-hover flex items-center justify-center text-gray-400 hover:text-white transition-colors text-sm"
            >
              {searchOpen ? '✕' : '🔍'}
            </button>
            {isAdmin && (
              <Link href="/admin">
                <button className="text-xs px-3 py-1.5 rounded-full bg-brand-purple/20 text-brand-purple border border-brand-purple/30 font-medium">
                  Admin
                </button>
              </Link>
            )}
          </div>
        </div>

        {/* Inline search bar */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-3">
                <SearchBar onClose={() => setSearchOpen(false)} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-24">
        <motion.div
          key={location}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/5 safe-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map(({ path, icon: Icon, label, badge }) => {
            const isActive = location === path || (path !== '/' && location.startsWith(path));
            return (
              <Link key={path} href={path}>
                <button className="flex flex-col items-center gap-1 px-4 py-2 relative no-select">
                  <div className={`relative transition-colors ${isActive ? 'text-brand-blue' : 'text-gray-500'}`}>
                    <Icon size={22} />
                    {badge && totalItems > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1.5 -right-1.5 bg-brand-pink text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center"
                      >
                        {totalItems > 9 ? '9+' : totalItems}
                      </motion.span>
                    )}
                  </div>
                  <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-brand-blue' : 'text-gray-600'}`}>
                    {label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-brand-blue"
                    />
                  )}
                </button>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function HomeIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function CartIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

function OrdersIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}
