import apiClient from './client';
import type { Order, CartItem, PaginatedResponse } from '@/types';

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  variant_id?: number;
  variant_name?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  fulfillment_status: string;
  voucher_code?: string;
}

export interface OrderSummary {
  id: number;
  order_number: string;
  uuid: string;
  total_amount: number;
  status: string;
  payment_status: string;
  fulfillment_status: string;
  items_count: number;
  created_at: string;
}

export interface OrderDetail {
  id: number;
  uuid: string;
  order_number: string;
  user_id: number;
  subtotal: number;
  discount_amount: number;
  wallet_used: number;
  tax_amount: number;
  total_amount: number;
  promo_code?: string;
  status: string;
  payment_status: string;
  fulfillment_status: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface OrdersListResponse {
  orders: OrderSummary[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    per_page: number;
  };
}

export interface OrdersFilters {
  page?: number;
  limit?: number;
  status?: string;
}

interface CreateOrderData {
  items: Array<{ variant_id: number; quantity: number }>;
  delivery_email: string;
  delivery_mobile?: string;
  promo_code?: string;
  use_wallet_amount?: number;
}

interface RazorpayOrderResponse {
  order: Order;
  razorpay_order_id: string;
  razorpay_key: string;
  amount: number;
  currency: string;
}

export const ordersAPI = {
  // User endpoints
  getAll: async (filters: OrdersFilters = {}): Promise<OrdersListResponse> => {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.status) params.append('status', filters.status);

    const response = await apiClient.get(`/orders/?${params.toString()}`);
    return response.data.data;
  },

  getByOrderNumber: async (orderNumber: string): Promise<OrderDetail> => {
    const response = await apiClient.get(`/orders/${orderNumber}`);
    return response.data.data;
  },

  create: async (data: CreateOrderData): Promise<RazorpayOrderResponse> => {
    const response = await apiClient.post('/orders', data);
    return response.data;
  },

  verifyPayment: async (
    orderNumber: string,
    paymentData: {
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
    }
  ): Promise<Order> => {
    const response = await apiClient.post(`/orders/${orderNumber}/verify-payment`, paymentData);
    return response.data;
  },

  cancel: async (orderNumber: string, reason?: string): Promise<Order> => {
    const response = await apiClient.post(`/orders/${orderNumber}/cancel`, { reason });
    return response.data;
  },

  getVoucherCodes: async (orderNumber: string): Promise<Order> => {
    const response = await apiClient.get(`/orders/${orderNumber}/vouchers`);
    return response.data;
  },

  validatePromoCode: async (
    code: string,
    cartItems: CartItem[]
  ): Promise<{ valid: boolean; discount: number; message?: string }> => {
    const response = await apiClient.post('/orders/validate-promo', {
      code,
      items: cartItems.map((item) => ({
        variant_id: item.variantId,
        quantity: item.quantity,
      })),
    });
    return response.data;
  },

  // Admin endpoints
  getAllAdmin: async (
    filters?: { status?: string; user_id?: number; date_from?: string; date_to?: string },
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedResponse<Order>> => {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('page_size', String(pageSize));
    if (filters?.status) params.append('status', filters.status);
    if (filters?.user_id) params.append('user_id', String(filters.user_id));
    if (filters?.date_from) params.append('date_from', filters.date_from);
    if (filters?.date_to) params.append('date_to', filters.date_to);

    const response = await apiClient.get(`/admin/orders?${params.toString()}`);
    return response.data;
  },

  updateStatus: async (orderNumber: string, status: string): Promise<Order> => {
    const response = await apiClient.patch(`/admin/orders/${orderNumber}`, { status });
    return response.data;
  },

  fulfill: async (
    orderNumber: string,
    voucherCodes: Array<{ order_item_id: number; card_number: string; pin?: string }>
  ): Promise<Order> => {
    const response = await apiClient.post(`/admin/orders/${orderNumber}/fulfill`, { voucher_codes: voucherCodes });
    return response.data;
  },

  refund: async (orderNumber: string, amount?: number, reason?: string): Promise<Order> => {
    const response = await apiClient.post(`/admin/orders/${orderNumber}/refund`, { amount, reason });
    return response.data;
  },
};
