# Merchant Partnership Plan

## Objectives
- Finalize partnership terms with key merchants for coupons, gift cards, and cashback attribution.
- Ensure tracking readiness (affiliate IDs, deeplinks, and attribution parameters) before launch.

## Target Merchants (Initial Wave)
- Amazon, Flipkart, Myntra, Swiggy, Zomato, BookMyShow, MakeMyTrip, Uber, Ajio, BigBasket, Nykaa, Tata Cliq, Croma, Pepperfry, Dominos, Reliance Trends, FirstCry, PharmEasy.

## Checklist
- [ ] Confirm affiliate network mappings (Admitad / VCommission / Cuelinks) per merchant.
- [ ] Obtain logos, brand assets, and usage guidelines.
- [ ] Confirm cashback/commission slabs and exclusivity (if any).
- [ ] Validate tracking URLs with our redirector (test clicks + conversions).
- [ ] Provide payout/settlement terms and payment windows.
- [ ] Add SLA for offer updates and deactivation of expired coupons.

## Draft Terms (Template)
- Commission: tiered by category/merchant; net of returns/cancellations.
- Attribution window: standard 30 days (or as provided by network).
- Payment terms: net-45 or network-defined; minimum payout thresholds per network.
- Data: daily/weekly performance reports; fraud checks; invalid traffic clawback.
- Branding: logo usage per merchant brand book; approval required for banners/hero placements.
- Support: merchant POC + escalation path; quarterly performance review.

## Next Actions
1) Map each merchant to network + program ID, add to affiliate_merchant_map table.
2) Generate test clicks via redirector and confirm conversions in each network.
3) Store approved commission rates in `merchant_commissions` and wire to cashback rules.
4) Get written confirmation (email/MOU) for live date and approved creatives.
