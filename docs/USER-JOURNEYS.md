# User Journey Flows (Text Wireframes)

These flows capture the key paths for shoppers, logged-in users, and admins. Use them as a blueprint for design/UX and QA.

## Guest → Purchase with Cashback
```mermaid
flowchart TD
  A[Landing Page] --> B[Browse Merchants/Offers]
  B --> C[Offer Detail]
  C --> D{Login/Signup?}
  D -- Yes --> E[Login/Register]
  D -- No --> F[CTA prompts login]
  E --> G[Click Out to Merchant]
  G --> H[Merchant Purchase]
  H --> I[Affiliate Network Tracks Click]
  I --> J[Cashback Pending Event]
  J --> K[User Sees Pending Cashback in Wallet]
  K --> L[Cashback Confirmed + Wallet Credit]
  L --> M[Optional Withdrawal]
```

## Gift Card Purchase (Logged-in)
```mermaid
flowchart TD
  A[Product Grid] --> B[Gift Card Detail]
  B --> C[Select Denomination/Quantity]
  C --> D[Add to Cart]
  D --> E[Cart Review]
  E --> F[Apply Promo / Wallet]
  F --> G[Create Order (Razorpay)]
  G --> H[Payment Success Webhook]
  H --> I[Voucher Codes Generated]
  I --> J[Email/SMS Delivery]
  J --> K[Order Detail Page Shows Codes]
```

## Withdrawal Flow
```mermaid
flowchart TD
  A[Wallet Page] --> B[Withdraw CTA]
  B --> C[Choose Method: UPI/Bank/Gift Card]
  C --> D[Submit Request]
  D --> E[Admin Queue Review]
  E --> F{Approve/Reject}
  F -- Approve --> G[Funds Sent + Notification]
  F -- Reject --> H[Refund to Wallet + Reason]
```

## Admin: Offer Lifecycle
```mermaid
flowchart TD
  A[Admin Dashboard] --> B[Create/Edit Offer]
  B --> C[Publish Offer]
  C --> D[Cache Invalidation Trigger]
  D --> E[Frontend Fetches New Offer]
  E --> F[Clicks Tracked via Redirector]
  F --> G[Affiliate Conversions → Cashback Sync]
  G --> H[Cashback Events → Wallet]
```

## Support / Recovery
```mermaid
flowchart TD
  A[User opens Support Page] --> B[Create Ticket]
  B --> C[Ticket queued to support dashboard]
  C --> D[Agent responds / resolves]
  D --> E[Email/SMS notification to user]
```
