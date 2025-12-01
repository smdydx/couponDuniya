"""Email & SMS worker for processing jobs from Redis queues with real provider integration.

This worker:
- Polls email and SMS queues via BLPOP
- Sends emails via SendGrid API
- Sends SMS via MSG91 API
- Retries failed jobs up to MAX_ATTEMPTS
- Moves permanently failed jobs to DLQ

Usage:
    python -m workers.email_sms_worker

Environment Variables:
    SENDGRID_API_KEY - SendGrid API key
    FROM_EMAIL - Sender email address
    FROM_NAME - Sender name
    MSG91_AUTH_KEY - MSG91 authentication key
    MSG91_SENDER_ID - MSG91 sender ID
    MSG91_TEMPLATE_ID - MSG91 default template ID
"""
from __future__ import annotations

import json
import logging
import os
import sys
import time
from datetime import datetime, timezone
from typing import Callable

import httpx

from app.redis_client import redis_client, rk

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)

# Queue configuration
EMAIL_QUEUE = rk("queue", "email")
SMS_QUEUE = rk("queue", "sms")
EMAIL_PROCESSING = rk("queue", "email", "processing")
SMS_PROCESSING = rk("queue", "sms", "processing")
EMAIL_DLQ = rk("queue", "email", "dlq")
SMS_DLQ = rk("queue", "sms", "dlq")

MAX_ATTEMPTS = 3
POLL_TIMEOUT_SECONDS = 2

# Provider configuration
SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@couponali.com")
FROM_NAME = os.getenv("FROM_NAME", "CouponAli")

MSG91_AUTH_KEY = os.getenv("MSG91_AUTH_KEY")
MSG91_SENDER_ID = os.getenv("MSG91_SENDER_ID", "COUPON")
MSG91_TEMPLATE_ID = os.getenv("MSG91_TEMPLATE_ID")


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _process_email(job: dict) -> None:
    """Send email via SendGrid API."""
    email_type = job.get("type", "generic")
    to_email = job.get("to")
    data = job.get("data", {})
    
    logger.info(f"Processing email: type={email_type}, to={to_email}")
    
    if not SENDGRID_API_KEY:
        logger.warning("SendGrid API key not configured - email logged only")
        logger.info(f"[DEV] Would send {email_type} email to {to_email}")
        return
    
    try:
        # Get email subject and HTML content
        subject = _get_email_subject(email_type, data)
        html_content = _get_email_html(email_type, data)
        
        # Send via SendGrid
        response = httpx.post(
            "https://api.sendgrid.com/v3/mail/send",
            headers={
                "Authorization": f"Bearer {SENDGRID_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "personalizations": [{"to": [{"email": to_email}]}],
                "from": {"email": FROM_EMAIL, "name": FROM_NAME},
                "subject": subject,
                "content": [{"type": "text/html", "value": html_content}],
            },
            timeout=30,
        )
        
        if response.status_code not in (200, 202):
            raise Exception(f"SendGrid API error: {response.status_code} - {response.text}")
        
        logger.info(f"✅ Email sent successfully to {to_email}")
    
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        raise


def _process_sms(job: dict) -> None:
    """Send SMS via MSG91 API."""
    sms_type = job.get("type", "generic")
    mobile = job.get("mobile")
    data = job.get("data", {})
    
    logger.info(f"Processing SMS: type={sms_type}, mobile={mobile}")
    
    if not MSG91_AUTH_KEY:
        logger.warning("MSG91 API key not configured - SMS logged only")
        logger.info(f"[DEV] Would send {sms_type} SMS to {mobile}")
        return
    
    try:
        # Get SMS message
        message = _get_sms_message(sms_type, data)
        
        # Send via MSG91
        response = httpx.post(
            "https://api.msg91.com/api/v5/flow/",
            headers={
                "authkey": MSG91_AUTH_KEY,
                "Content-Type": "application/json",
            },
            json={
                "flow_id": MSG91_TEMPLATE_ID,
                "sender": MSG91_SENDER_ID,
                "mobiles": mobile.replace("+91", ""),
                "VAR1": message,
                **data,
            },
            timeout=30,
        )
        
        if response.status_code != 200:
            raise Exception(f"MSG91 API error: {response.status_code} - {response.text}")
        
        logger.info(f"✅ SMS sent successfully to {mobile}")
    
    except Exception as e:
        logger.error(f"Failed to send SMS to {mobile}: {e}")
        raise


def _get_email_subject(email_type: str, data: dict) -> str:
    """Get email subject based on type."""
    subjects = {
        "welcome": "Welcome to CouponAli! 🎉",
        "otp": f"Your OTP: {data.get('otp', 'XXXXXX')}",
        "order_confirmation": f"Order Confirmed - {data.get('order_number', 'XXXXXX')}",
        "cashback_confirmed": "Cashback Credited to Your Wallet 💰",
        "withdrawal_processed": "Withdrawal Processed Successfully ✅",
        "password_reset": "Reset Your Password",
        "gift_card_delivery": "Your Gift Card Code is Ready 🎁",
    }
    return subjects.get(email_type, "Notification from CouponAli")


