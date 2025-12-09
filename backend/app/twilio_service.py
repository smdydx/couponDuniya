"""Twilio service for sending SMS and Email verification.

This module uses Replit's Twilio connector for sending verification emails and SMS.
"""
import logging
import os
import json
from typing import Tuple, Optional

import aiohttp  # Import aiohttp for async HTTP requests
from twilio.rest import Client  # Import Twilio Client

logger = logging.getLogger(__name__)


async def get_twilio_credentials():
    """Get Twilio credentials from environment variables or Replit connector."""
    # Try manual configuration first
    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    phone_number = os.getenv("TWILIO_PHONE_NUMBER")

    if account_sid and auth_token and phone_number:
        logger.info("Using manual Twilio credentials from .env")
        return {
            "account_sid": account_sid,
            "auth_token": auth_token,
            "phone_number": phone_number,
        }

    # Fall back to Replit connector if manual config not available
    try:
        connector_hostname = os.getenv("REPLIT_CONNECTORS_HOSTNAME")
        if not connector_hostname:
            logger.warning("No Twilio credentials found in .env or Replit connector")
            return None

        repl_identity = os.getenv("REPL_IDENTITY")
        if not repl_identity:
            logger.warning("REPL_IDENTITY not set - Twilio connector unavailable")
            return None

        connector_url = f"https://{connector_hostname}"
        headers = {
            "X-Replit-Renewal": os.getenv("WEB_REPL_RENEWAL", ""),
        }

        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{connector_url}/connectors/twilio/credentials",
                headers=headers,
                timeout=aiohttp.ClientTimeout(total=10)
            ) as response:
                if response.status != 200:
                    logger.error(f"Failed to get Twilio credentials: {response.status}")
                    return None

                data = await response.json()
                logger.info("Successfully fetched Twilio credentials from Replit connector")
                return {
                    "account_sid": data.get("account_sid"),
                    "auth_token": data.get("api_key_secret"),
                    "phone_number": data.get("phone_number"),
                }
    except Exception as e:
        logger.error(f"Error fetching Twilio credentials: {str(e)}")
        return None


async def get_twilio_client():
    """Get authenticated Twilio client."""
    credentials = await get_twilio_credentials()
    if not credentials:
        logger.error("Could not get Twilio credentials to create client.")
        return None
    return Client(
        credentials["account_sid"],
        credentials["auth_token"],  # Use 'auth_token' here as it's what's returned
        account_sid=credentials["account_sid"]
    )


async def send_verification_email(
    to_email: str,
    verification_url: str,
    user_name: str = "User"
) -> Tuple[bool, str]:
    """Send verification email using Twilio SendGrid.

    Note: Twilio connector provides SMS. For email, we'll use the built-in
    email service or SendGrid directly if configured.
    """
    from .email import email_service

    subject = "Verify Your Email - CouponAli"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #8b5cf6; margin: 0; font-size: 28px;">CouponAli</h1>
                <p style="color: #666; margin-top: 5px;">Save Money with Verified Coupons & Cashback</p>
            </div>

            <div style="background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 30px;">
                <h2 style="color: #ffffff; margin: 0 0 15px 0; font-size: 24px;">Verify Your Email</h2>
                <p style="color: #e0e0ff; margin: 0; font-size: 16px;">Hi {user_name}, please verify your email to continue</p>
            </div>

            <div style="text-align: center; margin-bottom: 30px;">
                <p style="color: #333; font-size: 16px; line-height: 1.6;">
                    Thank you for registering with CouponAli! To complete your registration and start saving money, please verify your email address by clicking the button below.
                </p>

                <a href="{verification_url}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-size: 18px; font-weight: bold; margin: 20px 0; box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);">
                    Verify Email Now
                </a>

                <p style="color: #999; font-size: 14px; margin-top: 20px;">
                    Or copy and paste this link in your browser:<br>
                    <span style="color: #8b5cf6; word-break: break-all;">{verification_url}</span>
                </p>
            </div>

            <div style="background-color: #f9f9f9; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <p style="color: #666; font-size: 14px; margin: 0;">
                    <strong>Important:</strong> This verification link will expire in 24 hours. If you did not create an account with CouponAli, please ignore this email.
                </p>
            </div>

            <div style="text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
                <p style="color: #999; font-size: 12px; margin: 0;">
                    &copy; 2025 CouponAli. All rights reserved.
                </p>
            </div>
        </div>
    </body>
    </html>
    """

    return email_service.send_email(to_email, subject, html_content)


async def send_verification_sms(
    to_phone: str,
    otp_code: str
) -> Tuple[bool, str]:
    """Send verification OTP via Twilio SMS."""
    try:
        client = await get_twilio_client()
        if not client:
            return False, "Twilio client not initialized"

        credentials = await get_twilio_credentials() # Fetch credentials again to get phone number
        if not credentials:
            return False, "Twilio credentials not available"

        from_phone = credentials.get("phone_number")
        if not from_phone:
            logger.error("Twilio phone number not configured")
            return False, "Twilio phone number not configured"

        message = client.messages.create(
            body=f"Your CouponAli verification code is: {otp_code}. Valid for 10 minutes. Do not share this code.",
            from_=from_phone,
            to=to_phone
        )

        logger.info(f"SMS sent to {to_phone}, SID: {message.sid}")
        return True, f"SMS sent: {message.sid}"

    except Exception as e:
        logger.exception(f"Failed to send SMS: {e}")
        return False, str(e)


async def check_email_verification_status(email: str) -> dict:
    """Check if email verification is pending and return status."""
    from .verification import is_email_verification_pending

    is_pending = is_email_verification_pending(email)

    return {
        "email": email,
        "verification_pending": is_pending,
        "message": "Verification email sent. Please check your inbox." if is_pending else "No pending verification"
    }