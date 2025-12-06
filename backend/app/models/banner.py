
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, func
from ..database import Base

class Banner(Base):
    __tablename__ = "banners"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    banner_type = Column(String(50), default="hero", nullable=False)  # 'hero' or 'promo'
    
    # For hero banners
    image_url = Column(String(500), nullable=True)
    
    # For promotional banners
    brand_name = Column(String(255), nullable=True)
    badge_text = Column(String(100), nullable=True)
    badge_color = Column(String(100), nullable=True)
    headline = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    code = Column(String(100), nullable=True)
    metadata = Column(Text, nullable=True)  # JSON: {"gradient": "...", "emoji": "..."}
    
    # Common fields
    link_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    order_index = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
