// User Types
export interface User {
  id: number;
  email: string;
  mobile?: string;
  first_name?: string;
  last_name?: string;
  role: 'customer' | 'admin' | 'super_admin';
  is_email_verified: boolean;
  is_mobile_verified: boolean;
  kyc_status: 'pending' | 'submitted' | 'verified' | 'rejected';
  referral_code: string;
  referred_by_code?: string;
  avatar_url?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  created_at: string;
  updated_at: string;
}

export interface UserProfile extends User {
  wallet_balance: number;
  pending_cashback: number;
  lifetime_earnings: number;
  total_orders: number;
  total_referrals: number;
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  mobile?: string;
  referral_code?: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// Merchant Types
export interface Merchant {
  id: number;
  name: string;
  slug: string;
  logo_url?: string;
  banner_url?: string;
  description?: string;
  website_url: string;
  affiliate_url: string;
  default_cashback_type: 'percentage' | 'fixed';
  default_cashback_value: number;
  is_featured: boolean;
  is_active: boolean;
  category_id?: number;
  category?: Category;
  seo_title?: string;
  seo_description?: string;
  total_offers?: number;
  created_at: string;
  updated_at: string;
}

// Category Types
export interface Category {
  id: number;
  name: string;
  slug: string;
  icon?: string;
  parent_id?: number;
  is_active: boolean;
  display_order: number;
}

// Offer Types
export interface Offer {
  id: number;
  merchant_id: number;
  merchant?: Merchant;
  title: string;
  description?: string;
  image_url?: string;
  offer_type: 'code' | 'deal' | 'cashback';
  coupon_code?: string;
  discount_type?: 'percentage' | 'fixed';
  discount_value?: number;
  cashback_type?: 'percentage' | 'fixed';
  cashback_value?: number;
  min_order_value?: number;
  max_discount?: number;
  affiliate_url: string;
  terms_conditions?: string;
  start_date: string;
  end_date?: string;
  is_exclusive: boolean;
  is_verified: boolean;
  is_featured: boolean;
  is_active: boolean;
  category_id?: number;
  category?: Category;
  click_count: number;
  success_count: number;
  created_at: string;
  updated_at: string;
}

// Product Types (Gift Cards)
export interface Product {
  id: number;
  name: string;
  slug: string;
  sku: string;
  description?: string;
  image_url?: string;
  merchant_id?: number;
  merchant?: Merchant;
  category_id?: number;
  category?: Category;
  is_bestseller: boolean;
  is_active: boolean;
  variants: ProductVariant[];
  terms_conditions?: string;
  how_to_redeem?: string;
  validity_info?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  denomination: number;
  selling_price: number;
  cost_price: number;
  discount_percentage: number;
  is_available: boolean;
  stock_quantity?: number;
}

// Cart Types
export interface CartItem {
  variantId: number;
  productId: number;
  productName: string;
  productSlug: string;
  denomination: number;
  sellingPrice: number;
  quantity: number;
  imageUrl?: string;
  merchantName?: string;
}

// Order Types
export interface Order {
  id: number;
  order_number: string;
  user_id: number;
  status: 'pending' | 'paid' | 'processing' | 'fulfilled' | 'cancelled' | 'refunded';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method?: string;
  subtotal: number;
  discount_amount: number;
  wallet_amount_used: number;
  final_amount: number;
  currency: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  delivery_email: string;
  delivery_mobile?: string;
  items: OrderItem[];
  promo_code?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  paid_at?: string;
  fulfilled_at?: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_variant_id: number;
  product_name: string;
  denomination: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  gift_cards: GiftCard[];
}

export interface GiftCard {
  id: number;
  order_item_id: number;
  card_number: string;
  pin?: string;
  activation_url?: string;
  expiry_date?: string;
  status: 'active' | 'redeemed' | 'expired';
}

// Wallet Types
export interface Wallet {
  id: number;
  user_id: number;
  balance: number;
  pending_cashback: number;
  lifetime_earnings: number;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: number;
  wallet_id: number;
  type: 'credit' | 'debit';
  amount: number;
  balance_after: number;
  category: 'cashback' | 'referral' | 'order_payment' | 'withdrawal' | 'refund' | 'bonus' | 'adjustment';
  description: string;
  reference_id?: string;
  reference_type?: string;
  status: 'pending' | 'completed' | 'failed' | 'reversed';
  created_at: string;
}

export interface CashbackEvent {
  id: number;
  user_id: number;
  offer_id: number;
  offer?: Offer;
  merchant_id: number;
  merchant?: Merchant;
  click_id: string;
  order_amount?: number;
  cashback_amount: number;
  status: 'pending' | 'confirmed' | 'rejected' | 'paid';
  confirmation_date?: string;
  rejection_reason?: string;
  created_at: string;
}

export interface WithdrawalRequest {
  id: number;
  user_id: number;
  amount: number;
  withdrawal_method: 'upi' | 'bank' | 'gift_card';
  account_details: Record<string, string>;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  processed_at?: string;
  rejection_reason?: string;
  created_at: string;
}

// Referral Types
export interface Referral {
  id: number;
  referrer_id: number;
  referred_id: number;
  referred_user?: User;
  status: 'pending' | 'active' | 'earned';
  referrer_bonus_amount: number;
  referred_bonus_amount: number;
  earned_amount: number;
  created_at: string;
}

// API Response Types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ApiError {
  detail: string;
  code?: string;
  field?: string;
}

// Filter Types
export interface OfferFilters {
  merchant_id?: number;
  category_id?: number;
  offer_type?: 'code' | 'deal' | 'cashback';
  is_exclusive?: boolean;
  is_verified?: boolean;
  has_cashback?: boolean;
  search?: string;
  sort_by?: 'newest' | 'popular' | 'cashback_high' | 'cashback_low' | 'expiring_soon';
}

export interface MerchantFilters {
  category_id?: number;
  is_featured?: boolean;
  has_cashback?: boolean;
  search?: string;
  sort_by?: 'alphabetical' | 'popular' | 'cashback_high' | 'newest';
}

export interface ProductFilters {
  category_id?: number;
  merchant_id?: number;
  min_price?: number;
  max_price?: number;
  is_bestseller?: boolean;
  search?: string;
  sort_by?: 'popular' | 'price_low' | 'price_high' | 'newest';
}

// UI Types
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  duration?: number;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}
