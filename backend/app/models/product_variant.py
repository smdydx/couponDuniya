from sqlalchemy import String, Integer, ForeignKey, Numeric ,Boolean
from sqlalchemy.orm import Mapped, mapped_column,relationship
from ..database import Base

class ProductVariant(Base):
    __tablename__ = "product_variants"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), index=True)
    sku: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    price: Mapped[float] = mapped_column(Numeric(10,2))
    stock: Mapped[int] = mapped_column(Integer, default=0)
    product = relationship("Product", back_populates="variants")
    is_available: Mapped[bool] = mapped_column(Boolean, default=True)

