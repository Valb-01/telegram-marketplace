import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: BASE_URL.endsWith('/api') ? BASE_URL : `${BASE_URL}/api`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('auth_token');
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────

export const authApi = {
  loginWithTelegram: (initData: string) =>
    api.post<{ token: string; user: User }>('/auth/telegram', { initData }),
};

// ── Products ──────────────────────────────────────────────────────────────────

export const productsApi = {
  list: (params?: {
    category?: string;
    featured?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
    sort?: string;
  }) => api.get<ProductWithCategory[]>('/products', { params }),

  get: (slug: string) => api.get<ProductWithCategory>(`/products/${slug}`),

  create: (data: FormData) =>
    api.post<Product>('/products', data, { headers: { 'Content-Type': 'multipart/form-data' } }),

  update: (id: number, data: FormData) =>
    api.put<Product>(`/products/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),

  delete: (id: number) => api.delete(`/products/${id}`),
};

// ── Categories ────────────────────────────────────────────────────────────────

export const categoriesApi = {
  list: () => api.get<Category[]>('/categories'),
  create: (data: Partial<Category>) => api.post<Category>('/categories', data),
  update: (id: number, data: Partial<Category>) => api.put<Category>(`/categories/${id}`, data),
  delete: (id: number) => api.delete(`/categories/${id}`),
};

// ── Orders ────────────────────────────────────────────────────────────────────

export const ordersApi = {
  create: (data: CreateOrderInput) => api.post<CreateOrderResponse>('/orders', data),
  myOrders: () => api.get<Order[]>('/orders/my'),
  get: (id: number) => api.get<OrderDetail>(`/orders/${id}`),
  all: () => api.get<{ order: Order; user: User }[]>('/orders'),
};

// ── Payments ──────────────────────────────────────────────────────────────────

export const paymentsApi = {
  createUsdt: (orderId: number) =>
    api.post<UsdtPaymentInfo>('/payments/usdt/create', { orderId }),
  checkStatus: (orderId: number) =>
    api.get<{ orderId: number; status: string; fileDelivered: boolean }>(`/payments/status/${orderId}`),
};

// ── Admin ─────────────────────────────────────────────────────────────────────

export const adminApi = {
  analytics: () => api.get<AdminAnalytics>('/admin/analytics'),
  users: () => api.get<User[]>('/admin/users'),
};

// ── Types ─────────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  telegramId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  createdAt: string;
}

export interface Product {
  id: number;
  categoryId?: number;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  priceStars: number;
  priceUsdt?: string;
  thumbnailUrl?: string;
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  downloadCount: number;
  fileName?: string;
  fileSize?: number;
  createdAt: string;
}

export interface ProductWithCategory extends Product {
  category?: Category;
}

export interface Order {
  id: number;
  userId: number;
  paymentMethod: string;
  status: string;
  totalStars?: number;
  totalUsdt?: string;
  txHash?: string;
  fileDelivered: boolean;
  createdAt: string;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  priceStars?: number;
  priceUsdt?: string;
  product: Product;
}

export interface OrderDetail extends Order {
  items: OrderItem[];
}

export interface CreateOrderInput {
  items: { productId: number; quantity: number }[];
  paymentMethod: 'stars' | 'usdt_trc20';
  telegramChatId: number;
}

export interface CreateOrderResponse {
  orderId: number;
  paymentMethod: string;
  totalStars?: number;
  totalUsdt?: number;
  status: string;
  message?: string;
}

export interface UsdtPaymentInfo {
  orderId: number;
  walletAddress: string;
  expectedAmount: string;
  currency: string;
  expiresAt: string;
  network: string;
  memo: string;
}

export interface AdminAnalytics {
  stats: {
    totalOrders: number;
    paidOrders: number;
    totalUsers: number;
    totalProducts: number;
    starRevenue: number;
    usdtRevenue: string;
  };
  recentOrders: (Order & { user?: User })[];
  topProducts: Product[];
}
