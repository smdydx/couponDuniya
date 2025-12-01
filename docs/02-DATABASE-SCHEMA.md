# Database Schema - PostgreSQL (CouponAli)

## 🗄️ Complete Database Design

### **Core Principles**
- Normalized structure (3NF)
- Soft deletes (`deleted_at` timestamp)
- Audit trails (`created_at`, `updated_at`)
- UUID primary keys for external references
- Integer IDs for internal joins (performance)

---

## 📋 Schema Overview (Expanded)

Below combines original planned tables with newly implemented & extended domain / access control tables. Final target set (production) currently totals 34 tables:

Authentication & Profile:
- users
- user_sessions
- user_kyc

Access Control:
- roles
- permissions
- role_permissions
- departments
- user_roles
- user_departments

Merchants & Catalog:
- categories
- merchants
- merchant_commissions
- products (gift cards catalog entries)
- product_variants
- inventory (physical / reserved stock ledger)

Offers & Tracking:
- offers
- offer_clicks
- offer_views (impressions)

Orders & Payments:
- orders
- order_items
- payments

Wallet & Finance:
- wallet_transactions
- wallet_balances (current snapshot per user)
- cashback_events
- withdrawal_requests (internal workflow) / withdrawals (external schema)
- payouts (completed disbursements)

Referrals & Engagement:
- referrals
- notifications
- support_tickets

Content & SEO:
- cms_pages
- seo_redirects

System & Auditing:
- audit_logs

Gift Cards Dedicated:
- gift_cards (legacy / alternate issuance flow) *If kept distinct from products*

Note: Some conceptual tables (inventory, offer_views, seo_redirects) not yet implemented in code but reserved in design. Implemented tables at time of writing include: users, categories, merchants, offers, offer_clicks, products, product_variants, orders, order_items, wallet_transactions, wallet_balances, referrals, gift_cards, cashback_events, withdrawal_requests, payouts, support_tickets, notifications, audit_logs, roles, permissions, role_permissions, departments, user_roles, user_departments.

### **Authentication & Users**
1. `users` - User accounts
2. `user_sessions` - Active sessions (planned)
3. `user_kyc` - KYC details for withdrawals (planned)

### **Merchant & Categories**
4. `categories` - Product/offer categories
5. `merchants` - Brands/stores (Amazon, Flipkart, etc.)
6. `merchant_commissions` - Category-wise commission rates (planned)

### **Coupons & Offers**
7. `offers` - Coupon codes and deals
8. `offer_clicks` - Click tracking
9. `offer_views` - Impression tracking (planned)

### **Products (Gift Cards)**
10. `products` - Gift card SKUs
11. `product_variants` - Price denominations (₹100, ₹500, etc.)
12. `inventory` - Stock management (planned – digital vs physical)

### **Orders & Payments**
13. `orders` - Purchase orders
14. `order_items` - Line items
15. `payments` - Payment transactions (planned – gateway detail table)

### **Wallet & Cashback**
16. `wallet_transactions` - All wallet movements
17. `wallet_balances` - Current balance snapshot
18. `cashback_events` - Affiliate cashback tracking
19. `withdrawal_requests` / `withdrawals` - Payout workflow vs final ledger
20. `payouts` - Completed disbursements

### **Referral System**
21. `referrals` - User referral tracking

### **CMS & Content**
22. `cms_pages` - Static pages (FAQ, Terms, etc.) (planned)
23. `seo_redirects` - URL management (planned)

### **Access Control**
24. `roles`
25. `permissions`
26. `role_permissions`
27. `departments`
28. `user_roles`
29. `user_departments`

### **Engagement & Support**
30. `notifications`
31. `support_tickets`

### **System & Auditing**
32. `audit_logs`

### **Gift Card Legacy / Alternate**
33. `gift_cards` (if separated from products for issuance tracking)

### **Auxiliary**
34. Future: `materialized views` (analytics), partition helpers

---

