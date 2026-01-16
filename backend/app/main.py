"""
Main FastAPI application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import init_db, close_db
# Import models so Base.metadata knows about them
from app import models  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    await init_db()
    print("✅ Database initialized")
    yield
    # Shutdown
    await close_db()
    print("✅ Database connections closed")


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="API for connecting food donors with verified NGOs",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "healthy",
        "environment": settings.ENVIRONMENT
    }


@app.get("/health")
async def health():
    """Detailed health check"""
    return {
        "status": "healthy",
        "database": "connected"
    }


# Include routers
from app.routers import auth, donors, ngos, ngo_locations, admin, donations, notifications, search, ratings
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(donors.router, prefix="/api/donors", tags=["Donors"])
app.include_router(ngos.router, prefix="/api/ngos", tags=["NGOs"])
app.include_router(ngo_locations.router, prefix="/api/ngos", tags=["NGO Locations"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(donations.router, prefix="/api/donations", tags=["Donations"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(search.router, prefix="/api/search", tags=["Search"])
app.include_router(ratings.router, prefix="/api/ratings", tags=["Ratings"])

# All routers included! Backend complete! 🎉
