"""
Standardized API response wrappers for consistent response formatting.
"""
from typing import TypeVar, Generic, Optional, Any, List
from pydantic import BaseModel, Field
from datetime import datetime

T = TypeVar('T')


class PaginationMetadata(BaseModel):
    """Pagination metadata."""
    page: int = Field(..., ge=1)
    limit: int = Field(..., ge=1, le=100)
    total: int = Field(..., ge=0)
    total_pages: int = Field(..., ge=0)
    has_next: bool
    has_prev: bool
    
    class Config:
        json_schema_extra = {
            "example": {
                "page": 1,
                "limit": 20,
                "total": 100,
                "total_pages": 5,
                "has_next": True,
                "has_prev": False
            }
        }


class SuccessResponse(BaseModel, Generic[T]):
    """Generic success response wrapper."""
    success: bool = True
    message: str = Field(default="Request successful", description="Human-readable message")
    data: Optional[T] = Field(default=None, description="Response data")
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    request_id: Optional[str] = Field(default=None, description="Request ID for tracing")


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated response wrapper."""
    success: bool = True
    message: str = Field(default="Request successful")
    data: List[T] = Field(default_factory=list, description="List of items")
    pagination: PaginationMetadata
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    request_id: Optional[str] = Field(default=None)


class ListResponse(BaseModel, Generic[T]):
    """Simple list response (non-paginated)."""
    success: bool = True
    message: str = Field(default="Request successful")
    data: List[T] = Field(default_factory=list)
    count: int = Field(default=0, description="Total count of items")
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    request_id: Optional[str] = Field(default=None)


def success_response(
    data: Optional[Any] = None,
    message: str = "Success",
    request_id: Optional[str] = None
) -> dict:
    """Create a standardized success response.
    
    Args:
        data: Response payload
        message: Human-readable message
        request_id: Request ID for tracing
        
    Returns:
        Dictionary with standardized structure
    """
    return {
        "success": True,
        "message": message,
        "data": data,
        "timestamp": datetime.utcnow().isoformat(),
        "request_id": request_id
    }


def paginated_response(
    data: List[Any],
    page: int,
    limit: int,
    total: int,
    message: str = "Success",
    request_id: Optional[str] = None
) -> dict:
    """Create a standardized paginated response.
    
    Args:
        data: List of items
        page: Current page number
        limit: Items per page
        total: Total number of items
        message: Human-readable message
        request_id: Request ID for tracing
        
    Returns:
        Dictionary with pagination metadata
    """
    total_pages = (total + limit - 1) // limit if limit > 0 else 0
    
    return {
        "success": True,
        "message": message,
        "data": data,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1
        },
        "timestamp": datetime.utcnow().isoformat(),
        "request_id": request_id
    }


def list_response(
    data: List[Any],
    message: str = "Success",
    request_id: Optional[str] = None
) -> dict:
    """Create a standardized list response (non-paginated).
    
    Args:
        data: List of items
        message: Human-readable message
        request_id: Request ID for tracing
        
    Returns:
        Dictionary with list and count
    """
    return {
        "success": True,
        "message": message,
        "data": data,
        "count": len(data),
        "timestamp": datetime.utcnow().isoformat(),
        "request_id": request_id
    }
