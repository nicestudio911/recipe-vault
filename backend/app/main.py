from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import recipes, ocr, url_parser, auth

app = FastAPI(
    title=settings.app_name,
    description="Backend API for Recipe Vault mobile app",
    version=settings.app_version,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(recipes.router, prefix=settings.api_v1_prefix)
app.include_router(ocr.router, prefix=settings.api_v1_prefix)
app.include_router(url_parser.router, prefix=settings.api_v1_prefix)
app.include_router(auth.router, prefix=settings.api_v1_prefix)


@app.get("/")
async def root():
    return {"message": "Recipe Vault API", "version": settings.app_version}


@app.get("/health")
async def health():
    return {"status": "healthy"}
