import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ordersAPI, type OrdersFilters } from "../api/orders";

// List user's orders
export function useOrders(filters: OrdersFilters = {}) {
  return useQuery({
    queryKey: ["orders", filters],
    queryFn: () => ordersAPI.getAll(filters),
  });
}

// Get single order details
export function useOrder(orderNumber: string) {
  return useQuery({
    queryKey: ["orders", orderNumber],
    queryFn: () => ordersAPI.getByOrderNumber(orderNumber),
    enabled: !!orderNumber,
  });
}

// Update order status (admin)
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ orderId, status }: { 
      orderId: number; 
      status: { 
        status?: string; 
        payment_status?: string; 
        fulfillment_status?: string;
      } 
    }) => {
      // This would call the admin API endpoint
      return fetch(`/api/v1/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(status),
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

// Fulfill order with voucher codes (admin)
export function useFulfillOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      orderId, 
      vouchers 
    }: { 
      orderId: number; 
      vouchers: Array<{ order_item_id: number; voucher_code: string }> 
    }) => {
      return fetch(`/api/v1/orders/${orderId}/fulfill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vouchers),
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
