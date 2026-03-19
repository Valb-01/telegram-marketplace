import { useEffect } from 'react';
import { Route, Switch } from 'wouter';
import { useTelegram } from '@/hooks/useTelegram';
import { useAuthStore } from '@/lib/auth';
import Layout from '@/components/layout/Layout';
import { ToastContainer } from '@/components/ui/Toast';
import HomePage from '@/pages/HomePage';
import ProductPage from '@/pages/ProductPage';
import CartPage from '@/pages/CartPage';
import CheckoutPage from '@/pages/CheckoutPage';
import OrdersPage from '@/pages/OrdersPage';
import AdminPage from '@/pages/AdminPage';

export default function App() {
  const { initData, user: tgUser } = useTelegram();
  const login = useAuthStore((s) => s.login);
  const authUser = useAuthStore((s) => s.user);

  // Auto-login via Telegram WebApp data
  useEffect(() => {
    if (initData && !authUser) {
      login(initData).catch(console.error);
    }
  }, [initData, authUser, login]);

  return (
    <Layout>
      <ToastContainer />
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/product/:slug" component={ProductPage} />
        <Route path="/cart" component={CartPage} />
        <Route path="/checkout" component={CheckoutPage} />
        <Route path="/orders" component={OrdersPage} />
        <Route path="/admin" component={AdminPage} />
        <Route>
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <div className="text-6xl mb-4">🌊</div>
            <h1 className="text-2xl font-bold gradient-text mb-2">Page not found</h1>
            <p className="text-gray-400">The page you're looking for doesn't exist.</p>
          </div>
        </Route>
      </Switch>
    </Layout>
  );
}