## 📐 Detailed Table Schemas

### 1. Users Table
```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    
    -- Authentication
    email VARCHAR(255) UNIQUE,
    email_verified_at TIMESTAMP,
    mobile VARCHAR(15) UNIQUE,
    mobile_verified_at TIMESTAMP,
    password_hash VARCHAR(255), -- bcrypt hash
    
    -- Profile
    full_name VARCHAR(255),
    avatar_url VARCHAR(500),
    date_of_birth DATE,
    gender VARCHAR(10), -- 'male', 'female', 'other'
    
    -- Social Login
    google_id VARCHAR(255) UNIQUE,
    facebook_id VARCHAR(255) UNIQUE,
    
    -- Wallet
    wallet_balance DECIMAL(10,2) DEFAULT 0.00,
    pending_cashback DECIMAL(10,2) DEFAULT 0.00,
    lifetime_earnings DECIMAL(10,2) DEFAULT 0.00,
    
    -- Referral
    referral_code VARCHAR(20) UNIQUE NOT NULL,
    referred_by_user_id BIGINT REFERENCES users(id),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    role VARCHAR(20) DEFAULT 'user', -- 'user', 'admin', 'merchant'
    
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    last_login_at TIMESTAMP,
    
    -- Indexes
    CONSTRAINT chk_contact CHECK (email IS NOT NULL OR mobile IS NOT NULL)
);

CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_mobile ON users(mobile) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_referral_code ON users(referral_code);
CREATE INDEX idx_users_referred_by ON users(referred_by_user_id);
```

### 2. User Sessions Table
```sql
CREATE TABLE user_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    token VARCHAR(500) UNIQUE NOT NULL, -- JWT or session token
    device_info JSONB, -- user agent, IP, device type
    ip_address INET,
    
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP
);

CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(token) WHERE revoked_at IS NULL;
```

