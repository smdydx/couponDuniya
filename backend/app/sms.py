"""SMS service for sending OTP and notifications via Twilio."""
import logging
import os
from typing import Optional
import phonenumbers
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException
from .config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)


def normalize_phone_number(mobile: str, default_region: str = "IN") -> str:
    """
    Normalize phone number to E.164 format.
    
    Args:
        mobile: Phone number in any format
        default_region: Default region code (IN for India)
        
    Returns:
        Phone number in E.164 format (e.g., +919876543210)
    """
    mobile = mobile.strip()
    
    if mobile.startswith("+"):
        try:
            parsed = phonenumbers.parse(mobile, None)
            if phonenumbers.is_valid_number(parsed):
                return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)
        except phonenumbers.NumberParseException:
            pass
        return mobile
    
    mobile = mobile.lstrip("0")
    
    if mobile.startswith("91") and len(mobile) == 12:
        try:
            parsed = phonenumbers.parse("+" + mobile, None)
            if phonenumbers.is_valid_number(parsed):
                return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)
        except phonenumbers.NumberParseException:
            pass
        return "+" + mobile
    
    try:
        parsed = phonenumbers.parse(mobile, default_region)
        if phonenumbers.is_valid_number(parsed):
            return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)
    except phonenumbers.NumberParseException:
        pass
    
    if len(mobile) == 10:
        return f"+91{mobile}"
    
    logger.warning(f"Could not normalize phone number: {mobile}")
    return f"+{mobile}" if not mobile.startswith("+") else mobile


class SMSService:
    """SMS service using Twilio API."""
    
    def __init__(self):
        self.account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.phone_number = os.getenv("TWILIO_PHONE_NUMBER")
        self.enabled = settings.SMS_ENABLED
        self._client = None
    
    @property
    def client(self):
        """Lazy load Twilio client."""
        if self._client is None and self.account_sid and self.auth_token:
            self._client = Client(self.account_sid, self.auth_token)
        return self._client
    
    def send_otp(self, mobile: str, otp: str) -> tuple[bool, str]:
        """
        Send OTP via SMS using Twilio.
        
        Args:
            mobile: Mobile number with country code (e.g., "+919876543210")
            otp: OTP code to send
            
        Returns:
            Tuple of (success, message)
        """
        if not self.enabled:
            logger.info(f"[SMS DISABLED] OTP for {mobile}: {otp}")
            return True, f"[DEV MODE] OTP: {otp}"
        
        if not self.account_sid or not self.auth_token or not self.phone_number:
            logger.error("Twilio credentials not configured")
            return False, "SMS service not configured"
        
        mobile = normalize_phone_number(mobile)
        
        message_body = f"Your CouponAli verification code is: {otp}. Valid for 5 minutes. Do not share this code with anyone."
        
        try:
            message = self.client.messages.create(
                body=message_body,
                from_=self.phone_number,
                to=mobile
            )
            
            logger.info(f"OTP sent successfully to {mobile}, SID: {message.sid}")
            return True, "OTP sent successfully"
                
        except TwilioRestException as e:
            logger.error(f"Twilio error: {e}")
            return False, f"Failed to send OTP: {str(e)}"
        except Exception as e:
            logger.error(f"SMS send error: {e}")
            return False, "Failed to send OTP"
    
    def send_transactional_sms(
        self,
        mobile: str,
        message: str,
    ) -> tuple[bool, str]:
        """
        Send transactional SMS using Twilio.
        
        Args:
            mobile: Mobile number with country code
            message: Message to send
            
        Returns:
            Tuple of (success, message)
        """
        if not self.enabled:
            logger.info(f"[SMS DISABLED] Message to {mobile}: {message}")
            return True, "[DEV MODE] SMS logged"
        
        if not self.account_sid or not self.auth_token or not self.phone_number:
            logger.error("Twilio credentials not configured")
            return False, "SMS service not configured"
        
        mobile = normalize_phone_number(mobile)
        
        try:
            msg = self.client.messages.create(
                body=message,
                from_=self.phone_number,
                to=mobile
            )
            
            logger.info(f"SMS sent successfully to {mobile}, SID: {msg.sid}")
            return True, "SMS sent successfully"
                
        except TwilioRestException as e:
            logger.error(f"Twilio error: {e}")
            return False, f"Failed to send SMS: {str(e)}"
        except Exception as e:
            logger.error(f"SMS send error: {e}")
            return False, "Failed to send SMS"


sms_service = SMSService()


def send_otp_sms(mobile: str, otp: str) -> tuple[bool, str]:
    """Send OTP via SMS."""
    return sms_service.send_otp(mobile, otp)


def send_order_notification(mobile: str, order_number: str, amount: float) -> tuple[bool, str]:
    """Send order confirmation SMS."""
    message = f"Your CouponAli order {order_number} of Rs.{amount:.2f} is confirmed. Thank you!"
    return sms_service.send_transactional_sms(mobile, message)


def send_voucher_sms(mobile: str, voucher_code: str, merchant_name: str) -> tuple[bool, str]:
    """Send voucher code SMS."""
    message = f"Your {merchant_name} voucher: {voucher_code}. Visit CouponAli for details."
    return sms_service.send_transactional_sms(mobile, message)


def send_cashback_notification(mobile: str, amount: float, description: str = "") -> tuple[bool, str]:
    """Send cashback notification SMS."""
    message = f"CouponAli: Rs.{amount:.2f} cashback credited to your wallet!"
    if description:
        message += f" {description}"
    return sms_service.send_transactional_sms(mobile, message)


def send_withdrawal_sms(mobile: str, amount: float, status: str) -> tuple[bool, str]:
    """Send withdrawal notification SMS."""
    if status == "pending":
        message = f"CouponAli: Your withdrawal request for Rs.{amount:.2f} is submitted and under review."
    elif status == "approved":
        message = f"CouponAli: Your withdrawal of Rs.{amount:.2f} has been approved and processed."
    elif status == "rejected":
        message = f"CouponAli: Your withdrawal request was rejected. Rs.{amount:.2f} refunded to wallet."
    else:
        message = f"CouponAli: Withdrawal status update - Rs.{amount:.2f}"
    
    return sms_service.send_transactional_sms(mobile, message)
