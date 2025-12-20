
"""SMS/Email service for sending OTP and notifications via SMTP."""
import logging
import smtplib
from email.message import EmailMessage
from typing import Optional
import phonenumbers
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
    """SMS/Email service using SMTP for OTP delivery."""
    
    def __init__(self):
        self.smtp_host = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.smtp_user = settings.SMTP_USER
        self.smtp_password = settings.SMTP_PASSWORD
        self.enabled = bool(self.smtp_host and self.smtp_port and self.smtp_user and self.smtp_password)
    
    def send_otp_email(self, email: str, otp: str) -> tuple[bool, str]:
        """
        Send OTP via email using SMTP.
        
        Args:
            email: Email address to send OTP to
            otp: OTP code to send
            
        Returns:
            Tuple of (success, message)
        """
        if not self.enabled:
            logger.info(f"[SMTP DISABLED] OTP for {email}: {otp}")
            return True, f"[DEV MODE] OTP: {otp}"
        
        try:
            msg = EmailMessage()
            msg['Subject'] = 'Your CouponAli Verification Code'
            msg['From'] = self.smtp_user
            msg['To'] = email
            
            html_content = f"""
            <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h1 style="color: #8b5cf6;">CouponAli</h1>
                        <h2>Your Verification Code</h2>
                        <div style="background-color: #f0f8ff; padding: 20px; margin: 20px 0; border-radius: 5px; text-align: center;">
                            <p style="font-size: 14px; margin-bottom: 10px;">Your OTP code is:</p>
                            <h1 style="color: #8b5cf6; font-size: 36px; letter-spacing: 5px; margin: 10px 0;">{otp}</h1>
                            <p style="color: #666; font-size: 12px; margin-top: 10px;">Valid for 5 minutes</p>
                        </div>
                        <p><strong>Important:</strong> Do not share this code with anyone.</p>
                        <p style="color: #999; font-size: 12px; margin-top: 30px;">
                            If you did not request this code, please ignore this email.
                        </p>
                    </div>
                </body>
            </html>
            """
            
            msg.set_content(f"Your CouponAli verification code is: {otp}. Valid for 5 minutes.")
            msg.add_alternative(html_content, subtype='html')
            
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.send_message(msg)
            
            logger.info(f"OTP sent successfully to {email}")
            return True, "OTP sent successfully to your email"
                
        except Exception as e:
            logger.error(f"SMTP send error: {e}")
            return False, "Failed to send OTP"
    
    def send_otp(self, mobile: str, otp: str) -> tuple[bool, str]:
        """
        Send OTP via email (using mobile number to determine email).
        
        Args:
            mobile: Mobile number (will be used to send to email)
            otp: OTP code to send
            
        Returns:
            Tuple of (success, message)
        """
        mobile = normalize_phone_number(mobile)
        
        # Convert mobile to email format
        # You can customize this based on your user registration
        # For now, we'll use the mobile number as identifier
        email = f"{mobile.replace('+', '')}@couponali.local"
        
        return self.send_otp_email(email, otp)
    
    def send_transactional_email(
        self,
        email: str,
        subject: str,
        message: str,
    ) -> tuple[bool, str]:
        """
        Send transactional email using SMTP.
        
        Args:
            email: Email address
            subject: Email subject
            message: Message to send
            
        Returns:
            Tuple of (success, message)
        """
        if not self.enabled:
            logger.info(f"[SMTP DISABLED] Email to {email}: {message}")
            return True, "[DEV MODE] Email logged"
        
        try:
            msg = EmailMessage()
            msg['Subject'] = subject
            msg['From'] = self.smtp_user
            msg['To'] = email
            msg.set_content(message)
            
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.send_message(msg)
            
            logger.info(f"Email sent successfully to {email}")
            return True, "Email sent successfully"
                
        except Exception as e:
            logger.error(f"SMTP send error: {e}")
            return False, "Failed to send email"


sms_service = SMSService()


def send_otp_sms(mobile: str, otp: str) -> tuple[bool, str]:
    """Send OTP via email (SMTP)."""
    return sms_service.send_otp(mobile, otp)


def send_order_notification(mobile: str, order_number: str, amount: float) -> tuple[bool, str]:
    """Send order confirmation email."""
    email = f"{mobile.replace('+', '')}@couponali.local"
    subject = f"Order Confirmation - {order_number}"
    message = f"Your CouponAli order {order_number} of Rs.{amount:.2f} is confirmed. Thank you!"
    return sms_service.send_transactional_email(email, subject, message)


def send_voucher_sms(mobile: str, voucher_code: str, merchant_name: str) -> tuple[bool, str]:
    """Send voucher code email."""
    email = f"{mobile.replace('+', '')}@couponali.local"
    subject = f"Your {merchant_name} Voucher"
    message = f"Your {merchant_name} voucher: {voucher_code}. Visit CouponAli for details."
    return sms_service.send_transactional_email(email, subject, message)


def send_cashback_notification(mobile: str, amount: float, description: str = "") -> tuple[bool, str]:
    """Send cashback notification email."""
    email = f"{mobile.replace('+', '')}@couponali.local"
    subject = "Cashback Credited"
    message = f"CouponAli: Rs.{amount:.2f} cashback credited to your wallet!"
    if description:
        message += f" {description}"
    return sms_service.send_transactional_email(email, subject, message)


def send_withdrawal_sms(mobile: str, amount: float, status: str) -> tuple[bool, str]:
    """Send withdrawal notification email."""
    email = f"{mobile.replace('+', '')}@couponali.local"
    subject = f"Withdrawal {status.title()}"
    
    if status == "pending":
        message = f"CouponAli: Your withdrawal request for Rs.{amount:.2f} is submitted and under review."
    elif status == "approved":
        message = f"CouponAli: Your withdrawal of Rs.{amount:.2f} has been approved and processed."
    elif status == "rejected":
        message = f"CouponAli: Your withdrawal request was rejected. Rs.{amount:.2f} refunded to wallet."
    else:
        message = f"CouponAli: Withdrawal status update - Rs.{amount:.2f}"
    
    return sms_service.send_transactional_email(email, subject, message)
