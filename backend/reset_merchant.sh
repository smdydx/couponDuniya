#!/bin/bash

# Database connection details
DB_HOST="127.0.0.1"
DB_PORT="5432"
DB_NAME="couponali"
DB_USER="coupon"
DB_PASS="hardik123"

USER_ID=2

echo "🔍 Checking current status for User ID: $USER_ID"
echo "================================================"

# Set password for psql
export PGPASSWORD="$DB_PASS"

# Check current user status
echo ""
echo "📋 Current User Status:"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT id, email, merchant_verification_status, merchant_verified, is_merchant, merchant_id 
FROM users 
WHERE id = $USER_ID;
"

# Check merchant applications
echo ""
echo "📦 Current Merchant Applications:"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT id, user_id, business_name, status, verification_status, created_at 
FROM merchants 
WHERE user_id = $USER_ID;
"

# Ask for confirmation
echo ""
echo "⚠️  This will:"
echo "   1. Delete all pending merchant applications for User $USER_ID"
echo "   2. Reset user's merchant verification status to 'not_applied'"
echo ""
read -p "Do you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Operation cancelled"
    exit 0
fi

echo ""
echo "🔄 Resetting merchant status..."

# Reset user status and delete pending applications
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << EOF
BEGIN;

-- Delete pending merchant applications
DELETE FROM merchants 
WHERE user_id = $USER_ID AND verification_status = 'pending';

-- Reset user status
UPDATE users 
SET merchant_verification_status = 'not_applied',
    merchant_verified = false,
    is_merchant = false,
    merchant_id = NULL
WHERE id = $USER_ID;

COMMIT;
EOF

echo ""
echo "✅ Status reset successfully!"
echo ""
echo "📋 New User Status:"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT id, email, merchant_verification_status, merchant_verified, is_merchant, merchant_id 
FROM users 
WHERE id = $USER_ID;
"

echo ""
echo "🎉 User can now apply as merchant again!"

# Unset password
unset PGPASSWORD
