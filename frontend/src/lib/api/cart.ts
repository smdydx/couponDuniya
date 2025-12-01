import api from './client';

// Types
export interface CartItem {
  product_id: number;
  variant_id?: number;
  quantity: number;
}

export interface CartItemValidated {
  product_id: number;
  product_name: string;
  variant_id?: number;
  variant_name?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  is_available: boolean;
  stock_available: number;
  merchant_name: string;
}

export interface PromoCodeInfo {
  code: string;
  discount_type: string;
  discount_value: number;
  discount_amount: number;
  is_valid: boolean;
  message?: string;
}

export interface CartValidateResponse {
  items: CartItemValidated[];
  subtotal: number;
  discount_amount: number;
  wallet_used: number;
  tax_amount: number;
  total_amount: number;
  promo_code?: PromoCodeInfo;
  is_valid: boolean;
  errors: string[];
}

export interface CheckoutRequest {
  items: CartItem[];
  promo_code?: string;
  wallet_amount?: number;
  email?: string;
  mobile?: string;
  notes?: string;
}

export interface PaymentDetails {
  order_id: string;
  amount: number;
  currency: string;
  key: string;
}

export interface CheckoutResponse {
  success: boolean;
  order_id: number;
  order_number: string;
  uuid: string;
  total_amount: number;
  payment_required: number;
  payment_details?: PaymentDetails;
  message: string;
}

export interface PaymentVerificationRequest {
  order_id: number;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface PaymentVerificationResponse {
  success: boolean;
  order_number: string;
  message: string;
  order_status: string;
}

// API Functions

export async function validateCart(
  items: CartItem[],
  promoCode?: string,
  walletAmount?: number
): Promise<CartValidateResponse> {
  const response = await api.post('/cart/validate', {
    items,
    promo_code: promoCode,
    wallet_amount: walletAmount,
  });
  return response.data;
}

export async function checkout(data: CheckoutRequest): Promise<CheckoutResponse> {
  const response = await api.post('/cart/checkout', data);
  return response.data;
}

export async function verifyPayment(
  data: PaymentVerificationRequest
): Promise<PaymentVerificationResponse> {
  const response = await api.post('/cart/verify-payment', data);
  return response.data;
}
