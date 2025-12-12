from sqlalchemy import String, DateTime, ForeignKey, Integer, Numeric, Text, Boolean, Index, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import Optional
from ..database import Base

class ShippingZone(Base):
    """Shipping Zones for rate calculation"""
    __tablename__ = "shipping_zones"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Zone Type
    zone_type: Mapped[str] = mapped_column(String(30), default="state")  # state, region, pincode, all
    
    # States/Regions in this zone
    states: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)  # List of state codes
    pincode_ranges: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)  # List of pincode ranges
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class ShippingRate(Base):
    """Shipping Rates based on zone and weight"""
    __tablename__ = "shipping_rates"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    zone_id: Mapped[int] = mapped_column(ForeignKey("shipping_zones.id", ondelete="CASCADE"), index=True)
    
    # Rate Type
    rate_type: Mapped[str] = mapped_column(String(30), default="weight_based")  # flat, weight_based, value_based
    shipping_method: Mapped[str] = mapped_column(String(50), default="standard")  # standard, express, same_day
    
    # Weight Range (kg)
    min_weight: Mapped[float] = mapped_column(Numeric(10, 3), default=0)
    max_weight: Mapped[Optional[float]] = mapped_column(Numeric(10, 3), nullable=True)
    
    # Order Value Range (for value-based rates)
    min_order_value: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    max_order_value: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)
    
    # Rates
    base_rate: Mapped[float] = mapped_column(Numeric(10, 2))  # Base shipping cost
    per_kg_rate: Mapped[float] = mapped_column(Numeric(10, 2), default=0)  # Additional per kg
    cod_charges: Mapped[float] = mapped_column(Numeric(10, 2), default=0)  # COD extra charges
    
    # Delivery Time
    min_delivery_days: Mapped[int] = mapped_column(Integer, default=3)
    max_delivery_days: Mapped[int] = mapped_column(Integer, default=7)
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    zone = relationship("ShippingZone")


class CourierPartner(Base):
    """Courier/Logistics Partners"""
    __tablename__ = "courier_partners"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True)  # delhivery, shiprocket, bluedart
    logo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Integration
    api_type: Mapped[str] = mapped_column(String(50), default="direct")  # direct, shiprocket, shipway
    api_endpoint: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    api_key: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    api_secret: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Capabilities
    supports_cod: Mapped[bool] = mapped_column(Boolean, default=True)
    supports_prepaid: Mapped[bool] = mapped_column(Boolean, default=True)
    supports_reverse: Mapped[bool] = mapped_column(Boolean, default=True)  # Returns pickup
    supports_surface: Mapped[bool] = mapped_column(Boolean, default=True)  # Ground shipping
    supports_air: Mapped[bool] = mapped_column(Boolean, default=False)  # Air shipping
    
    # Limits
    max_weight: Mapped[float] = mapped_column(Numeric(10, 2), default=25)  # kg
    max_length: Mapped[float] = mapped_column(Numeric(10, 2), default=100)  # cm
    max_value: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)  # Max order value
    
    # Priority
    priority: Mapped[int] = mapped_column(Integer, default=0)  # Higher = preferred
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ShipmentTracking(Base):
    """Shipment Tracking Events"""
    __tablename__ = "shipment_tracking"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), index=True)
    shipment_id: Mapped[Optional[int]] = mapped_column(ForeignKey("order_shipments.id"), nullable=True)
    
    awb_number: Mapped[str] = mapped_column(String(100), index=True)
    courier_code: Mapped[str] = mapped_column(String(50))
    
    # Event Details
    status: Mapped[str] = mapped_column(String(100))
    status_code: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Timestamps
    event_time: Mapped[datetime] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    
    order = relationship("Order")


class FreeShippingRule(Base):
    """Free Shipping Rules"""
    __tablename__ = "free_shipping_rules"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100))
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Conditions
    min_order_value: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    applicable_zones: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)  # Zone IDs, null = all
    applicable_categories: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)  # Category IDs
    
    # Validity
    start_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    end_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    priority: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
