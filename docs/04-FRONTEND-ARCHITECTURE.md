# Frontend Architecture - Next.js + React

## 🎨 Project Structure

```
frontend/
├── public/
│   ├── images/
│   ├── icons/
│   └── favicon.ico
├── src/
│   ├── app/                      # Next.js 14 App Router
│   │   ├── (auth)/              # Auth layout group
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── verify-otp/
│   │   ├── (main)/              # Main layout group
│   │   │   ├── page.tsx         # Homepage
│   │   │   ├── merchants/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [slug]/
│   │   │   ├── coupons/
│   │   │   ├── products/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [slug]/
│   │   │   ├── cart/
│   │   │   ├── checkout/
│   │   │   ├── wallet/
│   │   │   ├── orders/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [orderNumber]/
│   │   │   ├── profile/
│   │   │   └── referrals/
│   │   ├── (static)/            # Static pages
│   │   │   ├── about/
│   │   │   ├── how-it-works/
│   │   │   ├── terms/
│   │   │   ├── privacy/
│   │   │   └── faq/
│   │   ├── admin/               # Admin dashboard
│   │   │   ├── dashboard/
│   │   │   ├── merchants/
│   │   │   ├── offers/
│   │   │   ├── products/
│   │   │   ├── orders/
│   │   │   ├── users/
│   │   │   └── analytics/
│   │   ├── api/                 # API routes (if needed)
│   │   │   └── webhooks/
│   │   ├── layout.tsx           # Root layout
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                  # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── MobileNav.tsx
│   │   ├── offer/
│   │   │   ├── OfferCard.tsx
│   │   │   ├── OfferGrid.tsx
│   │   │   ├── CouponCode.tsx
│   │   │   └── OfferFilters.tsx
│   │   ├── product/
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductGrid.tsx
│   │   │   ├── VariantSelector.tsx
│   │   │   └── ProductFilters.tsx
│   │   ├── merchant/
│   │   │   ├── MerchantCard.tsx
│   │   │   └── MerchantGrid.tsx
│   │   ├── cart/
│   │   │   ├── CartDrawer.tsx
│   │   │   ├── CartItem.tsx
│   │   │   └── CartSummary.tsx
│   │   ├── checkout/
│   │   │   ├── CheckoutForm.tsx
│   │   │   ├── PaymentMethods.tsx
│   │   │   └── OrderSummary.tsx
│   │   ├── wallet/
│   │   │   ├── WalletBalance.tsx
│   │   │   ├── TransactionList.tsx
│   │   │   ├── CashbackTracker.tsx
│   │   │   └── WithdrawForm.tsx
│   │   ├── profile/
│   │   │   ├── ProfileForm.tsx
│   │   │   ├── KYCForm.tsx
│   │   │   └── PasswordChange.tsx
│   │   └── common/
│   │       ├── SearchBar.tsx
│   │       ├── CategoryNav.tsx
│   │       ├── Breadcrumbs.tsx
│   │       ├── Pagination.tsx
│   │       └── LoadingSpinner.tsx
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts        # Axios instance
│   │   │   ├── auth.ts
│   │   │   ├── merchants.ts
│   │   │   ├── offers.ts
│   │   │   ├── products.ts
│   │   │   ├── orders.ts
│   │   │   └── wallet.ts
│   │   ├── utils/
│   │   │   ├── format.ts        # Date, currency formatters
│   │   │   ├── validation.ts
│   │   │   ├── constants.ts
│   │   │   └── helpers.ts
│   │   └── hooks/
│   │       ├── useAuth.ts
│   │       ├── useCart.ts
│   │       ├── useWallet.ts
│   │       ├── useOffers.ts
│   │       └── useProducts.ts
│   ├── store/                   # Zustand stores
│   │   ├── authStore.ts
│   │   ├── cartStore.ts
│   │   ├── walletStore.ts
│   │   └── uiStore.ts
│   ├── types/
│   │   ├── user.ts
│   │   ├── merchant.ts
│   │   ├── offer.ts
│   │   ├── product.ts
│   │   ├── order.ts
│   │   └── api.ts
│   └── styles/
│       └── tailwind.config.ts
├── .env.local
├── next.config.js
├── package.json
└── tsconfig.json
```