### 3. User KYC Table
```sql
CREATE TABLE user_kyc (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Bank Details
    account_holder_name VARCHAR(255),
    account_number VARCHAR(50),
    ifsc_code VARCHAR(11),
    bank_name VARCHAR(255),
    
    -- UPI
    upi_id VARCHAR(100),
    
    -- PAN (for tax compliance on high payouts)
    pan_number VARCHAR(10),
    pan_verified BOOLEAN DEFAULT false,
    
    -- Address
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    
    -- Verification
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
    verified_at TIMESTAMP,
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4. Categories Table
```sql
CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon_url VARCHAR(500),
    banner_url VARCHAR(500),
    
    parent_id BIGINT REFERENCES categories(id), -- for subcategories
    
    type VARCHAR(20) NOT NULL, -- 'offer', 'product', 'both'
    display_order INT DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    seo_title VARCHAR(255),
    seo_description TEXT,
    seo_keywords TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_categories_slug ON categories(slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_type ON categories(type) WHERE is_active = true;
```

### 5. Merchants Table
```sql
CREATE TABLE merchants (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    
    logo_url VARCHAR(500),
    banner_url VARCHAR(500),
    website_url VARCHAR(500),
    
    -- Affiliate Details
    affiliate_network VARCHAR(50), -- 'admitad', 'vcommission', 'cuelinks', 'manual'
    affiliate_id VARCHAR(255),
    tracking_url_template TEXT, -- e.g., "https://track.example.com/click?id={affiliate_id}&subid={user_id}"
    
    -- Default Cashback
    default_cashback_type VARCHAR(20), -- 'percentage', 'fixed'
    default_cashback_value DECIMAL(10,2),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    priority INT DEFAULT 0, -- for sorting in featured section
    
    -- SEO
    seo_title VARCHAR(255),
    seo_description TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_merchants_slug ON merchants(slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_merchants_active ON merchants(is_active) WHERE deleted_at IS NULL;
```

### 6. Merchant Commissions Table
```sql
CREATE TABLE merchant_commissions (
    id BIGSERIAL PRIMARY KEY,
    merchant_id BIGINT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
    
    commission_type VARCHAR(20) NOT NULL, -- 'percentage', 'fixed'
    commission_value DECIMAL(10,2) NOT NULL,
    
    cashback_percentage DECIMAL(5,2), -- % of commission given as cashback
    
    valid_from DATE,
    valid_until DATE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_commissions_merchant ON merchant_commissions(merchant_id);
```

### 7. Offers Table
```sql
CREATE TABLE offers (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    
    merchant_id BIGINT NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
    
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    offer_type VARCHAR(20) NOT NULL, -- 'code', 'deal', 'sale'
    coupon_code VARCHAR(100), -- NULL for deals/sales
    
    -- Cashback
    cashback_type VARCHAR(20), -- 'percentage', 'fixed', NULL (use merchant default)
    cashback_value DECIMAL(10,2),
    max_cashback DECIMAL(10,2), -- cap for percentage cashback
    
    -- Tracking
    affiliate_url TEXT,
    terms_conditions TEXT,
    
    -- Validity
    starts_at TIMESTAMP,
    expires_at TIMESTAMP,
    
    -- Meta
    is_exclusive BOOLEAN DEFAULT false, -- CD Exclusive badge
    is_verified BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    
    views_count INT DEFAULT 0,
    clicks_count INT DEFAULT 0,
    conversion_count INT DEFAULT 0, -- successful cashback
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_offers_merchant ON offers(merchant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_offers_category ON offers(category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_offers_expiry ON offers(expires_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_offers_active ON offers(is_verified, starts_at, expires_at) 
    WHERE deleted_at IS NULL;
```

### 8. Offer Clicks Table
```sql
CREATE TABLE offer_clicks (
    id BIGSERIAL PRIMARY KEY,
    
    offer_id BIGINT NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    
    click_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(), -- for tracking
    
    ip_address INET,
    user_agent TEXT,
    referrer_url TEXT,
    
    device_type VARCHAR(20), -- 'mobile', 'desktop', 'tablet'
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_clicks_offer ON offer_clicks(offer_id);
CREATE INDEX idx_clicks_user ON offer_clicks(user_id);
CREATE INDEX idx_clicks_click_id ON offer_clicks(click_id);
CREATE INDEX idx_clicks_created ON offer_clicks(created_at);
```

### 9. Products Table (Gift Cards)
```sql
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL, -- e.g., EGVGBFLSCLPS001
    
    category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
    merchant_id BIGINT REFERENCES merchants(id) ON DELETE SET NULL, -- brand
    
    description TEXT,
    terms_conditions TEXT,
    
    image_url VARCHAR(500),
    gallery_images JSONB, -- array of image URLs
    
    -- Pricing
    base_price DECIMAL(10,2), -- used if no variants
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    
    -- Gift Card Specifics
    card_type VARCHAR(50), -- 'e-gift', 'physical', 'reload'
    delivery_method VARCHAR(50), -- 'email', 'sms', 'whatsapp', 'postal'
    validity_days INT, -- NULL = no expiry
    
    -- Stock
    is_in_stock BOOLEAN DEFAULT true,
    
    -- Meta
    is_featured BOOLEAN DEFAULT false,
    is_bestseller BOOLEAN DEFAULT false,
    priority INT DEFAULT 0,
    
    views_count INT DEFAULT 0,
    sales_count INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_products_slug ON products(slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_sku ON products(sku) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_category ON products(category_id) WHERE deleted_at IS NULL;
```

### 10. Product Variants Table
```sql
CREATE TABLE product_variants (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    
    denomination DECIMAL(10,2) NOT NULL, -- ₹100, ₹500, ₹1000, etc.
    
    cost_price DECIMAL(10,2), -- what we pay supplier
    selling_price DECIMAL(10,2) NOT NULL, -- what customer pays
    
    is_available BOOLEAN DEFAULT true,
    stock_quantity INT, -- NULL = unlimited/digital
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_variants_product ON product_variants(product_id);
```

### 11. Orders Table
```sql
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL, -- e.g., ORD-2025-001234
    
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Amounts
    subtotal DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    wallet_used DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    
    -- Promo
    promo_code VARCHAR(50),
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', 
    -- 'pending', 'paid', 'processing', 'fulfilled', 'failed', 'refunded', 'cancelled'
    
    payment_status VARCHAR(50) DEFAULT 'pending',
    -- 'pending', 'completed', 'failed', 'refunded'
    
    fulfillment_status VARCHAR(50) DEFAULT 'pending',
    -- 'pending', 'sent', 'delivered', 'failed'
    
    -- Delivery (for physical gift cards)
    delivery_email VARCHAR(255),
    delivery_mobile VARCHAR(15),
    delivery_address JSONB,
    
    -- Meta
    notes TEXT,
    admin_notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    cancelled_at TIMESTAMP
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
```

### 12. Order Items Table
```sql
CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    
    product_id BIGINT REFERENCES products(id) ON DELETE SET NULL,
    variant_id BIGINT REFERENCES product_variants(id) ON DELETE SET NULL,
    
    -- Snapshot at time of purchase
    product_name VARCHAR(255),
    product_sku VARCHAR(100),
    denomination DECIMAL(10,2),
    
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    
    -- Voucher Codes (for digital gift cards)
    voucher_codes JSONB, -- array of {code, pin, expiry, status}
    
    fulfillment_status VARCHAR(50) DEFAULT 'pending',
    delivered_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
```

### 13. Payments Table
```sql
CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    
    payment_method VARCHAR(50), -- 'razorpay', 'upi', 'card', 'netbanking', 'wallet'
    
    -- Gateway Details
    gateway VARCHAR(50), -- 'razorpay', 'phonepe', 'cashfree'
    gateway_order_id VARCHAR(255),
    gateway_payment_id VARCHAR(255),
    gateway_signature VARCHAR(500),
    
    status VARCHAR(50) DEFAULT 'initiated',
    -- 'initiated', 'success', 'failed', 'pending', 'refunded'
    
    gateway_response JSONB,
    error_message TEXT,
    
    refund_amount DECIMAL(10,2),
    refunded_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_gateway_order ON payments(gateway_order_id);
```

### 14. Wallet Transactions Table
```sql
CREATE TABLE wallet_transactions (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    amount DECIMAL(10,2) NOT NULL, -- positive = credit, negative = debit
    
    type VARCHAR(50) NOT NULL,
    -- 'cashback_earned', 'cashback_reversed', 'referral_bonus', 
    -- 'order_payment', 'withdrawal', 'admin_credit', 'admin_debit'
    
    reference_type VARCHAR(50), -- 'order', 'cashback_event', 'withdrawal', etc.
    reference_id BIGINT,
    
    balance_before DECIMAL(10,2) NOT NULL,
    balance_after DECIMAL(10,2) NOT NULL,
    
    description TEXT,
    admin_notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_wallet_user ON wallet_transactions(user_id);
CREATE INDEX idx_wallet_created ON wallet_transactions(created_at DESC);
CREATE INDEX idx_wallet_type ON wallet_transactions(type);
```

### 15. Cashback Events Table
```sql
CREATE TABLE cashback_events (
    id BIGSERIAL PRIMARY KEY,
    
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    offer_id BIGINT REFERENCES offers(id) ON DELETE SET NULL,
    click_id UUID REFERENCES offer_clicks(click_id),
    
    merchant_id BIGINT NOT NULL REFERENCES merchants(id) ON DELETE RESTRICT,
    
    -- Amounts
    transaction_amount DECIMAL(10,2), -- user's purchase amount
    commission_amount DECIMAL(10,2), -- what we earn from affiliate
    cashback_amount DECIMAL(10,2) NOT NULL, -- what user gets
    
    status VARCHAR(50) DEFAULT 'pending',
    -- 'pending', 'confirmed', 'rejected', 'reversed'
    
    -- Tracking
    affiliate_transaction_id VARCHAR(255),
    confirmed_at TIMESTAMP,
    paid_at TIMESTAMP,
    rejected_reason TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cashback_user ON cashback_events(user_id);
CREATE INDEX idx_cashback_status ON cashback_events(status);
CREATE INDEX idx_cashback_offer ON cashback_events(offer_id);
```

### 16. Withdrawals Table
```sql
CREATE TABLE withdrawals (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    
    amount DECIMAL(10,2) NOT NULL,
    
    method VARCHAR(50) NOT NULL, -- 'bank', 'upi', 'gift_voucher', 'mobile_recharge'
    
    -- Bank/UPI Details (from user_kyc or entered)
    destination_details JSONB,
    
    status VARCHAR(50) DEFAULT 'pending',
    -- 'pending', 'approved', 'processing', 'completed', 'rejected', 'failed'
    
    processed_by_admin_id BIGINT REFERENCES users(id),
    processed_at TIMESTAMP,
    
    rejection_reason TEXT,
    transaction_reference VARCHAR(255), -- UTR number, voucher code, etc.
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_withdrawals_user ON withdrawals(user_id);
CREATE INDEX idx_withdrawals_status ON withdrawals(status);
```

### 17. Referrals Table
```sql
CREATE TABLE referrals (
    id BIGSERIAL PRIMARY KEY,
    
    referrer_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referred_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    status VARCHAR(50) DEFAULT 'pending',
    -- 'pending', 'active', 'inactive'
    
    total_earned DECIMAL(10,2) DEFAULT 0.00, -- lifetime earnings from this referral
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activated_at TIMESTAMP, -- when referred user made first transaction
    
    UNIQUE(referrer_user_id, referred_user_id)
);

CREATE INDEX idx_referrals_referrer ON referrals(referrer_user_id);
CREATE INDEX idx_referrals_referred ON referrals(referred_user_id);
```

### 18. CMS Pages Table
```sql
### 19. Wallet Balances Table (Implemented)
```sql
CREATE TABLE wallet_balances (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_wallet_balances_user ON wallet_balances(user_id);
```

### 20. Gift Cards Table (Optional if separate from products)
```sql
CREATE TABLE gift_cards (
        id BIGSERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        initial_value DECIMAL(10,2) NOT NULL,
        remaining_value DECIMAL(10,2) NOT NULL,
        user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
        expires_at TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_gift_cards_user ON gift_cards(user_id);
```

### 21. Payouts Table (Implemented)
```sql
CREATE TABLE payouts (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        amount DECIMAL(10,2) NOT NULL,
        method VARCHAR(50) NOT NULL,
        reference VARCHAR(120),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_payouts_user ON payouts(user_id);
```

### 22. Support Tickets Table (Implemented)
```sql
CREATE TABLE support_tickets (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        subject VARCHAR(255) NOT NULL,
        status VARCHAR(30) DEFAULT 'open',
        priority VARCHAR(20) DEFAULT 'normal',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_support_tickets_user ON support_tickets(user_id);
```

### 23. Notifications Table (Implemented)
```sql
CREATE TABLE notifications (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(120) NOT NULL,
        body VARCHAR(500) NOT NULL,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_notifications_user ON notifications(user_id);
```

### 24. Audit Logs Table (Implemented)
```sql
CREATE TABLE audit_logs (
        id BIGSERIAL PRIMARY KEY,
        actor_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(120) NOT NULL,
        entity_type VARCHAR(60),
        entity_id BIGINT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
```

### 25. Access Control Tables (Implemented)
```sql
CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(120) UNIQUE NOT NULL,
    slug VARCHAR(140) UNIQUE NOT NULL,
    description VARCHAR(255),
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE permissions (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(160) UNIQUE NOT NULL,
    description VARCHAR(255)
);

CREATE TABLE role_permissions (
    id BIGSERIAL PRIMARY KEY,
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id BIGINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX idx_role_permissions_unique ON role_permissions(role_id, permission_id);

CREATE TABLE departments (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(120) UNIQUE NOT NULL,
    slug VARCHAR(140) UNIQUE NOT NULL,
    description VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_roles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX idx_user_roles_unique ON user_roles(user_id, role_id);

CREATE TABLE user_departments (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    department_id BIGINT NOT NULL REFERENCES departments(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX idx_user_departments_unique ON user_departments(user_id, department_id);
```

### 26. Future: Offer Views (Planned)
```sql
CREATE TABLE offer_views (
    id BIGSERIAL PRIMARY KEY,
    offer_id BIGINT NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_offer_views_offer ON offer_views(offer_id);
```

### 27. Future: Inventory (Planned)
```sql
CREATE TABLE inventory (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id BIGINT REFERENCES product_variants(id) ON DELETE CASCADE,
    quantity INT NOT NULL,
    reserved INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_inventory_product ON inventory(product_id);
```

### 28. Future: SEO Redirects (Planned)
```sql
CREATE TABLE seo_redirects (
    id BIGSERIAL PRIMARY KEY,
    source_path VARCHAR(500) NOT NULL,
    target_path VARCHAR(500) NOT NULL,
    http_status INT DEFAULT 301,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX idx_seo_redirects_source ON seo_redirects(source_path);
```

### 29. Future: User Sessions Enhancement (Planned)
Add columns for refresh token rotation & invalidation reasons.

### 30. Future: Materialized Views (Analytics) (Planned)
Examples: mv_daily_cashback_summary, mv_top_merchants, mv_conversion_funnel.

### 31. Partitioning Strategy (Offer Clicks)
Monthly partitions by created_at for high-volume writes.

### 32. Additional Indices Considerations
- Partial indexes on active offers (is_verified AND now() BETWEEN starts_at AND expires_at)
- GIN index on products.gallery_images JSONB

### 33. Row-Level Security (RLS) (Planned)
Will be enabled for: user_sessions, user_kyc, wallet_transactions, support_tickets.

### 34. Encryption (Planned)
Sensitive fields (PAN, bank details) via application-level encryption before insert.
CREATE TABLE cms_pages (
    id BIGSERIAL PRIMARY KEY,
    
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    
    content TEXT,
    excerpt TEXT,
    
    page_type VARCHAR(50), -- 'faq', 'terms', 'privacy', 'blog', 'static'
    
    seo_title VARCHAR(255),
    seo_description TEXT,
    seo_keywords TEXT,
    
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMP,
    
    created_by_user_id BIGINT REFERENCES users(id),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cms_slug ON cms_pages(slug) WHERE is_published = true;
```

---

## 🔐 Security Considerations

1. **Password Hashing**: Use pbkdf2_sha256 (current) -> migrate to bcrypt ≥ 12 rounds in production
2. **PII Encryption**: Encrypt bank details, PAN in `user_kyc`
3. **Row-Level Security**: Users can only access their own data
4. **SQL Injection**: Use parameterized queries (SQLAlchemy ORM)
5. **Audit Logs**: Track all admin actions (audit_logs) including actor, entity, metadata
6. **Access Control**: Role + permission matrix enforced in service layer
7. **Rate Limiting**: Redis-based sliding window for auth, offers, referrals (planned)

---

## 📊 Performance Optimizations

1. **Partitioning**: Partition `offer_clicks` by month (range partitioning) + optionally `audit_logs`
2. **Materialized Views**: For dashboard analytics
3. **Redis Cache**: Hot offers, user sessions, rate limits
4. **Connection Pooling**: PgBouncer in production

---

**Next Document**: `03-API-SPECIFICATION.md` - Complete API endpoints list (will reflect expanded domains)
