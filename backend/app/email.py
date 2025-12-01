"""Email service for sending order notifications and other emails."""
import logging
from typing import Optional
from .config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)


class EmailService:
    """Email service using SMTP or email provider API."""
    
    def __init__(self):
        self.from_email = "noreply@couponali.com"
        self.enabled = False  # Enable in production with actual email provider
    
    def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> tuple[bool, str]:
        """
        Send email.
        
        Args:
            to_email: Recipient email
            subject: Email subject
            html_content: HTML email body
            text_content: Plain text fallback
            
        Returns:
            Tuple of (success, message)
        """
        if not self.enabled:
            logger.info(f"[EMAIL DISABLED] To: {to_email}, Subject: {subject}")
            return True, "[DEV MODE] Email logged"
        
        # TODO: Integrate with SendGrid, AWS SES, or other email provider
        # Example with SendGrid:
        # from sendgrid import SendGridAPIClient
        # from sendgrid.helpers.mail import Mail
        # message = Mail(
        #     from_email=self.from_email,
        #     to_emails=to_email,
        #     subject=subject,
        #     html_content=html_content
        # )
        # sg = SendGridAPIClient(settings.SENDGRID_API_KEY)
        # response = sg.send(message)
        
        return True, "Email sent (simulated)"
    
    def send_welcome_email(self, email: str, verification_url: str = None) -> tuple[bool, str]:
        """Send welcome email with verification link to new user."""
        subject = "Welcome to CouponAli - Verify Your Email"
        
        verify_section = ""
        if verification_url:
            verify_section = f"""
            <div style="background-color: #f0f8ff; padding: 20px; margin: 20px 0; border-radius: 5px;">
                <h2>Verify Your Email</h2>
                <p>Please click the button below to verify your email address:</p>
                <a href="{verification_url}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0;">Verify Email</a>
                <p style="color: #666; font-size: 12px;">Or copy and paste this link: {verification_url}</p>
                <p style="color: #666; font-size: 12px;">This link will expire in 24 hours.</p>
            </div>
            """
        
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #007bff;">Welcome to CouponAli!</h1>
                    <p>Thank you for joining us. Start saving on gift cards and earning cashback today!</p>
                    {verify_section}
                    <h3>What's Next?</h3>
                    <ul>
                        <li>Browse thousands of gift cards</li>
                        <li>Earn cashback on every purchase</li>
                        <li>Track your orders and wallet</li>
                        <li>Refer friends and earn rewards</li>
                    </ul>
                    <p>Best regards,<br><strong>CouponAli Team</strong></p>
                </div>
            </body>
        </html>
        """
        return self.send_email(email, subject, html_content)
    
    def send_order_confirmation(
        self,
        email: str,
        order_number: str,
        total_amount: float,
        items: list
    ) -> tuple[bool, str]:
        """Send order confirmation email."""
        subject = f"Order Confirmation - {order_number}"
        
        items_html = ""
        for item in items:
            items_html += f"""
            <tr>
                <td>{item['product_name']}</td>
                <td>{item['quantity']}</td>
                <td>₹{item['unit_price']:.2f}</td>
                <td>₹{item['subtotal']:.2f}</td>
            </tr>
            """
        
        html_content = f"""
        <html>
            <body>
                <h1>Order Confirmed!</h1>
                <p>Your order <strong>{order_number}</strong> has been confirmed.</p>
                
                <h2>Order Details</h2>
                <table border="1" cellpadding="10">
                    <tr>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Subtotal</th>
                    </tr>
                    {items_html}
                </table>
                
                <h3>Total: ₹{total_amount:.2f}</h3>
                
                <p>You will receive your voucher codes shortly.</p>
                
                <p>Best regards,<br>CouponAli Team</p>
            </body>
        </html>
        """
        return self.send_email(email, subject, html_content)
    
    def send_voucher_email(
        self,
        email: str,
        order_number: str,
        vouchers: list
    ) -> tuple[bool, str]:
        """Send email with voucher codes."""
        subject = f"Your Voucher Codes - {order_number}"
        
        vouchers_html = ""
        for voucher in vouchers:
            vouchers_html += f"""
            <div style="margin: 20px 0; padding: 15px; border: 2px solid #4CAF50; border-radius: 5px;">
                <h3>{voucher['product_name']}</h3>
                <p><strong>Voucher Code:</strong> <span style="font-size: 20px; color: #4CAF50;">{voucher['code']}</span></p>
                <p><strong>Value:</strong> ₹{voucher['value']:.2f}</p>
                {f"<p>{voucher.get('instructions', '')}</p>" if voucher.get('instructions') else ""}
            </div>
            """
        
        html_content = f"""
        <html>
            <body>
                <h1>Your Voucher Codes Are Ready!</h1>
                <p>Order: <strong>{order_number}</strong></p>
                
                {vouchers_html}
                
                <p><strong>Important:</strong> Keep these codes safe and do not share them with anyone.</p>
                
                <p>Best regards,<br>CouponAli Team</p>
            </body>
        </html>
        """
        return self.send_email(email, subject, html_content)
    
    def send_cashback_notification(
        self,
        email: str,
        amount: float,
        description: str
    ) -> tuple[bool, str]:
        """Send cashback credit notification."""
        subject = "Cashback Credited to Your Wallet!"
        html_content = f"""
        <html>
            <body>
                <h1>Cashback Credited!</h1>
                <p>₹{amount:.2f} has been credited to your CouponAli wallet.</p>
                <p>{description}</p>
                <p>Best regards,<br>CouponAli Team</p>
            </body>
        </html>
        """
        return self.send_email(email, subject, html_content)
    
    def send_withdrawal_notification(
        self,
        email: str,
        amount: float,
        status: str,
        reference: Optional[str] = None
    ) -> tuple[bool, str]:
        """Send withdrawal status notification."""
        subject = f"Withdrawal {status.title()}"
        
        if status == "approved":
            message = f"Your withdrawal request of ₹{amount:.2f} has been approved and processed."
            if reference:
                message += f" Reference: {reference}"
        elif status == "rejected":
            message = f"Your withdrawal request of ₹{amount:.2f} has been rejected. Please contact support for details."
        else:
            message = f"Your withdrawal request of ₹{amount:.2f} status: {status}"
        
        html_content = f"""
        <html>
            <body>
                <h1>Withdrawal Update</h1>
                <p>{message}</p>
                <p>Best regards,<br>CouponAli Team</p>
            </body>
        </html>
        """
        return self.send_email(email, subject, html_content)


# Singleton instance
email_service = EmailService()


# Convenience functions
def send_welcome_email(email: str, name: str) -> tuple[bool, str]:
    """Send welcome email to new user."""
    return email_service.send_welcome_email(email, name)


def send_order_confirmation(
    email: str,
    order_number: str,
    total_amount: float,
    items: list
) -> tuple[bool, str]:
    """Send order confirmation email."""
    return email_service.send_order_confirmation(email, order_number, total_amount, items)


def send_voucher_email(email: str, order_number: str, vouchers: list) -> tuple[bool, str]:
    """Send voucher codes via email."""
    return email_service.send_voucher_email(email, order_number, vouchers)


def send_cashback_notification(email: str, amount: float, description: str) -> tuple[bool, str]:
    """Send cashback notification."""
    return email_service.send_cashback_notification(email, amount, description)


def send_withdrawal_notification(
    email: str,
    amount: float,
    status: str,
    reference: Optional[str] = None
) -> tuple[bool, str]:
    """Send withdrawal notification."""
    return email_service.send_withdrawal_notification(email, amount, status, reference)