---

## 📄 Key Pages Breakdown

### 1. **Homepage** (`/`)
**Purpose**: Main landing page with top offers, merchants, categories

**Components**:
- Hero banner with search
- Featured merchants grid
- Top offers carousel
- Category navigation
- "How it works" section
- Testimonials
- CTA for signup

**Data Fetched**:
- Featured merchants
- Top/exclusive offers
- Categories
- Banner content (CMS)

**SEO**: High priority, full SSR/SSG

---

### 2. **Merchants Listing** (`/merchants`)
**Components**:
- Search/filter sidebar
- Merchant grid with logos
- Cashback badges
- Category filter pills
- Sort options (alphabetical, cashback high-low, popular)

**Filters**:
- Category
- Cashback type (percentage/fixed)
- Featured only

---

### 3. **Merchant Detail** (`/merchants/[slug]`)
**Example**: `/merchants/amazon`

**Components**:
- Merchant header (logo, name, cashback info)
- Tabs: "All Offers", "Deals", "Codes"
- Offer grid
- "About merchant" section
- Related merchants

**Data Fetched**:
- Merchant details
- Merchant's offers (paginated)
- Commission rates by category

**SEO**: Critical for organic traffic, SSR

---

### 4. **Coupons/Offers Listing** (`/coupons`)
**Components**:
- Advanced filters (merchant, category, type, cashback %)
- Sort dropdown
- Offer cards grid
- Load more / pagination

**URL Params**: `?merchant=amazon&category=fashion&sort=cashback_high`

---

### 5. **Products Listing** (`/products`)
**Gift Cards Catalog**

**Components**:
- Category tabs (Food, Travel, Lifestyle, etc.)
- Product grid
- Price filter (denomination range)
- Bestseller badge
- Quick add to cart

---

### 6. **Product Detail** (`/products/[slug]`)
**Example**: `/products/flipkart-egift-voucher`

**Components**:
- Product image gallery
- Product info (name, SKU, description)
- Variant selector (denominations)
- "Add to cart" button
- Terms & conditions accordion
- Delivery info
- Reviews/ratings (optional)
- Related products carousel

**Data Fetched**:
- Product details
- All variants with prices
- Availability status

---

### 7. **Cart** (`/cart`)
**Components**:
- Cart items list
- Quantity controls
- Remove item button
- Promo code input
- Wallet balance toggle ("Use ₹500 from wallet")
- Order summary
- "Proceed to checkout" CTA

**State**: Zustand cart store (persisted in localStorage)

---

### 8. **Checkout** (`/checkout`)
**Components**:
- Order review
- Delivery details form (email, mobile)
- Payment method selection
- Razorpay integration
- Order summary sidebar

**Flow**:
1. Validate cart on page load
2. User fills delivery details
3. Select payment method
4. Click "Place Order" → create order API → get Razorpay order_id
5. Open Razorpay modal
6. On success → verify payment → redirect to order success

---

### 9. **Order Success** (`/orders/[orderNumber]/success`)
**Components**:
- Success animation
- Order number display
- "View voucher codes" button
- "Track order" link
- Social share (optional)

---

### 10. **Orders List** (`/orders`)
**Components**:
- Order cards (grouped by status)
- Tabs: All, Pending, Completed, Cancelled
- Order summary (number, date, total, status)
- "View details" button

---

### 11. **Order Detail** (`/orders/[orderNumber]`)
**Components**:
- Order timeline (placed → paid → processing → fulfilled)
- Items list with voucher codes (expandable)
- "Copy code" buttons
- Download vouchers PDF (optional)
- Payment info
- Delivery info
- "Raise support ticket" button

---

### 12. **Wallet** (`/wallet`)
**Tabs**:
1. **Balance**: Current balance, pending cashback, lifetime earnings, withdraw CTA
2. **Transactions**: List of wallet credits/debits with filters
3. **Cashback Tracker**: Pending/confirmed/rejected cashback events
4. **Withdrawals**: Withdrawal history

