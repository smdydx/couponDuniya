from pydantic import BaseModel

class ProductVariantRead(BaseModel):
    id: int
    product_id: int
    sku: str
    name: str
    price: float
    stock: int

    class Config:
        from_attributes = True

class ProductVariantCreate(BaseModel):
    product_id: int
    sku: str
    name: str
    price: float
    stock: int
