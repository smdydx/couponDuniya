"""
Standardized error handling and exception classes for production API.
"""
from fastapi import Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime
import logging
import traceback
import uuid

logger = logging.getLogger(__name__)


class ErrorResponse(BaseModel):
    """Standardized error response model."""
    success: bool = False
    error: str
    code: str
    details: Optional[dict[str, Any]] = None
    request_id: Optional[str] = None
    timestamp: str = None
    
    def __init__(self, **data):
        super().__init__(**data)
        if not self.timestamp:
            self.timestamp = datetime.utcnow().isoformat()


# ==================== Custom Exceptions ====================

class APIException(Exception):
    """Base exception for API errors."""
    
    def __init__(
        self,
        message: str,
        code: str = "INTERNAL_ERROR",
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: Optional[dict] = None
    ):
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class ValidationException(APIException):
    """Raised when input validation fails."""
    
    def __init__(self, message: str, details: Optional[dict] = None):
        super().__init__(
            message=message,
            code="VALIDATION_ERROR",
            status_code=status.HTTP_400_BAD_REQUEST,
            details=details
        )


class AuthenticationException(APIException):
    """Raised when authentication fails."""
    
    def __init__(self, message: str = "Authentication failed", details: Optional[dict] = None):
        super().__init__(
            message=message,
            code="AUTHENTICATION_ERROR",
            status_code=status.HTTP_401_UNAUTHORIZED,
            details=details
        )


class AuthorizationException(APIException):
    """Raised when authorization fails."""
    
    def __init__(self, message: str = "Insufficient permissions", details: Optional[dict] = None):
        super().__init__(
            message=message,
            code="AUTHORIZATION_ERROR",
            status_code=status.HTTP_403_FORBIDDEN,
            details=details
        )


class ResourceNotFoundException(APIException):
    """Raised when a resource is not found."""
    
    def __init__(self, resource_type: str, resource_id: Any = None):
        message = f"{resource_type} not found"
        if resource_id:
            message += f" (ID: {resource_id})"
        super().__init__(
            message=message,
            code="RESOURCE_NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND,
            details={"resource_type": resource_type, "resource_id": str(resource_id) if resource_id else None}
        )


class ConflictException(APIException):
    """Raised when there's a resource conflict (e.g., duplicate)."""
    
    def __init__(self, message: str, details: Optional[dict] = None):
        super().__init__(
            message=message,
            code="CONFLICT",
            status_code=status.HTTP_409_CONFLICT,
            details=details
        )


class RateLimitException(APIException):
    """Raised when rate limit is exceeded."""
    
    def __init__(self, message: str = "Rate limit exceeded"):
        super().__init__(
            message=message,
            code="RATE_LIMIT_EXCEEDED",
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            details={"retry_after": 60}
        )


class ExternalServiceException(APIException):
    """Raised when an external service call fails."""
    
    def __init__(self, service_name: str, message: str = None, details: Optional[dict] = None):
        msg = f"External service error: {service_name}"
        if message:
            msg += f" - {message}"
        super().__init__(
            message=msg,
            code="EXTERNAL_SERVICE_ERROR",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            details=details or {"service": service_name}
        )


class DatabaseException(APIException):
    """Raised when database operations fail."""
    
    def __init__(self, message: str = "Database operation failed", details: Optional[dict] = None):
        super().__init__(
            message=message,
            code="DATABASE_ERROR",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details=details
        )


# ==================== Exception Handlers ====================

async def api_exception_handler(request: Request, exc: APIException) -> JSONResponse:
    """Handle custom API exceptions."""
    request_id = getattr(request.state, "request_id", None) or str(uuid.uuid4())
    
    # Log the error with appropriate level
    if exc.status_code >= 500:
        logger.error(
            f"API Error [{exc.code}]: {exc.message}",
            extra={
                "request_id": request_id,
                "path": request.url.path,
                "method": request.method,
                "status_code": exc.status_code,
                "details": exc.details
            }
        )
    else:
        logger.warning(
            f"API Error [{exc.code}]: {exc.message}",
            extra={
                "request_id": request_id,
                "path": request.url.path,
                "method": request.method,
                "status_code": exc.status_code,
                "details": exc.details
            }
        )
    
    response = ErrorResponse(
        error=exc.message,
        code=exc.code,
        details=exc.details,
        request_id=request_id
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content=response.dict()
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle unexpected exceptions."""
    request_id = getattr(request.state, "request_id", None) or str(uuid.uuid4())
    
    # Log full traceback for unexpected errors
    logger.error(
        f"Unexpected error: {str(exc)}",
        exc_info=exc,
        extra={
            "request_id": request_id,
            "path": request.url.path,
            "method": request.method,
            "error_type": type(exc).__name__
        }
    )
    
    # Don't expose internal details in production
    from .config_prod import get_settings
    settings = get_settings()
    
    if settings.DEBUG:
        error_message = str(exc)
        error_details = {
            "type": type(exc).__name__,
            "traceback": traceback.format_exc()
        }
    else:
        error_message = "An unexpected error occurred"
        error_details = None
    
    response = ErrorResponse(
        error=error_message,
        code="INTERNAL_SERVER_ERROR",
        details=error_details,
        request_id=request_id
    )
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=response.dict()
    )


# ==================== Utility Functions ====================

def format_validation_errors(errors: list[dict]) -> dict:
    """Format Pydantic validation errors into a readable format."""
    formatted = {}
    for error in errors:
        field = ".".join(str(x) for x in error["loc"][1:])
        if field not in formatted:
            formatted[field] = []
        formatted[field].append(error["msg"])
    return formatted


def raise_if_none(value: Any, message: str, resource_type: str = "Resource"):
    """Raise ResourceNotFoundException if value is None."""
    if value is None:
        raise ResourceNotFoundException(resource_type)
    return value
