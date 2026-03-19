import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi, paymentsApi, type CreateOrderInput } from '@/lib/api';
import { useAuthStore } from '@/lib/auth';

export function useMyOrders() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ['my-orders'],
    queryFn: () => ordersApi.myOrders().then((r) => r.data),
    enabled: !!user,
    refetchInterval: 15_000,
  });
}

export function useOrder(id: number) {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.get(id).then((r) => r.data),
    enabled: !!user && !!id,
    refetchInterval: 10_000,
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrderInput) => ordersApi.create(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-orders'] });
    },
  });
}

export function usePaymentStatus(orderId: number | null) {
  return useQuery({
    queryKey: ['payment-status', orderId],
    queryFn: () => paymentsApi.checkStatus(orderId!).then((r) => r.data),
    enabled: !!orderId,
    refetchInterval: 10_000,
  });
}
