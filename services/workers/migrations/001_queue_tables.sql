-- =====================================================
-- Queue Tables for Background Workers
-- Run this migration after the main database schema
-- =====================================================

-- Email Queue Table
CREATE TABLE IF NOT EXISTS email_queue (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    "to" VARCHAR(255) NOT NULL,
    data JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    attempts INT DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Index for fetching pending emails
CREATE INDEX IF NOT EXISTS idx_email_queue_status_created ON email_queue(status, created_at);

-- SMS Queue Table
CREATE TABLE IF NOT EXISTS sms_queue (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    data JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    attempts INT DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- Index for fetching pending SMS
CREATE INDEX IF NOT EXISTS idx_sms_queue_status_created ON sms_queue(status, created_at);

-- Offer Clicks Table (for redirector service)
CREATE TABLE IF NOT EXISTS offer_clicks (
    id SERIAL PRIMARY KEY,
    click_id UUID DEFAULT gen_random_uuid() UNIQUE,
    offer_id INT NOT NULL REFERENCES offers(id),
    user_id INT REFERENCES users(id),
    ip_address INET,
    user_agent TEXT,
    referrer_url TEXT,
    device_type VARCHAR(20) DEFAULT 'desktop',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index for click tracking and analytics
CREATE INDEX IF NOT EXISTS idx_offer_clicks_offer_id ON offer_clicks(offer_id);
CREATE INDEX IF NOT EXISTS idx_offer_clicks_user_id ON offer_clicks(user_id);
CREATE INDEX IF NOT EXISTS idx_offer_clicks_created ON offer_clicks(created_at);

-- Cashback Events Table (for affiliate sync)
CREATE TABLE IF NOT EXISTS cashback_events (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id),
    offer_id INT NOT NULL REFERENCES offers(id),
    click_id UUID REFERENCES offer_clicks(click_id),
    merchant_id INT NOT NULL REFERENCES merchants(id),
    transaction_amount DECIMAL(12, 2) NOT NULL,
    commission_amount DECIMAL(12, 2) NOT NULL,
    cashback_amount DECIMAL(12, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    affiliate_transaction_id VARCHAR(100) UNIQUE,
    affiliate_network VARCHAR(50),
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for cashback tracking
CREATE INDEX IF NOT EXISTS idx_cashback_events_user_id ON cashback_events(user_id);
CREATE INDEX IF NOT EXISTS idx_cashback_events_status ON cashback_events(status);
CREATE INDEX IF NOT EXISTS idx_cashback_events_affiliate_tx ON cashback_events(affiliate_transaction_id);

-- Add clicks_count column to offers if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'offers' AND column_name = 'clicks_count') THEN
        ALTER TABLE offers ADD COLUMN clicks_count INT DEFAULT 0;
    END IF;
END $$;

-- Add uuid column to offers if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'offers' AND column_name = 'uuid') THEN
        ALTER TABLE offers ADD COLUMN uuid UUID DEFAULT gen_random_uuid() UNIQUE;
    END IF;
END $$;

-- Add wallet columns to users if not exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'users' AND column_name = 'wallet_balance') THEN
        ALTER TABLE users ADD COLUMN wallet_balance DECIMAL(12, 2) DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'users' AND column_name = 'lifetime_earnings') THEN
        ALTER TABLE users ADD COLUMN lifetime_earnings DECIMAL(12, 2) DEFAULT 0;
    END IF;
END $$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_email_queue_updated_at ON email_queue;
CREATE TRIGGER update_email_queue_updated_at
    BEFORE UPDATE ON email_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sms_queue_updated_at ON sms_queue;
CREATE TRIGGER update_sms_queue_updated_at
    BEFORE UPDATE ON sms_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cashback_events_updated_at ON cashback_events;
CREATE TRIGGER update_cashback_events_updated_at
    BEFORE UPDATE ON cashback_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Sample data for testing (optional)
-- =====================================================

-- Insert a test email job
-- INSERT INTO email_queue (type, "to", data)
-- VALUES ('welcome', 'test@example.com', '{"user_name": "Test User"}');

-- Insert a test SMS job
-- INSERT INTO sms_queue (type, mobile, data)
-- VALUES ('otp', '+919876543210', '{"otp": "123456"}');
