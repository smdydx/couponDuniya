#!/usr/bin/env python3
"""
Complete seed script for ALL CouponAli tables
Fills every column with realistic test data
"""
import os
import sys
from pathlib import Path
from datetime import datetime, timedelta
import random
import uuid
from decimal import Decimal
import json

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import create_engine, select, func
from sqlalchemy.orm import Session
from app.config import get_settings
from app.models import (
    User, Category, Merchant, MerchantCategory, MerchantCommission,
    Offer, OfferClick, OfferView, Product, ProductVariant,
    Order, WalletBalance, WalletTransaction, Banner, GiftCard,
    PromoCode, CashbackRule, CashbackEvent, Referral,
    SupportTicket, Notification, AuditLog,
    NewsletterSubscriber, NewsletterCampaign,
    AnalyticsEvent, UserMetric,
    ABTestExperiment, ABTestVariant,
    AffiliateClick, AffiliateTransaction,
    WithdrawalRequest,
)
from app.security import get_password_hash

settings = get_settings()
database_url = settings.DATABASE_URL
if database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgresql+psycopg://", 1)
engine = create_engine(database_url)

def seed_all():
    with Session(engine) as session:
        print("🌱 Seeding ALL tables with comprehensive data...\n")
        
        now = datetime.utcnow()
        
        # Get existing users
        users = list(session.scalars(select(User)).all())
        if not users:
            print("❌ No users found. Run seed_complete.py first!")
            return
        
        admin_user = session.scalar(select(User).where(User.email == "admin@couponali.com"))
        test_user = session.scalar(select(User).where(User.email == "user@example.com"))
        
        # Get existing merchants
        merchants = list(session.scalars(select(Merchant)).all())
        if not merchants:
            print("❌ No merchants found. Run seed_complete.py first!")
            return
        
        # Get existing offers
        offers = list(session.scalars(select(Offer)).all())
        
        # Get existing products
        products = list(session.scalars(select(Product)).all())
        product_variants = list(session.scalars(select(ProductVariant)).all())
        
        # ============================================
        # 1. PROMO CODES
        # ============================================
        print("🎟️  Creating promo codes...")
        promo_codes_data = [
            {"code": "WELCOME50", "discount_type": "percentage", "discount_value": 50, "max_discount": 500, "min_order": 1000, "usage_limit": 1000, "description": "Welcome offer - 50% off"},
            {"code": "FLAT100", "discount_type": "fixed", "discount_value": 100, "max_discount": 100, "min_order": 500, "usage_limit": 500, "description": "Flat ₹100 off"},
            {"code": "CASHBACK20", "discount_type": "percentage", "discount_value": 20, "max_discount": 200, "min_order": 800, "usage_limit": 2000, "description": "20% Cashback"},
            {"code": "FIRSTORDER", "discount_type": "percentage", "discount_value": 30, "max_discount": 300, "min_order": 600, "usage_limit": 5000, "description": "First order special discount"},
            {"code": "DIWALI500", "discount_type": "fixed", "discount_value": 500, "max_discount": 500, "min_order": 2000, "usage_limit": 1000, "description": "Diwali special offer"},
        ]
        
        for pc_data in promo_codes_data:
            existing = session.scalar(select(PromoCode).where(PromoCode.code == pc_data["code"]))
            if not existing:
                pc = PromoCode(
                    code=pc_data["code"],
                    discount_type=pc_data["discount_type"],
                    discount_value=pc_data["discount_value"],
                    max_discount=pc_data["max_discount"],
                    min_order_amount=pc_data["min_order"],
                    usage_limit=pc_data["usage_limit"],
                    usage_count=random.randint(0, 100),
                    description=pc_data["description"],
                    is_active=True,
                    valid_from=now - timedelta(days=10),
                    valid_until=now + timedelta(days=90),
                )
                session.add(pc)
        session.commit()
        print("✓ Promo codes created")
        
        # ============================================
        # 2. CASHBACK RULES
        # ============================================
        print("💰 Creating cashback rules...")
        for merchant in merchants[:5]:
            existing = session.scalar(select(CashbackRule).where(CashbackRule.merchant_id == merchant.id))
            if not existing:
                rule = CashbackRule(
                    merchant_id=merchant.id,
                    rule_name=f"{merchant.name} Cashback Rule",
                    rate_percent=round(random.uniform(2, 10), 2),
                    max_cashback=500.00,
                    is_active=True,
                )
                session.add(rule)
        session.commit()
        print("✓ Cashback rules created")
        
        # ============================================
        # 3. ORDERS
        # ============================================
        print("📦 Creating orders...")
        statuses = ["pending", "confirmed", "processing", "shipped", "delivered", "completed"]
        
        for i in range(20):
            user = random.choice(users)
            merchant = random.choice(merchants)
            
            order_ref = f"ORD{now.strftime('%Y%m%d')}{str(i+1).zfill(5)}"
            existing = session.scalar(select(Order).where(Order.order_reference == order_ref))
            if not existing:
                order = Order(
                    user_id=user.id,
                    merchant_id=merchant.id,
                    order_reference=order_ref,
                    external_order_id=f"EXT-{uuid.uuid4().hex[:10].upper()}",
                    amount=round(random.uniform(500, 5000), 2),
                    cashback_amount=round(random.uniform(10, 100), 2),
                    status=random.choice(statuses),
                    created_at=now - timedelta(days=random.randint(0, 60)),
                )
                session.add(order)
        session.commit()
        print("✓ Orders created")
        
        # ============================================
        # 4. CASHBACK EVENTS
        # ============================================
        print("💵 Creating cashback events...")
        orders = list(session.scalars(select(Order)).all())
        for order in orders[:15]:
            existing = session.scalar(select(CashbackEvent).where(CashbackEvent.order_id == order.id))
            if not existing:
                event = CashbackEvent(
                    user_id=order.user_id,
                    order_id=order.id,
                    amount=Decimal(str(random.uniform(10, 200))),
                    status=random.choice(["pending", "confirmed", "credited"]),
                    created_at=order.created_at,
                    confirmed_at=order.created_at + timedelta(days=7) if random.random() > 0.3 else None,
                )
                session.add(event)
        session.commit()
        print("✓ Cashback events created")
        
        # ============================================
        # 5. REFERRALS
        # ============================================
        print("👥 Creating referrals...")
        for i, user in enumerate(users[1:], 1):
            referrer = users[0]  # Admin is the referrer
            existing = session.scalar(select(Referral).where(Referral.referred_id == user.id))
            if not existing:
                referral = Referral(
                    referrer_id=referrer.id,
                    referred_id=user.id,
                    referral_code_used=referrer.referral_code or f"REF{uuid.uuid4().hex[:6].upper()}",
                    status=random.choice(["pending", "completed", "rewarded"]),
                    bonus_amount=100.00,
                    bonus_paid=random.random() > 0.5,
                    created_at=now - timedelta(days=random.randint(1, 30)),
                    completed_at=now - timedelta(days=random.randint(0, 7)) if random.random() > 0.5 else None,
                )
                session.add(referral)
        session.commit()
        print("✓ Referrals created")
        
        # ============================================
        # 6. SUPPORT TICKETS
        # ============================================
        print("🎫 Creating support tickets...")
        ticket_subjects = [
            "Cashback not received",
            "Order issue",
            "Payment failed but amount deducted",
            "Gift card not delivered",
            "Account verification issue",
            "Withdrawal pending",
            "Coupon not working",
            "Refund request",
        ]
        for i in range(10):
            user = random.choice(users)
            ticket = SupportTicket(
                user_id=user.id,
                subject=random.choice(ticket_subjects),
                status=random.choice(["open", "in_progress", "resolved", "closed"]),
                priority=random.choice(["low", "normal", "high", "urgent"]),
                created_at=now - timedelta(days=random.randint(0, 30)),
            )
            session.add(ticket)
        session.commit()
        print("✓ Support tickets created")
        
        # ============================================
        # 7. NOTIFICATIONS
        # ============================================
        print("🔔 Creating notifications...")
        notification_titles = [
            "Your cashback has been credited!",
            "Order shipped successfully",
            "New exclusive offer available",
            "Welcome to CouponAli!",
            "Your friend just signed up",
            "Flash sale starting now!",
            "Withdrawal processed",
        ]
        for user in users:
            for i in range(3):
                notif = Notification(
                    user_id=user.id,
                    title=random.choice(notification_titles),
                    body=f"This is a sample notification message #{i+1} for user {user.email}. Check out the latest updates and offers!",
                    is_read=random.random() > 0.5,
                    created_at=now - timedelta(days=random.randint(0, 14)),
                )
                session.add(notif)
        session.commit()
        print("✓ Notifications created")
        
        # ============================================
        # 8. NEWSLETTER SUBSCRIBERS
        # ============================================
        print("📧 Creating newsletter subscribers...")
        for i in range(15):
            email = f"subscriber{i+1}@example.com"
            existing = session.scalar(select(NewsletterSubscriber).where(NewsletterSubscriber.email == email))
            if not existing:
                sub = NewsletterSubscriber(
                    email=email,
                    name=f"Subscriber {i+1}",
                    status=random.choice(["active", "unsubscribed"]),
                    subscribed_at=now - timedelta(days=random.randint(0, 90)),
                    source=random.choice(["website", "popup", "checkout", "footer"]),
                )
                session.add(sub)
        session.commit()
        print("✓ Newsletter subscribers created")
        
        # ============================================
        # 9. NEWSLETTER CAMPAIGNS
        # ============================================
        print("📰 Creating newsletter campaigns...")
        campaign_titles = [
            "Weekly Deals Roundup",
            "Flash Sale Alert",
            "New Merchants Added",
            "Holiday Special Offers",
            "Cashback Bonus Week",
        ]
        for i, title in enumerate(campaign_titles):
            existing = session.scalar(select(NewsletterCampaign).where(NewsletterCampaign.subject == title))
            if not existing:
                campaign = NewsletterCampaign(
                    name=f"Campaign {i+1}",
                    subject=title,
                    html_content=f"<h1>{title}</h1><p>Check out our amazing offers this week!</p>",
                    status=random.choice(["draft", "scheduled", "sent"]),
                    send_at=now + timedelta(days=random.randint(1, 7)) if random.random() > 0.5 else None,
                    sent_at=now - timedelta(days=random.randint(1, 14)) if random.random() > 0.5 else None,
                    created_at=now - timedelta(days=random.randint(1, 30)),
                )
                session.add(campaign)
        session.commit()
        print("✓ Newsletter campaigns created")
        
        # ============================================
        # 10. OFFER CLICKS & VIEWS
        # ============================================
        print("👁️  Creating offer clicks and views...")
        for offer in offers:
            for _ in range(random.randint(5, 20)):
                user = random.choice(users) if random.random() > 0.3 else None
                click = OfferClick(
                    offer_id=offer.id,
                    user_id=user.id if user else None,
                    created_at=now - timedelta(days=random.randint(0, 30)),
                )
                session.add(click)
                
                view = OfferView(
                    offer_id=offer.id,
                    user_id=user.id if user else None,
                    created_at=now - timedelta(days=random.randint(0, 30)),
                )
                session.add(view)
        session.commit()
        print("✓ Offer clicks and views created")
        
        # ============================================
        # 11. ANALYTICS EVENTS
        # ============================================
        print("📊 Creating analytics events...")
        event_names = ["page_view", "click", "purchase", "signup", "login", "search", "cart_add", "checkout"]
        for i in range(50):
            user = random.choice(users) if random.random() > 0.4 else None
            event = AnalyticsEvent(
                user_id=user.id if user else None,
                event_name=random.choice(event_names),
                event_category=random.choice(["engagement", "conversion", "navigation"]),
                properties=json.dumps({"page": f"/page-{random.randint(1, 10)}", "value": random.randint(1, 100)}),
                session_id=f"sess_{uuid.uuid4().hex[:12]}",
                page_url=f"https://couponali.com/page-{random.randint(1, 10)}",
                referrer="https://google.com",
                device_type=random.choice(["desktop", "mobile", "tablet"]),
                browser=random.choice(["Chrome", "Firefox", "Safari"]),
                os=random.choice(["Windows", "macOS", "Android", "iOS"]),
                country="IN",
                city=random.choice(["Mumbai", "Delhi", "Bangalore", "Chennai"]),
                ip_address=f"192.168.1.{random.randint(1, 255)}",
                created_at=now - timedelta(days=random.randint(0, 30)),
            )
            session.add(event)
        session.commit()
        print("✓ Analytics events created")
        
        # ============================================
        # 12. USER METRICS
        # ============================================
        print("📈 Creating user metrics...")
        for user in users:
            existing = session.scalar(select(UserMetric).where(UserMetric.user_id == user.id))
            if not existing:
                metric = UserMetric(
                    user_id=user.id,
                    total_sessions=random.randint(5, 100),
                    total_page_views=random.randint(20, 500),
                    avg_session_duration=random.uniform(60, 600),
                    last_active_at=now - timedelta(days=random.randint(0, 7)),
                    total_orders=random.randint(0, 20),
                    total_spent=random.uniform(0, 50000),
                    avg_order_value=random.uniform(500, 2000),
                    total_cashback_earned=random.uniform(0, 2000),
                    favorite_category=random.choice(["fashion", "electronics", "food-dining"]),
                    favorite_merchant=random.choice([m.name for m in merchants]),
                    purchase_frequency=random.choice(["daily", "weekly", "monthly"]),
                    recency_days=random.randint(0, 60),
                    frequency_score=random.randint(1, 5),
                    monetary_score=random.randint(1, 5),
                    rfm_segment=random.choice(["Champions", "Loyal", "Potential", "At Risk", "New"]),
                    predicted_ltv=random.uniform(1000, 50000),
                    ltv_segment=random.choice(["high", "medium", "low"]),
                )
                session.add(metric)
        session.commit()
        print("✓ User metrics created")
        
        # ============================================
        # 13. WITHDRAWAL REQUESTS
        # ============================================
        print("💸 Creating withdrawal requests...")
        for i in range(8):
            user = random.choice(users)
            req = WithdrawalRequest(
                user_id=user.id,
                amount=round(random.uniform(100, 2000), 2),
                status=random.choice(["pending", "approved", "rejected", "completed"]),
                requested_at=now - timedelta(days=random.randint(0, 30)),
                processed_at=now - timedelta(days=random.randint(0, 7)) if random.random() > 0.5 else None,
            )
            session.add(req)
        session.commit()
        print("✓ Withdrawal requests created")
        
        # ============================================
        # 14. AFFILIATE CLICKS & TRANSACTIONS
        # ============================================
        print("🔗 Creating affiliate data...")
        networks = ["admitad", "cuelinks", "vcommission", "direct"]
        for merchant in merchants[:5]:
            for _ in range(random.randint(3, 10)):
                user = random.choice(users) if random.random() > 0.4 else None
                offer = random.choice(offers) if offers and random.random() > 0.3 else None
                
                click = AffiliateClick(
                    user_id=user.id if user else None,
                    merchant_id=merchant.id,
                    offer_id=offer.id if offer else None,
                    network=random.choice(networks),
                    external_click_id=f"click_{uuid.uuid4().hex[:12]}",
                    source=random.choice(["web", "mobile", "email"]),
                    created_at=now - timedelta(days=random.randint(0, 30)),
                )
                session.add(click)
        session.commit()
        
        affiliate_clicks = list(session.scalars(select(AffiliateClick)).all())
        for click in affiliate_clicks[:10]:
            existing = session.scalar(select(AffiliateTransaction).where(AffiliateTransaction.click_id == click.id))
            if not existing:
                trans = AffiliateTransaction(
                    user_id=click.user_id,
                    click_id=click.id,
                    merchant_id=click.merchant_id,
                    offer_id=click.offer_id,
                    network=click.network,
                    external_transaction_id=f"trans_{uuid.uuid4().hex[:12]}",
                    status=random.choice(["pending", "confirmed", "rejected"]),
                    amount=Decimal(str(random.uniform(100, 5000))),
                    currency="INR",
                    created_at=click.created_at + timedelta(hours=random.randint(1, 48)),
                    imported_at=now,
                )
                session.add(trans)
        session.commit()
        print("✓ Affiliate data created")
        
        # ============================================
        # 15. AB TEST EXPERIMENTS
        # ============================================
        print("🧪 Creating A/B test experiments...")
        experiments_data = [
            {"name": "Homepage Hero Banner", "description": "Test different hero banner designs"},
            {"name": "Checkout Button Color", "description": "Test green vs orange checkout button"},
            {"name": "Product Card Layout", "description": "Test grid vs list view"},
        ]
        for exp_data in experiments_data:
            existing = session.scalar(select(ABTestExperiment).where(ABTestExperiment.name == exp_data["name"]))
            if not existing:
                exp = ABTestExperiment(
                    name=exp_data["name"],
                    description=exp_data["description"],
                    status=random.choice(["draft", "running", "completed"]),
                    start_date=now - timedelta(days=random.randint(0, 14)),
                    end_date=now + timedelta(days=random.randint(7, 30)),
                    created_at=now - timedelta(days=random.randint(14, 30)),
                )
                session.add(exp)
                session.flush()
                
                # Add variants
                for j, variant_name in enumerate(["Control", "Variant A"]):
                    variant = ABTestVariant(
                        experiment_id=exp.id,
                        name=variant_name,
                        description=f"{variant_name} for {exp_data['name']}",
                        is_control=(j == 0),
                        traffic_weight=0.5,
                        impressions=random.randint(100, 1000),
                        conversions=random.randint(10, 100),
                        conversion_rate=random.uniform(0.05, 0.15),
                        total_revenue=random.uniform(1000, 10000),
                        avg_revenue_per_user=random.uniform(50, 200),
                    )
                    session.add(variant)
        session.commit()
        print("✓ A/B test experiments created")
        
        # ============================================
        # 16. AUDIT LOGS
        # ============================================
        print("📝 Creating audit logs...")
        actions = ["create", "update", "delete", "login", "logout", "export"]
        entities = ["user", "order", "merchant", "offer", "product", "withdrawal"]
        for i in range(20):
            user = random.choice(users)
            log = AuditLog(
                actor_user_id=user.id,
                action=random.choice(actions),
                entity_type=random.choice(entities),
                entity_id=random.randint(1, 100),
                meta={"old_status": "pending", "new_status": "active", "ip": f"192.168.1.{random.randint(1, 255)}"},
                created_at=now - timedelta(days=random.randint(0, 30)),
            )
            session.add(log)
        session.commit()
        print("✓ Audit logs created")
        
        # ============================================
        # 17. MERCHANT COMMISSIONS
        # ============================================
        print("💼 Creating merchant commissions...")
        for merchant in merchants:
            existing = session.scalar(select(MerchantCommission).where(MerchantCommission.merchant_id == merchant.id))
            if not existing:
                commission = MerchantCommission(
                    merchant_id=merchant.id,
                    commission_type="percentage",
                    commission_value=round(random.uniform(1, 8), 2),
                    cashback_percentage=round(random.uniform(1, 5), 2),
                    valid_from=(now - timedelta(days=60)).date(),
                    valid_until=(now + timedelta(days=365)).date(),
                )
                session.add(commission)
        session.commit()
        print("✓ Merchant commissions created")
        
        # ============================================
        # FINAL SUMMARY
        # ============================================
        print("\n" + "="*60)
        print("✅ ALL TABLES SEEDED SUCCESSFULLY!")
        print("="*60)
        
        # Count records
        print("\n📊 Record Counts:")
        tables = [
            ("Users", User),
            ("Categories", Category),
            ("Merchants", Merchant),
            ("Offers", Offer),
            ("Products", Product),
            ("Orders", Order),
            ("Promo Codes", PromoCode),
            ("Cashback Rules", CashbackRule),
            ("Cashback Events", CashbackEvent),
            ("Referrals", Referral),
            ("Support Tickets", SupportTicket),
            ("Notifications", Notification),
            ("Newsletter Subscribers", NewsletterSubscriber),
            ("Analytics Events", AnalyticsEvent),
            ("Withdrawal Requests", WithdrawalRequest),
            ("Affiliate Clicks", AffiliateClick),
            ("User Metrics", UserMetric),
        ]
        
        for name, model in tables:
            count = session.scalar(select(func.count()).select_from(model))
            print(f"  • {name}: {count}")
        
        print("\n📋 Admin Credentials:")
        print("  Email: admin@couponali.com")
        print("  Password: admin123")

if __name__ == "__main__":
    seed_all()
