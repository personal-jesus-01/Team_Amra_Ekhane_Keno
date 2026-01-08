"""
Global Error Handling Middleware

Provides consistent error responses across the API.
Implements proper HTTP status codes and error formats.
"""

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError
import logging
from datetime import datetime
from typing import Union

logger = logging.getLogger(__name__)


class APIError(Exception):
    """Base exception for API errors"""

    def __init__(
        self,
        message: str,
        code: str = "INTERNAL_SERVER_ERROR",
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: dict = None
    ):
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class ValidationException(APIError):
    """Validation error"""

    def __init__(self, message: str, details: dict = None):
        super().__init__(
            message=message,
            code="VALIDATION_ERROR",
            status_code=status.HTTP_400_BAD_REQUEST,
            details=details
        )


class AuthenticationException(APIError):
    """Authentication error"""

    def __init__(self, message: str = "Authentication required"):
        super().__init__(
            message=message,
            code="AUTHENTICATION_ERROR",
            status_code=status.HTTP_401_UNAUTHORIZED
        )


class AuthorizationException(APIError):
    """Authorization error"""

    def __init__(self, message: str = "Insufficient permissions"):
        super().__init__(
            message=message,
            code="AUTHORIZATION_ERROR",
            status_code=status.HTTP_403_FORBIDDEN
        )


class NotFoundException(APIError):
    """Resource not found"""

    def __init__(self, resource: str, resource_id: Union[int, str] = None):
        message = f"{resource} not found"
        if resource_id:
            message += f" (id: {resource_id})"

        super().__init__(
            message=message,
            code="NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND
        )


class ConflictException(APIError):
    """Resource conflict"""

    def __init__(self, message: str, details: dict = None):
        super().__init__(
            message=message,
            code="CONFLICT",
            status_code=status.HTTP_409_CONFLICT,
            details=details
        )


class RateLimitException(APIError):
    """Rate limit exceeded"""

    def __init__(self, message: str = "Rate limit exceeded"):
        super().__init__(
            message=message,
            code="RATE_LIMIT_EXCEEDED",
            status_code=status.HTTP_429_TOO_MANY_REQUESTS
        )


class ExternalServiceException(APIError):
    """External service error (OpenAI, Google, etc.)"""

    def __init__(self, service: str, message: str):
        super().__init__(
            message=f"{service} error: {message}",
            code="EXTERNAL_SERVICE_ERROR",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            details={"service": service}
        )


class InsufficientCreditsException(APIError):
    """Insufficient credits"""

    def __init__(self, required: int, available: int):
        super().__init__(
            message=f"Insufficient credits (required: {required}, available: {available})",
            code="INSUFFICIENT_CREDITS",
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            details={"required": required, "available": available}
        )


def create_error_response(
    code: str,
    message: str,
    status_code: int,
    details: dict = None
) -> JSONResponse:
    """Create standardized error response"""
    return JSONResponse(
        status_code=status_code,
        content={
            "error": {
                "code": code,
                "message": message,
                "details": details or {},
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        }
    )


def setup_error_handlers(app: FastAPI):
    """
    Register global error handlers for the FastAPI app.

    This ensures all errors return consistent JSON responses.
    """

    @app.exception_handler(APIError)
    async def api_error_handler(request: Request, exc: APIError):
        """Handle custom API errors"""
        logger.error(
            f"API Error: {exc.code} - {exc.message}",
            extra={"code": exc.code, "details": exc.details}
        )

        return create_error_response(
            code=exc.code,
            message=exc.message,
            status_code=exc.status_code,
            details=exc.details
        )

    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(request: Request, exc: RequestValidationError):
        """Handle Pydantic validation errors"""
        errors = []
        for error in exc.errors():
            errors.append({
                "field": ".".join(str(loc) for loc in error["loc"]),
                "message": error["msg"],
                "type": error["type"]
            })

        logger.warning(f"Validation error: {errors}")

        return create_error_response(
            code="VALIDATION_ERROR",
            message="Request validation failed",
            status_code=status.HTTP_400_BAD_REQUEST,
            details={"errors": errors}
        )

    @app.exception_handler(Exception)
    async def generic_error_handler(request: Request, exc: Exception):
        """Handle unexpected errors"""
        logger.exception("Unhandled exception occurred")

        # Don't expose internal errors in production
        from config.settings import settings
        if settings.ENVIRONMENT == "production":
            message = "An internal error occurred"
        else:
            message = str(exc)

        return create_error_response(
            code="INTERNAL_SERVER_ERROR",
            message=message,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
