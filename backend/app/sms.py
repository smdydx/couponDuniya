"""SMS service for sending OTP and notifications via MSG91."""
import requests
import logging
from typing import Optional
from .config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)


class SMSService:
    """SMS service using MSG91 API."""
    
    BASE_URL = "https://api.msg91.com/api/v5"
    
    def __init__(self):
        self.auth_key = settings.MSG91_AUTH_KEY
        self.sender_id = settings.MSG91_SENDER_ID
        self.route = settings.MSG91_ROUTE
        self.template_id = settings.MSG91_DLT_TEMPLATE_ID
        self.enabled = settings.SMS_ENABLED
    
    def send_otp(self, mobile: str, otp: str) -> tuple[bool, str]:
        """
        Send OTP via SMS.
        
        Args:
            mobile: Mobile number with country code (e.g., "919876543210")
            otp: OTP code to send
            
        Returns:
            Tuple of (success, message)
        """
        if not self.enabled:
            logger.info(f"[SMS DISABLED] OTP for {mobile}: {otp}")
            return True, f"[DEV MODE] OTP: {otp}"
        
        if not self.auth_key:
            logger.error("MSG91_AUTH_KEY not configured")
            return False, "SMS service not configured"
        
        # Remove + if present
        mobile = mobile.replace("+", "")
        
        # MSG91 OTP API
        url = f"{self.BASE_URL}/otp"
        
        params = {
            "template_id": self.template_id,
            "mobile": mobile,
            "authkey": self.auth_key,
            "otp": otp,
        }
        
        try:
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            if data.get("type") == "success":
                logger.info(f"OTP sent successfully to {mobile}")
                return True, "OTP sent successfully"
            else:
                logger.error(f"MSG91 error: {data}")
                return False, "Failed to send OTP"
                
        except requests.exceptions.RequestException as e:
            logger.error(f"SMS send error: {e}")
            return False, "Failed to send OTP"
    
    def verify_otp_via_msg91(self, mobile: str, otp: str) -> tuple[bool, str]:
        """
        Verify OTP using MSG91's verification API (optional - we use Redis).
        
        Args:
            mobile: Mobile number
            otp: OTP to verify
            
        Returns:
            Tuple of (success, message)
        """
        if not self.enabled:
            return True, "Verified (dev mode)"
        
        mobile = mobile.replace("+", "")
        
        url = f"{self.BASE_URL}/otp/verify"
        
        params = {
            "authkey": self.auth_key,
            "mobile": mobile,
            "otp": otp,
        }
        
        try:
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            if data.get("type") == "success":
                return True, "OTP verified"
            else:
                return False, "Invalid OTP"
                
        except requests.exceptions.RequestException as e:
            logger.error(f"OTP verification error: {e}")
            return False, "Verification failed"
    
    def send_transactional_sms(
        self,
        mobile: str,
        message: str,
        template_id: Optional[str] = None
    ) -> tuple[bool, str]:
        """
        Send a transactional SMS (order confirmation, voucher codes, etc.).
        
        Args:
            mobile: Mobile number
            message: SMS content
            template_id: DLT template ID (optional)
            
        Returns:
            Tuple of (success, message)
        """
        if not self.enabled:
            logger.info(f"[SMS DISABLED] To {mobile}: {message}")
            return True, "[DEV MODE] SMS logged"
        
        mobile = mobile.replace("+", "")
        
        url = f"{self.BASE_URL}/flow/"
        
        headers = {
            "authkey": self.auth_key,
            "Content-Type": "application/json"
        }
        
        payload = {
            "sender": self.sender_id,
            "route": self.route,
            "country": "91",
            "sms": [
                {
                    "message": message,
                    "to": [mobile]
                }
            ]
        }
        
        if template_id:
            payload["DLT_TE_ID"] = template_id
        
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            if data.get("type") == "success":
                logger.info(f"SMS sent successfully to {mobile}")
                return True, "SMS sent successfully"
            else:
                logger.error(f"MSG91 error: {data}")
                return False, "Failed to send SMS"
                
        except requests.exceptions.RequestException as e:
            logger.error(f"SMS send error: {e}")
            return False, "Failed to send SMS"


# Singleton instance
sms_service = SMSService()


# Convenience functions
def send_otp_sms(mobile: str, otp: str) -> tuple[bool, str]:
    """Send OTP via SMS."""
    return sms_service.send_otp(mobile, otp)


def send_order_notification(mobile: str, order_number: str, amount: float) -> tuple[bool, str]:
    """Send order confirmation SMS."""
    message = f"Your CouponAli order {order_number} of ₹{amount:.2f} is confirmed. Thank you!"
    return sms_service.send_transactional_sms(mobile, message)


def send_voucher_sms(mobile: str, voucher_code: str, merchant_name: str) -> tuple[bool, str]:
    """Send voucher code SMS."""
    message = f"Your {merchant_name} voucher: {voucher_code}. Visit CouponAli for details."
    return sms_service.send_transactional_sms(mobile, message)


def send_cashback_notification(mobile: str, amount: float, description: str) -> tuple[bool, str]:
    """Send cashback notification SMS."""
    message = f"CouponAli: ₹{amount:.2f} cashback credited. {description}"
    return sms_service.send_transactional_sms(mobile, message)


def send_withdrawal_sms(mobile: str, amount: float, status: str) -> tuple[bool, str]:
    """Send withdrawal notification SMS."""
    if status == "pending":
        message = f"CouponAli: Your withdrawal request for ₹{amount:.2f} is submitted and under review."
    elif status == "approved":
        message = f"CouponAli: Your withdrawal of ₹{amount:.2f} has been approved and processed."
    elif status == "rejected":
        message = f"CouponAli: Your withdrawal request was rejected. ₹{amount:.2f} refunded to wallet."
    else:
        message = f"CouponAli: Withdrawal status update - ₹{amount:.2f}"
    
    return sms_service.send_transactional_sms(mobile, message)
    return sms_service.send_transactional_sms(mobile, message)


def send_cashback_notification(mobile: str, amount: float) -> tuple[bool, str]:
    """Send cashback credit notification."""
    message = f"₹{amount:.2f} cashback credited to your CouponAli wallet!"
    return sms_service.send_transactional_sms(mobile, message)
