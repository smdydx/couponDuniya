# Coupon Commerce - Frontend

Next.js 14 frontend application for coupon aggregation and gift card e-commerce platform.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5+
- **Styling**: Tailwind CSS 3+
- **UI Components**: shadcn/ui
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod
- **HTTP Client**: Axios
- **Payments**: Razorpay SDK

## Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx         # Root layout
│   │   ├── page.tsx           # Homepage
│   │   ├── (auth)/            # Auth routes group
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── merchants/         # Merchant pages
│   │   │   ├── page.tsx
│   │   │   └── [slug]/
│   │   ├── coupons/           # Coupons listing
│   │   ├── products/          # Gift cards
│   │   │   ├── page.tsx
│   │   │   └── [slug]/
│   │   ├── cart/              # Shopping cart
│   │   ├── checkout/          # Checkout flow
│   │   ├── orders/            # Order history
│   │   │   └── [orderNumber]/
│   │   ├── wallet/            # Wallet & cashback
│   │   ├── profile/           # User profile
│   │   └── admin/             # Admin dashboard
│   │       ├── merchants/
│   │       ├── offers/
│   │       ├── products/
│   │       └── orders/
│   ├── components/            # Reusable components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── merchants/
│   │   │   ├── MerchantCard.tsx
│   │   │   └── MerchantGrid.tsx
│   │   ├── offers/
│   │   │   ├── OfferCard.tsx
│   │   │   └── CouponCode.tsx
│   │   ├── products/
│   │   │   ├── ProductCard.tsx
│   │   │   └── VariantSelector.tsx
│   │   ├── cart/
│   │   │   ├── CartDrawer.tsx
│   │   │   └── CartItem.tsx
│   │   └── wallet/
│   │       ├── WalletBalance.tsx
│   │       └── TransactionHistory.tsx
│   ├── lib/                   # Utilities
│   │   ├── api/              # API client
│   │   │   ├── axios.ts
│   │   │   ├── auth.ts
│   │   │   ├── merchants.ts
│   │   │   ├── offers.ts
│   │   │   └── products.ts
│   │   ├── store/            # Zustand stores
│   │   │   ├── authStore.ts
│   │   │   ├── cartStore.ts
│   │   │   └── walletStore.ts
│   │   ├── utils/
│   │   │   ├── format.ts
│   │   │   └── validation.ts
│   │   └── constants.ts
│   ├── hooks/                # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useCart.ts
│   │   └── useRazorpay.ts
│   └── types/                # TypeScript types
│       ├── api.ts
│       ├── models.ts
│       └── index.ts
├── public/                   # Static assets
│   ├── images/
│   └── icons/
├── .env.local.example
├── .gitignore
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd frontend
npm install
# or
bun install
```

### 2. Configure Environment

```bash
cp .env.local.example .env.local
# Edit .env.local with your API URL and keys
```

### 3. Start Development Server

```bash
npm run dev
# or
bun dev
```

Application will be available at: `http://localhost:3000`

## Environment Variables

See `.env.local.example` for required configuration:
- API base URL
- Razorpay key
- Google Analytics ID (optional)

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Run type checking
npm run type-check

# Format code
npm run format
```

## Features

- 🎯 **Coupon Aggregation**: Browse and use coupons from 1000+ merchants
- 🎁 **Gift Cards**: Purchase digital gift cards with instant delivery
- 💰 **Cashback System**: Earn cashback on every purchase
- 👛 **Wallet**: Manage earnings and withdrawals
- 🔐 **Secure Authentication**: OTP-based login
- 📱 **Responsive Design**: Mobile-first approach
- ⚡ **Fast Performance**: Optimized with Next.js 14
- 🎨 **Modern UI**: Built with Tailwind CSS and shadcn/ui

## UI Components (shadcn/ui)

The project uses shadcn/ui components. To add new components:

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
```

## Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

### Docker

```bash
docker build -t coupon-commerce-frontend .
docker run -p 3000:3000 coupon-commerce-frontend
```
