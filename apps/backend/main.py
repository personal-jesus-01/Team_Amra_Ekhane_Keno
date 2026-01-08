"""
SlideBanai FastAPI Application Entry Point

This is the main application file that initializes the FastAPI app with all
middleware, routers, and configurations.

Architecture: Three-tier MVC with dependency injection
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from contextlib import asynccontextmanager
import logging

from config.settings import settings
from config.logging_config import setup_logging
from middleware.auth_middleware import AuthMiddleware
from middleware.error_middleware import setup_error_handlers
from middleware.logging_middleware import LoggingMiddleware
from middleware.rate_limit_middleware import setup_rate_limiting

# Import controllers (routers)
from controllers.auth_controller import router as auth_router
from controllers.presentation_controller import router as presentation_router
from controllers.coach_controller import router as coach_router
from controllers.template_controller import router as template_router
from controllers.collaboration_controller import router as collaboration_router
from controllers.document_controller import router as document_router
from controllers.storage_controller import router as storage_router
from controllers.analytics_controller import router as analytics_router
from controllers.health_controller import router as health_router

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan context manager.
    Handles startup and shutdown events.
    """
    # Startup
    logger.info("🚀 Starting SlideBanai API...")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Debug mode: {settings.DEBUG}")

    # Initialize external services
    from factories.supabase_factory import SupabaseClientFactory
    from factories.ai_service_factory import AIServiceFactory

    try:
        # Test Supabase connection
        supabase = SupabaseClientFactory.create_admin_client()
        logger.info("✅ Supabase connection established")

        # Test OpenAI connection
        openai_client = AIServiceFactory.create_openai_client()
        logger.info("✅ OpenAI client initialized")

    except Exception as e:
        logger.error(f"❌ Service initialization failed: {str(e)}")
        raise

    yield

    # Shutdown
    logger.info("🛑 Shutting down SlideBanai API...")


# Initialize FastAPI app
app = FastAPI(
    title="SlideBanai API",
    description="AI-powered presentation platform with speech coaching",
    version="1.0.0",
    docs_url="/api/v1/docs",
    redoc_url="/api/v1/redoc",
    openapi_url="/api/v1/openapi.json",
    lifespan=lifespan
)

# ============================================================================
# MIDDLEWARE SETUP (Order matters!)
# ============================================================================

# 1. CORS - Must be first
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# 2. GZip compression
app.add_middleware(GZipMiddleware, minimum_size=1000)

# 3. Custom logging middleware
app.add_middleware(LoggingMiddleware)

# 4. Rate limiting
setup_rate_limiting(app)

# 5. Error handling (registers exception handlers)
setup_error_handlers(app)

# ============================================================================
# ROUTERS
# ============================================================================

# API version 1
API_V1_PREFIX = "/api/v1"

# Public routes (no auth required)
app.include_router(health_router, prefix=API_V1_PREFIX, tags=["Health"])
app.include_router(auth_router, prefix=f"{API_V1_PREFIX}/auth", tags=["Authentication"])
app.include_router(template_router, prefix=f"{API_V1_PREFIX}/templates", tags=["Templates"])

# Protected routes (auth required)
app.include_router(
    presentation_router,
    prefix=f"{API_V1_PREFIX}/presentations",
    tags=["Presentations"],
    dependencies=[]  # Auth middleware applied via decorator
)

app.include_router(
    coach_router,
    prefix=f"{API_V1_PREFIX}/coach",
    tags=["AI Coach"]
)

app.include_router(
    collaboration_router,
    prefix=f"{API_V1_PREFIX}/presentations",
    tags=["Collaboration"]
)

app.include_router(
    document_router,
    prefix=f"{API_V1_PREFIX}/documents",
    tags=["Documents"]
)

app.include_router(
    storage_router,
    prefix=f"{API_V1_PREFIX}/storage",
    tags=["Storage"]
)

app.include_router(
    analytics_router,
    prefix=f"{API_V1_PREFIX}/analytics",
    tags=["Analytics"]
)

# ============================================================================
# ROOT ENDPOINT
# ============================================================================

@app.get("/")
async def root():
    """
    API root endpoint - provides basic information
    """
    return {
        "name": "SlideBanai API",
        "version": "1.0.0",
        "description": "AI-powered presentation platform with speech coaching",
        "docs": f"{settings.API_URL}/docs",
        "health": f"{settings.API_URL}/health"
    }


# ============================================================================
# RUN APPLICATION
# ============================================================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info"
    )