def _get_email_html(email_type: str, data: dict) -> str:
    """Get email HTML content based on type."""
    templates = {
        "welcome": f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #4F46E5;">Welcome to CouponAli! 🎉</h1>
                <p>Hi {data.get('user_name', 'there')},</p>
                <p>Thank you for joining CouponAli - India's best cashback & coupon platform!</p>
                <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3>Get Started:</h3>
                    <ul>
                        <li>Browse 1000+ stores and offers</li>
                        <li>Get cashback on every purchase</li>
                        <li>Redeem your earnings via UPI/Bank</li>
                    </ul>
                </div>
                {f'<div style="background: #DBEAFE; padding: 20px; border-radius: 8px; margin: 20px 0;"><h3>Verify Your Email</h3><p>Click the button below to verify your email address:</p><a href="{data.get("verification_url")}" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0;">Verify Email</a><p style="font-size: 12px; color: #666;">Link expires in 24 hours</p></div>' if data.get('verification_url') else ''}
                <p>Happy saving!<br>Team CouponAli</p>
            </div>
        """,
        "otp": f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #4F46E5;">Your OTP Code</h1>
                <p>Hi {data.get('user_name', 'there')},</p>
                <p>Your one-time password (OTP) is:</p>
                <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                    <h2 style="font-size: 32px; letter-spacing: 8px; color: #4F46E5; margin: 0;">{data.get('otp', 'XXXXXX')}</h2>
                </div>
                <p>This OTP is valid for 10 minutes.</p>
                <p style="color: #DC2626;">⚠️ Do not share this OTP with anyone.</p>
                <p>Team CouponAli</p>
            </div>
        """,
        "order_confirmation": f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #059669;">Order Confirmed! ✅</h1>
                <p>Hi {data.get('user_name', 'there')},</p>
                <p>Your order <strong>{data.get('order_number', 'XXXXXX')}</strong> has been confirmed.</p>
                <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3>Order Details:</h3>
                    <p><strong>Order Number:</strong> {data.get('order_number', 'XXXXXX')}</p>
                    <p><strong>Total Amount:</strong> ₹{data.get('total_amount', '0')}</p>
                    <p><strong>Items:</strong> {data.get('items_count', 1)}</p>
                </div>
                <p><a href="{data.get('order_url', '#')}" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Order & Vouchers</a></p>
                <p style="margin-top: 30px;">Thank you for your purchase!<br>Team CouponAli</p>
            </div>
        """,
        "cashback_confirmed": f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #059669;">Cashback Credited! 💰</h1>
                <p>Hi {data.get('user_name', 'there')},</p>
                <p>Great news! Your cashback has been credited to your wallet.</p>
                <div style="background: #D1FAE5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3>Cashback Details:</h3>
                    <p><strong>Amount:</strong> ₹{data.get('amount', '0')}</p>
                    <p><strong>Merchant:</strong> {data.get('merchant_name', 'N/A')}</p>
                    <p><strong>New Balance:</strong> ₹{data.get('wallet_balance', '0')}</p>
                </div>
                <p><a href="{data.get('wallet_url', '#')}" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Wallet</a></p>
                <p style="margin-top: 30px;">Keep shopping and earning!<br>Team CouponAli</p>
            </div>
        """,
        "withdrawal_processed": f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #059669;">Withdrawal Processed! ✅</h1>
                <p>Hi {data.get('user_name', 'there')},</p>
                <p>Your withdrawal request has been processed successfully.</p>
                <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3>Withdrawal Details:</h3>
                    <p><strong>Amount:</strong> ₹{data.get('amount', '0')}</p>
                    <p><strong>Method:</strong> {data.get('method', 'UPI')}</p>
                    <p><strong>Account:</strong> {data.get('account', 'N/A')}</p>
                </div>
                <p>The amount will be credited to your account within 24-48 hours.</p>
                <p style="margin-top: 30px;">Thank you!<br>Team CouponAli</p>
            </div>
        """,
        "gift_card_delivery": f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #4F46E5;">Your Gift Card 🎁</h1>
                <p>Hi {data.get('user_name', 'there')},</p>
                <p>Here is your gift card code. Use it at checkout to redeem its value.</p>
                <div style="background: #F3F4F6; padding: 24px; border-radius: 10px; margin: 20px 0; text-align: center;">
                    <h2 style="letter-spacing: 4px; font-size: 28px; color: #4F46E5; margin: 0;">{data.get('code','XXXX-XXXX')}</h2>
                    <p style="margin-top:12px; font-size:16px;">Value: <strong>₹{data.get('value','0')}</strong></p>
                </div>
                {f'<p>This card expires on <strong>{data.get("expires_at")}</strong>.</p>' if data.get('expires_at') else ''}
                <p style="font-size:12px; color:#555;">Keep this code secure. Treat it like cash.</p>
                <p>Happy saving!<br>Team CouponAli</p>
            </div>
        """,
        "password_reset": f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #4F46E5;">Reset Your Password</h1>
                <p>Hi {data.get('user_name', 'there')},</p>
                <p>We received a request to reset your password. Click the button below to choose a new one:</p>
                <div style="background: #EEF2FF; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                    <a href="{data.get('reset_url', '#')}" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
                    <p style="font-size: 12px; color: #555; margin-top: 12px;">Link expires in 30 minutes.</p>
                </div>
                <p>If you did not request this change, you can safely ignore this email.</p>
                <p>Stay secure,<br>Team CouponAli</p>
            </div>
        """,
    }
    return templates.get(email_type, f"<p>{data.get('message', 'Notification from CouponAli')}</p>")


def _get_sms_message(sms_type: str, data: dict) -> str:
    """Get SMS message based on type."""
    templates = {
        "otp": f"Your OTP for CouponAli is {data.get('otp', 'XXXXXX')}. Valid for 10 minutes. Do not share with anyone.",
        "order_confirmation": f"Order {data.get('order_number', 'XXXXXX')} confirmed! Amount: ₹{data.get('total_amount', '0')}. Your voucher codes are ready. Check your email or app.",
        "cashback_credited": f"₹{data.get('amount', '0')} cashback credited to your CouponAli wallet from {data.get('merchant_name', 'merchant')}. Total balance: ₹{data.get('wallet_balance', '0')}",
        "withdrawal_processed": f"Withdrawal of ₹{data.get('amount', '0')} processed successfully. It will be credited to your account within 24 hours.",
    }
    return templates.get(sms_type, data.get("message", "Notification from CouponAli"))


def _fail_job(queue_key: str, dlq_key: str, job_str: str, error: str) -> None:
    """Move a job to the dead letter queue."""
    job = json.loads(job_str)
def _fail_job(queue_key: str, dlq_key: str, job_str: str, error: str) -> None:
    """Move a job to the dead letter queue."""
    job = json.loads(job_str)
    job["failed_at"] = _now_iso()
    job["error"] = str(error)
    redis_client.rpush(dlq_key, json.dumps(job))
    logger.warning(f"Job moved to DLQ: {queue_key}")


def _work_single(queue_key: str, processing_key: str, dlq_key: str, handler: Callable[[dict], None]) -> bool:
    """Poll queue, process one job, handle errors and retries.
    
    Returns:
        bool: True if a job was processed, False if queue was empty
    """
    popped = redis_client.blpop(queue_key, timeout=POLL_TIMEOUT_SECONDS)
    if not popped:
        return False
    
    _, raw_job = popped
    job = json.loads(raw_job)
    attempts = job.get("attempts", 0)
    
    # Add to processing set
    redis_client.sadd(processing_key, raw_job)
    
    try:
        handler(job)
        logger.info(f"✅ Job completed successfully")
        
    except Exception as exc:
        attempts += 1
        logger.error(f"❌ Job failed (attempt {attempts}/{MAX_ATTEMPTS}): {exc}")
        
        if attempts >= MAX_ATTEMPTS:
            # Move to DLQ
            _fail_job(queue_key, dlq_key, raw_job, str(exc))
        else:
            # Retry: re-queue with incremented attempt count
            job["attempts"] = attempts
            redis_client.rpush(queue_key, json.dumps(job))
    
    finally:
        # Remove from processing set
        redis_client.srem(processing_key, raw_job)
    
    return True


def run_forever() -> None:
    """Main worker loop - polls both email and SMS queues."""
    logger.info("=== Starting Email/SMS Worker ===")
    logger.info(f"Email queue: {EMAIL_QUEUE}")
    logger.info(f"SMS queue: {SMS_QUEUE}")
    logger.info(f"Poll timeout: {POLL_TIMEOUT_SECONDS}s")
    logger.info(f"Max attempts: {MAX_ATTEMPTS}")
    
    if not SENDGRID_API_KEY:
        logger.warning("⚠️  SENDGRID_API_KEY not configured - emails will be logged only")
    
    if not MSG91_AUTH_KEY:
        logger.warning("⚠️  MSG91_AUTH_KEY not configured - SMS will be logged only")
    
    try:
        while True:
            # Process email queue
            email_processed = _work_single(
                EMAIL_QUEUE,
                EMAIL_PROCESSING,
                EMAIL_DLQ,
                _process_email,
            )
            
            # Process SMS queue
            sms_processed = _work_single(
                SMS_QUEUE,
                SMS_PROCESSING,
                SMS_DLQ,
                _process_sms,
            )
            
            # If no jobs were processed, sleep briefly to avoid tight loop
            if not email_processed and not sms_processed:
                time.sleep(0.1)
    
    except KeyboardInterrupt:
        logger.info("=== Worker stopped by user ===")
    except Exception as e:
        logger.error(f"=== Worker crashed: {e} ===", exc_info=True)
        raise


if __name__ == "__main__":
    run_forever()

