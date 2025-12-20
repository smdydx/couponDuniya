"""Email service for sending order notifications and other emails.

This module reads runtime settings from `get_settings()` and supports two
delivery paths:
 - SendGrid (if `SENDGRID_API_KEY` is set)
 - Generic SMTP (if SMTP settings are provided)

It is safe to run in development: when `EMAIL_ENABLED` is False the service
will only log the email and return success so the rest of the application
can proceed.
"""
import logging
import smtplib
from typing import Optional, Tuple
from email.message import EmailMessage
from .config import get_settings
import json

settings = get_settings()
logger = logging.getLogger(__name__)


class EmailService:
    """Email service using SMTP or SendGrid API (if configured)."""

    def __init__(self):
        # Read values from settings at init so changes to env require a restart
        self.enabled: bool = bool(getattr(settings, "EMAIL_ENABLED", False))
        self.from_email: str = getattr(settings, "EMAIL_FROM", "noreply@couponali.com")
        self.smtp_host: str = getattr(settings, "SMTP_HOST", "")
        self.smtp_port: int = int(getattr(settings, "SMTP_PORT", 0) or 0)
        self.smtp_user: str = getattr(settings, "SMTP_USER", "")
        self.smtp_password: str = getattr(settings, "SMTP_PASSWORD", "")
        self.sendgrid_api_key: str = getattr(settings, "SENDGRID_API_KEY", "")

    def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> Tuple[bool, str]:
        """Send email using configured provider.

        Returns (success, message). On development when EMAIL_ENABLED is False
        this will log and return success so calling flows can continue.
        """
        if not self.enabled:
            logger.info("[EMAIL DISABLED] To: %s Subject: %s", to_email, subject)
            return True, "[DEV MODE] Email logged"

        # Prefer SendGrid when api key is available
        try:
            if self.sendgrid_api_key:
                return self._send_via_sendgrid(to_email, subject, html_content, text_content)

            # Fallback to SMTP when configured
            if self.smtp_host and self.smtp_port and self.smtp_user:
                return self._send_via_smtp(to_email, subject, html_content, text_content)

            logger.error("No email provider configured (SENDGRID_API_KEY or SMTP settings missing)")
            return False, "No email provider configured"
        except Exception as exc:  # pragma: no cover - operational errors handled at runtime
            logger.exception("Error sending email: %s", exc)
            return False, str(exc)

    def _send_via_smtp(self, to_email: str, subject: str, html_content: str, text_content: Optional[str]) -> Tuple[bool, str]:
        """Send email over SMTP using smtplib."""
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = self.from_email
        msg["To"] = to_email
        if text_content:
            msg.set_content(text_content)
        msg.add_alternative(html_content, subtype="html")

        logger.debug("Connecting to SMTP host %s:%s", self.smtp_host, self.smtp_port)
        with smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=15) as smtp:
            smtp.starttls()
            smtp.login(self.smtp_user, self.smtp_password)
            smtp.send_message(msg)

        logger.info("Email sent via SMTP to %s", to_email)
        return True, "sent-via-smtp"

    def _send_via_sendgrid(self, to_email: str, subject: str, html_content: str, text_content: Optional[str]) -> Tuple[bool, str]:
        """Send email via SendGrid REST API using requests (no external lib required).

        This uses the simple /mail/send endpoint. If `requests` is not installed
        the function will raise ImportError which is handled by the caller.
        """
        try:
            import requests
        except Exception as exc:  # pragma: no cover - optional runtime dependency
            logger.exception("requests library not available: %s", exc)
            raise

        url = "https://api.sendgrid.com/v3/mail/send"
        payload = {
            "personalizations": [{"to": [{"email": to_email}], "subject": subject}],
            "from": {"email": self.from_email},
            "content": []
        }
        if text_content:
            payload["content"].append({"type": "text/plain", "value": text_content})
        payload["content"].append({"type": "text/html", "value": html_content})

        headers = {
            "Authorization": f"Bearer {self.sendgrid_api_key}",
            "Content-Type": "application/json"
        }

        resp = requests.post(url, headers=headers, data=json.dumps(payload), timeout=15)
        if resp.status_code in (200, 202):
            logger.info("Email sent via SendGrid to %s (status=%s)", to_email, resp.status_code)
            return True, f"sendgrid:{resp.status_code}"

        logger.error("SendGrid returned %s: %s", resp.status_code, resp.text)
        return False, f"sendgrid:{resp.status_code}:{resp.text}"

    def send_welcome_email(self, email: str, verification_url: str = None) -> Tuple[bool, str]:
        """Send welcome email with verification link to new user."""
        subject = "Welcome to CouponAli - Verify Your Email"

        verify_section = ""
        if verification_url:
            verify_section = f"""
            <div style=\"background-color: #f0f8ff; padding: 20px; margin: 20px 0; border-radius: 5px;\">
                <h2>Verify Your Email</h2>
                <p>Please click the button below to verify your email address:</p>
                <a href=\"{verification_url}\" style=\"display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0;\">Verify Email</a>
                <p style=\"color: #666; font-size: 12px;\">Or copy and paste this link: {verification_url}</p>
                <p style=\"color: #666; font-size: 12px;\">This link will expire in 24 hours.</p>
            </div>
            """

        html_content = f"""
        <html>
            <body style=\"font-family: Arial, sans-serif; line-height: 1.6; color: #333;\">
                <div style=\"max-width: 600px; margin: 0 auto; padding: 20px;\">
                    <h1 style=\"color: #007bff;\">Welcome to CouponAli!</h1>
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
    ) -> Tuple[bool, str]:
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
                <table border=\"1\" cellpadding=\"10\">
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
    ) -> Tuple[bool, str]:
        """Send email with voucher codes."""
        subject = f"Your Voucher Codes - {order_number}"

        vouchers_html = ""
        for voucher in vouchers:
            vouchers_html += f"""
            <div style=\"margin: 20px 0; padding: 15px; border: 2px solid #4CAF50; border-radius: 5px;\">
                <h3>{voucher['product_name']}</h3>
                <p><strong>Voucher Code:</strong> <span style=\"font-size: 20px; color: #4CAF50;\">{voucher['code']}</span></p>
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
    ) -> Tuple[bool, str]:
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
    ) -> Tuple[bool, str]:
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


# Singleton instance (reads current settings at import time)
email_service = EmailService()


# Convenience functions
def send_welcome_email(email: str, name: str) -> Tuple[bool, str]:
    """Send welcome email to new user.

    Note: the second parameter `name` is preserved for compatibility with
    existing call sites; it will be used as the `verification_url` if a URL
    string is passed. Prefer calling the underlying `email_service` methods
    directly when possible.
    """
    return email_service.send_welcome_email(email, name)


def send_order_confirmation(
    email: str,
    order_number: str,
    total_amount: float,
    items: list
) -> Tuple[bool, str]:
    """Send order confirmation email."""
    return email_service.send_order_confirmation(email, order_number, total_amount, items)


def send_voucher_email(email: str, order_number: str, vouchers: list) -> Tuple[bool, str]:
    """Send voucher codes via email."""
    return email_service.send_voucher_email(email, order_number, vouchers)


def send_cashback_notification(email: str, amount: float, description: str) -> Tuple[bool, str]:
    """Send cashback notification."""
    return email_service.send_cashback_notification(email, amount, description)


def send_withdrawal_notification(
    email: str,
    amount: float,
    status: str,
    reference: Optional[str] = None
) -> Tuple[bool, str]:
    """Send withdrawal notification."""
    return email_service.send_withdrawal_notification(email, amount, status, reference)