**Components**:
- Wallet balance card (big numbers)
- Transaction filters (type, date range)
- Cashback event cards with status badges
- "Claim missing cashback" modal
- Withdraw form modal (UPI, bank, voucher options)

---

### 13. **Profile** (`/profile`)
**Tabs**:
1. **Personal Info**: Name, email, mobile, DOB, gender
2. **KYC Details**: Bank account, UPI, PAN, address
3. **Security**: Change password, 2FA (optional)
4. **Preferences**: Email/SMS notification settings

---

### 14. **Referrals** (`/referrals`)
**Components**:
- Referral code display (large, copyable)
- Referral link with share buttons (WhatsApp, Twitter, Facebook)
- Stats cards (total referrals, active, earnings)
- Referrals table (friend's name, join date, earnings from them)
- "How it works" FAQ

---

### 15. **Admin Dashboard** (`/admin/dashboard`)
**Metrics Cards**:
- Total revenue (today, week, month, all-time)
- Total orders
- Pending cashback
- Pending withdrawals

**Charts**:
- Revenue over time (line chart)
- Orders by status (pie chart)
- Top merchants (bar chart)
- Category performance

---

### 16. **Admin: Merchants** (`/admin/merchants`)
**Components**:
- Data table with search/filter
- Columns: Name, Slug, Cashback %, Active Offers, Status, Actions
- Add/Edit merchant modal
- Bulk actions (activate, deactivate)

---

### 17. **Admin: Offers** (`/admin/offers`)
**Components**:
- Filters: Merchant, Category, Status, Expiring soon
- Data table with actions (edit, delete, duplicate)
- Add/Edit offer form (multi-step)
- Bulk upload via CSV

---

### 18. **Admin: Orders** (`/admin/orders`)
**Components**:
- Filters: Status, Date range, User
- Order table with quick status update
- "View details" → order modal
- "Mark as fulfilled" with voucher code input
- Export to Excel

---

## 🎨 Component Design Patterns

### **OfferCard.tsx**
```tsx
interface OfferCardProps {
  offer: Offer;
  onClickTrack: (offerId: number) => void;
}

export function OfferCard({ offer, onClickTrack }: OfferCardProps) {
  return (
    <Card className="hover:shadow-lg transition">
      <CardHeader>
        <div className="flex items-start justify-between">
          <img src={offer.merchant.logo_url} className="w-16 h-16" />
          {offer.is_exclusive && <Badge>Exclusive</Badge>}
        </div>
        <CardTitle>{offer.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">{offer.description}</p>
        {offer.cashback_value && (
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="success">
              Cashback: {offer.cashback_type === 'percentage' ? `${offer.cashback_value}%` : `₹${offer.cashback_value}`}
            </Badge>
          </div>
        )}
      </CardContent>
      <CardFooter>
        {offer.offer_type === 'code' ? (
          <CouponCode code={offer.coupon_code!} onClick={() => onClickTrack(offer.id)} />
        ) : (
          <Button onClick={() => onClickTrack(offer.id)}>Get Deal</Button>
        )}
      </CardFooter>
    </Card>
  );
}
```

---

### **CouponCode.tsx**
```tsx
interface CouponCodeProps {
  code: string;
  onClick: () => void;
}

export function CouponCode({ code, onClick }: CouponCodeProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    onClick(); // Track click
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2 border-2 border-dashed border-primary rounded-lg p-3">
      <code className="font-mono font-bold text-lg">{code}</code>
      <Button variant="outline" size="sm" onClick={handleCopy}>
        {copied ? 'Copied!' : 'Copy Code'}
      </Button>
    </div>
  );
}
```

---

### **ProductCard.tsx**
```tsx
interface ProductCardProps {
  product: Product;
  onAddToCart: (variantId: number, quantity: number) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0]);
  const [quantity, setQuantity] = useState(1);

  return (
    <Card>
      <CardHeader>
        <img src={product.image_url} className="w-full h-48 object-cover rounded" />
        {product.is_bestseller && <Badge className="absolute top-2 right-2">Bestseller</Badge>}
      </CardHeader>
      <CardContent>
        <CardTitle className="text-base">{product.name}</CardTitle>
        <p className="text-sm text-gray-500">{product.merchant?.name}</p>
        
        <div className="mt-3">
          <label className="text-sm font-medium">Select Amount</label>
          <div className="flex gap-2 mt-1">
            {product.variants.map(variant => (
              <Button
                key={variant.id}
                variant={selectedVariant.id === variant.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedVariant(variant)}
                disabled={!variant.is_available}
              >
                ₹{variant.denomination}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex items-center justify-between w-full">
          <span className="text-xl font-bold">₹{selectedVariant.selling_price}</span>
          <Button onClick={() => onAddToCart(selectedVariant.id, quantity)}>
            Add to Cart
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
```

---

## 🔄 State Management (Zustand)

### **authStore.ts**
```typescript
interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      
      login: async (credentials) => {
        const response = await authAPI.login(credentials);
        set({
          user: response.data.user,
          accessToken: response.data.access_token,
          isAuthenticated: true
        });
      },
      
      logout: () => {
        set({ user: null, accessToken: null, isAuthenticated: false });
      },
      
      updateUser: (data) => {
        set(state => ({
          user: state.user ? { ...state.user, ...data } : null
        }));
      }
    }),
    { name: 'auth-storage' }
  )
);
```

---

### **cartStore.ts**
```typescript
interface CartItem {
  variantId: number;
  productName: string;
  denomination: number;
  sellingPrice: number;
  quantity: number;
  imageUrl?: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (variantId: number) => void;
  updateQuantity: (variantId: number, quantity: number) => void;
  clearCart: () => void;
  total: number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (item) => {
        const existing = get().items.find(i => i.variantId === item.variantId);
        if (existing) {
          set(state => ({
            items: state.items.map(i =>
              i.variantId === item.variantId
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            )
          }));
        } else {
          set(state => ({ items: [...state.items, item] }));
        }
      },
      
      removeItem: (variantId) => {
        set(state => ({
          items: state.items.filter(i => i.variantId !== variantId)
        }));
      },
      
      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(variantId);
        } else {
          set(state => ({
            items: state.items.map(i =>
              i.variantId === variantId ? { ...i, quantity } : i
            )
          }));
        }
      },
      
      clearCart: () => set({ items: [] }),
      
      get total() {
        return get().items.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);
      }
    }),
    { name: 'cart-storage' }
  )
);
```

---

## 🎯 SEO Strategy

### **Metadata Configuration**
```typescript
// app/(main)/merchants/[slug]/page.tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const merchant = await getMerchant(params.slug);
  
  return {
    title: merchant.seo_title || `${merchant.name} Coupons & Cashback Offers`,
    description: merchant.seo_description || `Save with ${merchant.name} coupons. Get up to ${merchant.default_cashback_value}% cashback on all purchases.`,
    keywords: `${merchant.name} coupons, ${merchant.name} offers, ${merchant.name} cashback`,
    openGraph: {
      title: merchant.seo_title,
      description: merchant.seo_description,
      images: [merchant.banner_url],
    },
    twitter: {
      card: 'summary_large_image',
    }
  };
}
```

### **Static Generation for Popular Pages**
```typescript
// Generate static pages for top 100 merchants
export async function generateStaticParams() {
  const merchants = await getTopMerchants(100);
  return merchants.map(merchant => ({ slug: merchant.slug }));
}
```

---

## 🚀 Performance Optimizations

1. **Image Optimization**: Use Next.js `<Image>` component
2. **Code Splitting**: Dynamic imports for heavy components
3. **Lazy Loading**: Infinite scroll for offers/products
4. **Caching**: React Query for API data caching
5. **Prefetching**: Prefetch merchant pages on hover
6. **Bundle Analysis**: Keep bundle size < 200KB

---

## 📱 Responsive Design

**Breakpoints** (Tailwind):
- `sm`: 640px (mobile landscape)
- `md`: 768px (tablet)
- `lg`: 1024px (desktop)
- `xl`: 1280px (large desktop)

**Mobile-First Approach**:
- Hamburger menu on mobile
- Bottom navigation for key actions
- Swipeable carousels
- Sticky cart button

---

**Next Document**: `05-IMPLEMENTATION-ROADMAP.md` - Step-by-step build guide
