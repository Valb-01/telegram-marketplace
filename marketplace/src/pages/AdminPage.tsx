import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { adminApi, productsApi, categoriesApi, type Product, type Category } from '@/lib/api';
import { useAuthStore } from '@/lib/auth';

type AdminTab = 'analytics' | 'products' | 'categories' | 'orders';

export default function AdminPage() {
  const [, navigate] = useLocation();
  const isAdmin = useAuthStore((s) => s.isAdmin());
  const [tab, setTab] = useState<AdminTab>('analytics');

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <div className="text-5xl mb-4">🚫</div>
        <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-gray-400 text-sm">This area is for admins only.</p>
        <button onClick={() => navigate('/')} className="mt-4 text-brand-blue text-sm">← Back to Store</button>
      </div>
    );
  }

  const tabs: { id: AdminTab; label: string; icon: string }[] = [
    { id: 'analytics', label: 'Analytics', icon: '📊' },
    { id: 'products',  label: 'Products',  icon: '📦' },
    { id: 'categories',label: 'Categories',icon: '🏷️' },
    { id: 'orders',    label: 'Orders',    icon: '📋' },
  ];

  return (
    <div className="pb-6">
      {/* Admin Header */}
      <div className="px-4 py-4 border-b border-white/5">
        <h1 className="text-xl font-bold gradient-text">Admin Panel</h1>
        <p className="text-gray-500 text-xs mt-1">𝟩𝗌𝗇𝖺𝗐𝗂 𝖲𝗍𝗈𝗋𝖾 Management</p>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto px-4 py-3 gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              tab === t.id
                ? 'bg-gradient-brand text-white'
                : 'bg-bg-card border border-white/8 text-gray-400'
            }`}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      <div className="px-4">
        <AnimatePresence mode="wait">
          {tab === 'analytics' && <AnalyticsTab key="analytics" />}
          {tab === 'products'  && <ProductsTab  key="products"  />}
          {tab === 'categories'&& <CategoriesTab key="categories"/>}
          {tab === 'orders'    && <OrdersTab    key="orders"    />}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ────────────────────────── Analytics ────────────────────────── */

function AnalyticsTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => adminApi.analytics().then((r) => r.data),
    refetchInterval: 30000,
  });

  if (isLoading) return <div className="space-y-3 pt-2">{[...Array(4)].map((_, i) => <div key={i} className="h-20 skeleton rounded-2xl" />)}</div>;

  const stats = data?.stats;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pt-2">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Total Orders', value: stats?.totalOrders ?? 0, icon: '📋', color: 'from-blue-500/20 to-blue-600/5' },
          { label: 'Paid Orders',  value: stats?.paidOrders ?? 0,  icon: '✅', color: 'from-green-500/20 to-green-600/5' },
          { label: 'Total Users',  value: stats?.totalUsers ?? 0,  icon: '👥', color: 'from-purple-500/20 to-purple-600/5' },
          { label: 'Products',     value: stats?.totalProducts ?? 0,icon: '📦', color: 'from-pink-500/20 to-pink-600/5' },
        ].map((s) => (
          <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-2xl p-4 border border-white/5`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-2xl font-bold text-white">{s.value}</div>
            <div className="text-xs text-gray-400">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Revenue */}
      <div className="bg-bg-card rounded-2xl p-4 border border-white/5">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3">Revenue</p>
        <div className="flex gap-6">
          <div>
            <div className="flex items-center gap-1">
              <span className="text-yellow-400">⭐</span>
              <span className="text-xl font-bold text-white">{stats?.starRevenue ?? 0}</span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">Stars</p>
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-green-400 text-xl font-bold">${stats?.usdtRevenue ?? '0.00'}</span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">USDT</p>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      {data?.recentOrders && data.recentOrders.length > 0 && (
        <div className="bg-bg-card rounded-2xl p-4 border border-white/5">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3">Recent Orders</p>
          <div className="space-y-2">
            {data.recentOrders.slice(0, 5).map((o) => (
              <div key={o.id} className="flex items-center justify-between text-xs">
                <div>
                  <span className="text-white">#{o.id}</span>
                  <span className="text-gray-500 ml-2">{o.user?.username || o.user?.firstName || 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-2">
                  {o.totalStars && <span className="text-yellow-400">⭐ {o.totalStars}</span>}
                  {o.totalUsdt && <span className="text-green-400">${o.totalUsdt}</span>}
                  <span className={`px-2 py-0.5 rounded-full font-medium ${
                    o.status === 'paid' ? 'bg-green-400/10 text-green-400' :
                    o.status === 'pending' ? 'bg-yellow-400/10 text-yellow-400' :
                    'bg-red-400/10 text-red-400'
                  }`}>{o.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Products */}
      {data?.topProducts && data.topProducts.length > 0 && (
        <div className="bg-bg-card rounded-2xl p-4 border border-white/5">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3">Top Products</p>
          <div className="space-y-2">
            {data.topProducts.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 text-xs">
                <span className="text-gray-600 w-5 text-right">{i + 1}.</span>
                <span className="text-white flex-1 truncate">{p.name}</span>
                <span className="text-gray-400">↓ {p.downloadCount}</span>
                <span className="text-yellow-400">⭐ {p.priceStars}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

/* ────────────────────────── Products ────────────────────────── */

function ProductsTab() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => productsApi.list({ limit: 50 }).then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-products'] }),
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 pt-2">
      <div className="flex justify-end">
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="px-4 py-2 rounded-xl bg-gradient-brand text-white text-xs font-semibold"
        >
          + Add Product
        </button>
      </div>

      <AnimatePresence>
        {(showForm) && (
          <ProductForm
            product={editing}
            onClose={() => { setShowForm(false); setEditing(null); }}
            onSuccess={() => {
              setShowForm(false);
              setEditing(null);
              qc.invalidateQueries({ queryKey: ['admin-products'] });
            }}
          />
        )}
      </AnimatePresence>

      {isLoading && <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-16 skeleton rounded-xl" />)}</div>}

      <div className="space-y-2">
        {products?.map((product) => (
          <div key={product.id} className="bg-bg-card rounded-xl p-3 border border-white/5 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{product.name}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                <span>⭐ {product.priceStars}</span>
                {product.priceUsdt && <span>· ${product.priceUsdt}</span>}
                <span>· ↓ {product.downloadCount}</span>
                <span className={product.isActive ? 'text-green-400' : 'text-red-400'}>
                  · {product.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setEditing(product); setShowForm(true); }}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-bg-hover text-gray-300 hover:text-white"
              >
                Edit
              </button>
              <button
                onClick={() => { if (confirm('Delete this product?')) deleteMutation.mutate(product.id); }}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400"
              >
                Del
              </button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function ProductForm({ product, onClose, onSuccess }: { product: Product | null; onClose: () => void; onSuccess: () => void; }) {
  const [name, setName] = useState(product?.name || '');
  const [desc, setDesc] = useState(product?.description || '');
  const [shortDesc, setShortDesc] = useState(product?.shortDescription || '');
  const [priceStars, setPriceStars] = useState(product?.priceStars?.toString() || '');
  const [priceUsdt, setPriceUsdt] = useState(product?.priceUsdt || '');
  const [isFeatured, setIsFeatured] = useState(product?.isFeatured || false);
  const [isActive, setIsActive] = useState(product?.isActive ?? true);
  const [file, setFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('name', name);
      fd.append('description', desc);
      fd.append('shortDescription', shortDesc);
      fd.append('priceStars', priceStars);
      fd.append('priceUsdt', priceUsdt);
      fd.append('isFeatured', String(isFeatured));
      fd.append('isActive', String(isActive));
      if (file) fd.append('file', file);
      if (thumbnail) fd.append('thumbnail', thumbnail);
      return product ? productsApi.update(product.id, fd) : productsApi.create(fd);
    },
    onSuccess: () => onSuccess(),
    onError: () => setError('Failed to save product. Check all fields.'),
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="bg-bg-card rounded-2xl p-4 border border-brand-blue/20 space-y-3"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold text-sm">{product ? 'Edit Product' : 'New Product'}</h3>
        <button onClick={onClose} className="text-gray-500 text-lg leading-none">✕</button>
      </div>

      {[
        { label: 'Name *', value: name, onChange: setName, placeholder: 'Product name' },
        { label: 'Short Description', value: shortDesc, onChange: setShortDesc, placeholder: 'Brief summary' },
        { label: 'Stars Price *', value: priceStars, onChange: setPriceStars, placeholder: '100', type: 'number' },
        { label: 'USDT Price', value: priceUsdt, onChange: setPriceUsdt, placeholder: '1.99', type: 'number' },
      ].map((f) => (
        <div key={f.label}>
          <label className="text-xs text-gray-400 block mb-1">{f.label}</label>
          <input
            value={f.value}
            onChange={(e) => f.onChange(e.target.value)}
            placeholder={f.placeholder}
            type={f.type || 'text'}
            className="w-full bg-bg-primary border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-blue/50"
          />
        </div>
      ))}

      <div>
        <label className="text-xs text-gray-400 block mb-1">Description</label>
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Full product description..."
          rows={3}
          className="w-full bg-bg-primary border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-blue/50 resize-none"
        />
      </div>

      <div>
        <label className="text-xs text-gray-400 block mb-1">Digital File</label>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="w-full text-xs text-gray-400 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-bg-hover file:text-white"
        />
      </div>

      <div>
        <label className="text-xs text-gray-400 block mb-1">Thumbnail Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setThumbnail(e.target.files?.[0] || null)}
          className="w-full text-xs text-gray-400 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-bg-hover file:text-white"
        />
      </div>

      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="rounded" />
          <span className="text-xs text-gray-300">Featured</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded" />
          <span className="text-xs text-gray-300">Active</span>
        </label>
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending || !name || !priceStars}
        className="w-full py-3 rounded-xl bg-gradient-brand text-white font-semibold text-sm disabled:opacity-50"
      >
        {mutation.isPending ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
      </button>
    </motion.div>
  );
}

/* ────────────────────────── Categories ────────────────────────── */

function CategoriesTab() {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');
  const [desc, setDesc] = useState('');

  const { data: cats } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: () => categoriesApi.create({ name, icon, description: desc }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      setName(''); setIcon(''); setDesc('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => categoriesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pt-2">
      {/* Add Form */}
      <div className="bg-bg-card rounded-2xl p-4 border border-white/5 space-y-3">
        <h3 className="text-white font-semibold text-sm">New Category</h3>
        <div className="flex gap-2">
          <input
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="🎨"
            className="w-14 bg-bg-primary border border-white/10 rounded-xl px-3 py-2 text-white text-sm text-center focus:outline-none"
          />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Category name"
            className="flex-1 bg-bg-primary border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none"
          />
        </div>
        <input
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Description (optional)"
          className="w-full bg-bg-primary border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none"
        />
        <button
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending || !name}
          className="w-full py-2.5 rounded-xl bg-gradient-brand text-white font-semibold text-sm disabled:opacity-50"
        >
          {createMutation.isPending ? 'Creating...' : 'Create Category'}
        </button>
      </div>

      {/* List */}
      <div className="space-y-2">
        {cats?.map((cat: Category) => (
          <div key={cat.id} className="bg-bg-card rounded-xl p-3 border border-white/5 flex items-center gap-3">
            <span className="text-xl">{cat.icon || '📁'}</span>
            <div className="flex-1">
              <p className="text-white text-sm font-semibold">{cat.name}</p>
              {cat.description && <p className="text-gray-500 text-xs">{cat.description}</p>}
            </div>
            <button
              onClick={() => { if (confirm('Delete category?')) deleteMutation.mutate(cat.id); }}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400"
            >
              Del
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ────────────────────────── Orders ────────────────────────── */

function OrdersTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => adminApi.analytics().then((r) => r.data),
    refetchInterval: 20000,
  });

  if (isLoading) return <div className="space-y-2 pt-2">{[...Array(5)].map((_, i) => <div key={i} className="h-16 skeleton rounded-xl" />)}</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 pt-2">
      {data?.recentOrders.map((o) => (
        <div key={o.id} className="bg-bg-card rounded-xl p-3 border border-white/5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-white text-sm font-semibold">Order #{o.id}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              o.status === 'paid' ? 'bg-green-400/10 text-green-400' :
              o.status === 'pending' ? 'bg-yellow-400/10 text-yellow-400' :
              'bg-red-400/10 text-red-400'
            }`}>{o.status}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span>{o.user?.username ? `@${o.user.username}` : o.user?.firstName || 'Unknown'}</span>
            <span>·</span>
            <span>{o.paymentMethod === 'stars' ? `⭐ ${o.totalStars}` : `💎 $${o.totalUsdt}`}</span>
            <span>·</span>
            <span>{new Date(o.createdAt).toLocaleDateString()}</span>
          </div>
          {o.fileDelivered && <p className="text-[10px] text-green-400 mt-1">✅ Delivered</p>}
        </div>
      ))}
      {(!data?.recentOrders || data.recentOrders.length === 0) && (
        <p className="text-center text-gray-500 text-sm py-8">No orders yet</p>
      )}
    </motion.div>
  );
}
