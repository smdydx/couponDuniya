from pydantic import BaseModel

class CategoryRead(BaseModel):
    id: int
    name: str
    slug: str
    is_active: bool

    class Config:
        from_attributes = True

class CategoryCreate(BaseModel):
    name: str
    slug: str
