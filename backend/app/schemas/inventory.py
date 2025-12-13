from pydantic import BaseModel
from datetime import datetime

class InventoryRead(BaseModel):
    id: int
    product_id: int
    variant_id: int | None
    quantity: int
    reserved: int
    updated_at: datetime
    class Config:
        from_attributes = True

class InventoryUpdate(BaseModel):
    quantity: int
    reserved: int | None = None
