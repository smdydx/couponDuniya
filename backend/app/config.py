from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    APP_NAME: str = "CouponAli API"
    DEBUG: bool = True
    # PostgreSQL database connection
    DATABASE_URL: str = "postgresql+psycopg://coupon:hardik123@127.0.0.1:5432/couponali"
    REDIS_URL: str = "redis://localhost:6379"
    SECRET_KEY: str = "dev-secret"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    CORS_ORIGINS: str = "http://localhost:3000"
    DEFAULT_PASSWORD: str = "hardik123"
    
    # SMS Configuration (MSG91)
    MSG91_AUTH_KEY: str = ""
    MSG91_SENDER_ID: str = "CPNALI"
    MSG91_ROUTE: str = "4"  # Transactional route
    MSG91_DLT_TEMPLATE_ID: str = ""  # DLT Template ID for OTP
    SMS_ENABLED: bool = False  # Enable in production
    
    # Google OAuth
    GOOGLE_CLIENT_ID: str = "433927974317-omujf5cn8ndhtdrofprnv9sb0uo3irl1.apps.googleusercontent.com"
    GOOGLE_CLIENT_SECRET: str = ""  # Add your secret here
    GOOGLE_REDIRECT_URI: str = "http://localhost:5000"
    
    # Facebook OAuth
    FACEBOOK_APP_ID: str = ""
    FACEBOOK_APP_SECRET: str = ""
    
    # Frontend URL for redirects
    FRONTEND_URL: str = "https://dafc9188-a0bd-4022-aeb0-e4fcf20f899a-00-33uno060mq1q6.picard.replit.dev"
    
    # Razorpay Payment Gateway
    RAZORPAY_KEY_ID: str = "rzp_test_Rp3sBYQKRm8xxB"
    RAZORPAY_KEY_SECRET: str = "Tk3t8eGwgoc5E65a6DB0L60U"
    RAZORPAY_WEBHOOK_SECRET: str = ""
    
    # Email Configuration
    EMAIL_ENABLED: bool = True  # Enable email sending
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "noreply@couponali.com"
    # Optional SendGrid API key. If provided, SendGrid is preferred over SMTP.
    SENDGRID_API_KEY: str = ""
    
    # Internal service auth
    INTERNAL_API_KEY: str = ""

    # Affiliate network credentials
    ADMITAD_CLIENT_ID: str = ""
    ADMITAD_CLIENT_SECRET: str = ""
    ADMITAD_TOKEN: str = ""  # OAuth token for Admitad API
    VCOMMISSION_API_KEY: str = ""
    CUELINKS_API_KEY: str = ""
    FRONTEND_BASE_URL: str = "http://localhost:3000"
    ADMIN_IP_WHITELIST: str = ""  # Comma-separated list of allowed IPs for admin endpoints
    SENTRY_DSN: str = ""
    SENTRY_ENVIRONMENT: str = "development"
    SENTRY_TRACES_SAMPLE_RATE: float = 0.1

    class Config:
        env_file = ".env"
        extra = "ignore"  # Ignore extra fields in .env file

@lru_cache()
def get_settings() -> Settings:
    return Settings()
