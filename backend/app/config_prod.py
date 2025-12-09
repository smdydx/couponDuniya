"""
Production-grade configuration with validation and environment-specific settings.
"""
from pydantic_settings import BaseSettings
from pydantic import Field, validator
from functools import lru_cache
import logging
from typing import Optional

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    """Application settings with proper validation for production."""
    
    # ==================== Application ====================
    APP_NAME: str = Field(default="CouponAli API", description="Application name")
    APP_ENV: str = Field(default="development", description="Environment: development, staging, production")
    DEBUG: bool = Field(default=False, description="Enable debug mode (should be False in production)")
    SECRET_KEY: str = Field(default="", description="Secret key for signing JWTs")
    API_V1_PREFIX: str = Field(default="/api/v1", description="API v1 prefix")
    
    @validator('APP_ENV')
    def validate_app_env(cls, v):
        if v not in ('development', 'staging', 'production'):
            raise ValueError('APP_ENV must be one of: development, staging, production')
        return v
    
    @validator('DEBUG')
    def validate_debug(cls, v, values):
        if v and values.get('APP_ENV') == 'production':
            logger.warning("DEBUG=True in production is not recommended")
        return v
    
    @validator('SECRET_KEY')
    def validate_secret_key(cls, v, values):
        env = values.get('APP_ENV', 'development')
        if env == 'production' and (not v or len(v) < 32):
            raise ValueError('SECRET_KEY must be at least 32 characters long in production')
        return v
    
    # ==================== Server ====================
    HOST: str = Field(default="127.0.0.1", description="Server host")
    PORT: int = Field(default=8000, ge=1, le=65535, description="Server port")
    
    # ==================== Database ====================
    DATABASE_URL: str = Field(default="postgresql+psycopg://coupon:hardik123@127.0.0.1:5432/couponali")
    DATABASE_ECHO: bool = Field(default=False, description="Log SQL queries (enable for debugging)")
    DATABASE_POOL_SIZE: int = Field(default=5, ge=1, description="Database connection pool size")
    DATABASE_MAX_OVERFLOW: int = Field(default=10, ge=0, description="Maximum overflow connections")
    
    @validator('DATABASE_URL')
    def validate_database_url(cls, v, values):
        if not v or not v.startswith(('postgresql', 'mysql', 'sqlite')):
            raise ValueError('DATABASE_URL must be a valid database connection string')
        return v
    
    # ==================== Redis ====================
    REDIS_URL: str = Field(default="redis://localhost:6379")
    REDIS_DB: int = Field(default=0, ge=0, le=15)
    REDIS_PASSWORD: Optional[str] = Field(default=None)
    REDIS_MAX_CONNECTIONS: int = Field(default=10, ge=1)
    
    # ==================== JWT & Authentication ====================
    JWT_SECRET_KEY: str = Field(default="", description="JWT signing secret")
    JWT_ALGORITHM: str = Field(default="HS256", description="JWT algorithm")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=1440, ge=1, description="Access token expiry in minutes")
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=30, ge=1, description="Refresh token expiry in days")
    
    @validator('JWT_SECRET_KEY')
    def validate_jwt_secret(cls, v, values):
        if values.get('APP_ENV') == 'production' and (not v or len(v) < 32):
            raise ValueError('JWT_SECRET_KEY must be at least 32 characters long in production')
        return v
    
    # ==================== OTP & 2FA ====================
    OTP_EXPIRE_MINUTES: int = Field(default=5, ge=1, le=60)
    OTP_LENGTH: int = Field(default=6, ge=4, le=8)
    TWO_FACTOR_ENABLED: bool = Field(default=False)
    
    # ==================== Email Configuration ====================
    EMAIL_ENABLED: bool = Field(default=False)
    SMTP_HOST: str = Field(default="smtp.gmail.com")
    SMTP_PORT: int = Field(default=587, ge=1, le=65535)
    SMTP_USER: str = Field(default="")
    SMTP_PASSWORD: str = Field(default="")
    SMTP_USE_TLS: bool = Field(default=True)
    EMAIL_FROM: str = Field(default="noreply@couponali.com")
    EMAIL_FROM_NAME: str = Field(default="Coupon Ali")
    
    # ==================== SMS Configuration ====================
    SMS_ENABLED: bool = Field(default=False)
    MSG91_AUTH_KEY: str = Field(default="")
    MSG91_SENDER_ID: str = Field(default="COUPON")
    MSG91_ROUTE: str = Field(default="4")
    MSG91_DLT_TEMPLATE_ID: str = Field(default="")
    
    # ==================== Payment Gateway (Razorpay) ====================
    RAZORPAY_KEY_ID: str = Field(default="")
    RAZORPAY_KEY_SECRET: str = Field(default="")
    RAZORPAY_WEBHOOK_SECRET: str = Field(default="")
    RAZORPAY_BASE_URL: str = Field(default="https://api.razorpay.com")
    
    # ==================== Cashback Settings ====================
    DEFAULT_CASHBACK_PERCENTAGE: float = Field(default=2.5, ge=0, le=100)
    MAX_CASHBACK_AMOUNT: float = Field(default=500, ge=0)
    MIN_WITHDRAWAL_AMOUNT: float = Field(default=100, ge=0)
    CASHBACK_PROCESSING_DELAY_HOURS: int = Field(default=24, ge=0)
    
    # ==================== Rate Limiting ====================
    RATE_LIMIT_PER_MINUTE: int = Field(default=100, ge=1)
    RATE_LIMIT_PER_HOUR: int = Field(default=1000, ge=1)
    RATE_LIMIT_PER_DAY: int = Field(default=10000, ge=1)
    
    # ==================== File Upload ====================
    MAX_UPLOAD_SIZE_MB: int = Field(default=5, ge=1, le=100)
    ALLOWED_IMAGE_EXTENSIONS: str = Field(default="jpg,jpeg,png,webp,gif")
    UPLOAD_DIR: str = Field(default="uploads")
    
    # ==================== CORS ====================
    CORS_ORIGINS: str = Field(default="http://localhost:3000")
    CORS_ALLOW_CREDENTIALS: bool = Field(default=True)
    CORS_ALLOW_METHODS: str = Field(default="GET,POST,PUT,DELETE,PATCH,OPTIONS")
    CORS_ALLOW_HEADERS: str = Field(default="Content-Type,Authorization")
    
    # ==================== API Keys & Security ====================
    INTERNAL_API_KEY: str = Field(default="", description="Internal API key for service-to-service calls")
    ADMIN_IP_WHITELIST: str = Field(default="", description="Comma-separated IPs allowed for admin endpoints")
    
    # ==================== Frontend Configuration ====================
    FRONTEND_BASE_URL: str = Field(default="http://localhost:3000")
    GOOGLE_CLIENT_ID: str = Field(default="")
    GOOGLE_CLIENT_SECRET: str = Field(default="")
    GOOGLE_REDIRECT_URI: str = Field(default="http://localhost:5000/auth/google/callback")
    
    # ==================== Affiliate Networks ====================
    ADMITAD_CLIENT_ID: str = Field(default="")
    ADMITAD_CLIENT_SECRET: str = Field(default="")
    ADMITAD_REFRESH_TOKEN: str = Field(default="")
    ADMITAD_WEBSITE_ID: str = Field(default="")
    ADMITAD_API_BASE: str = Field(default="https://api.admitad.com")
    
    VCOMMISSION_API_KEY: str = Field(default="")
    VCOMMISSION_PUBLISHER_ID: str = Field(default="")
    VCOMMISSION_API_BASE: str = Field(default="https://services.vcommission.com")
    
    CUELINKS_API_KEY: str = Field(default="")
    CUELINKS_PUBLISHER_ID: str = Field(default="")
    CUELINKS_AFFILIATE_ID: str = Field(default="")
    CUELINKS_API_BASE: str = Field(default="https://api.cuelinks.com")
    
    # ==================== Monitoring & Observability ====================
    SENTRY_DSN: str = Field(default="", description="Sentry error tracking DSN")
    SENTRY_ENVIRONMENT: str = Field(default="development")
    SENTRY_TRACES_SAMPLE_RATE: float = Field(default=0.1, ge=0, le=1)
    
    LOG_LEVEL: str = Field(default="INFO", description="Logging level: DEBUG, INFO, WARNING, ERROR, CRITICAL")
    LOG_FILE: Optional[str] = Field(default=None, description="Log file path (None for stdout only)")
    
    # ==================== Feature Flags ====================
    FEATURE_CASHBACK_ENABLED: bool = Field(default=True)
    FEATURE_REFERRAL_ENABLED: bool = Field(default=True)
    FEATURE_GIFT_CARDS_ENABLED: bool = Field(default=True)
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "allow"  # Allow extra fields but don't use them


@lru_cache()
def get_settings() -> Settings:
    """Get application settings with caching."""
    settings = Settings()
    
    # Log environment info (sanitized)
    logger.info(f"Loaded settings for {settings.APP_ENV} environment")
    logger.debug(f"API running on {settings.HOST}:{settings.PORT}")
    
    return settings


def validate_production_settings(settings: Settings) -> list[str]:
    """Validate that production settings are properly configured.
    
    Returns:
        List of validation errors (empty if all checks pass)
    """
    errors = []
    
    if settings.APP_ENV == 'production':
        if settings.DEBUG:
            errors.append("DEBUG must be False in production")
        
        if len(settings.SECRET_KEY) < 32:
            errors.append("SECRET_KEY must be at least 32 characters")
        
        if len(settings.JWT_SECRET_KEY) < 32:
            errors.append("JWT_SECRET_KEY must be at least 32 characters")
        
        if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
            errors.append("Razorpay credentials required for payment processing")
        
        if not settings.INTERNAL_API_KEY or len(settings.INTERNAL_API_KEY) < 32:
            errors.append("INTERNAL_API_KEY should be at least 32 characters")
    
    return errors
