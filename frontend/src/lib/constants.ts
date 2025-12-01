export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const SITE_NAME = 'BIDUA Coupons';
export const SITE_DESCRIPTION = 'Save money with verified coupons, cashback offers, and discounted gift cards';

export const CASHBACK_TYPES = {
  percentage: 'Percentage',
  fixed: 'Fixed Amount',
} as const;

export const OFFER_TYPES = {
  code: 'Coupon Code',
  deal: 'Deal',
  cashback: 'Cashback Offer',
} as const;

export const ORDER_STATUSES = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  paid: { label: 'Paid', color: 'bg-blue-100 text-blue-800' },
  processing: { label: 'Processing', color: 'bg-purple-100 text-purple-800' },
  fulfilled: { label: 'Fulfilled', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
  refunded: { label: 'Refunded', color: 'bg-gray-100 text-gray-800' },
} as const;

export const PAYMENT_STATUSES = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  paid: { label: 'Paid', color: 'bg-green-100 text-green-800' },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-800' },
  refunded: { label: 'Refunded', color: 'bg-gray-100 text-gray-800' },
} as const;

export const CASHBACK_STATUSES = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
  paid: { label: 'Paid', color: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
} as const;

export const KYC_STATUSES = {
  pending: { label: 'Not Submitted', color: 'bg-gray-100 text-gray-800' },
  submitted: { label: 'Under Review', color: 'bg-yellow-100 text-yellow-800' },
  verified: { label: 'Verified', color: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
} as const;

export const WITHDRAWAL_METHODS = {
  upi: { label: 'UPI', icon: 'smartphone' },
  bank: { label: 'Bank Transfer', icon: 'building' },
  gift_card: { label: 'Gift Card', icon: 'gift' },
} as const;

export const CATEGORIES = [
  { id: 1, name: 'Fashion', slug: 'fashion', icon: '👗' },
  { id: 2, name: 'Electronics', slug: 'electronics', icon: '📱' },
  { id: 3, name: 'Food & Dining', slug: 'food-dining', icon: '🍕' },
  { id: 4, name: 'Travel', slug: 'travel', icon: '✈️' },
  { id: 5, name: 'Entertainment', slug: 'entertainment', icon: '🎬' },
  { id: 6, name: 'Health & Beauty', slug: 'health-beauty', icon: '💄' },
  { id: 7, name: 'Home & Living', slug: 'home-living', icon: '🏠' },
  { id: 8, name: 'Baby & Kids', slug: 'baby-kids', icon: '🧸' },
  { id: 9, name: 'Sports & Fitness', slug: 'sports-fitness', icon: '⚽' },
  { id: 10, name: 'Books & Stationery', slug: 'books-stationery', icon: '📚' },
] as const;

export const MINIMUM_WITHDRAWAL = 100;
export const MAXIMUM_CART_QUANTITY = 10;
export const DEFAULT_PAGE_SIZE = 20;

export const ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
  verifyOtp: '/verify-otp',
  merchants: '/merchants',
  merchantDetail: (slug: string) => `/merchants/${slug}`,
  coupons: '/coupons',
  products: '/products',
  productDetail: (slug: string) => `/products/${slug}`,
  cart: '/cart',
  checkout: '/checkout',
  orders: '/orders',
  orderDetail: (orderNumber: string) => `/orders/${orderNumber}`,
  orderSuccess: (orderNumber: string) => `/orders/${orderNumber}/success`,
  wallet: '/wallet',
  profile: '/profile',
  referrals: '/referrals',
  about: '/about',
  howItWorks: '/how-it-works',
  faq: '/faq',
  terms: '/terms',
  privacy: '/privacy',
  admin: {
    dashboard: '/admin/dashboard',
    merchants: '/admin/merchants',
    offers: '/admin/offers',
    products: '/admin/products',
    orders: '/admin/orders',
    users: '/admin/users',
    analytics: '/admin/analytics',
    withdrawals: '/admin/withdrawals',
    queues: '/admin/queues',
    giftCards: '/admin/gift-cards',
    cms: '/admin/cms',
  },
} as const;
