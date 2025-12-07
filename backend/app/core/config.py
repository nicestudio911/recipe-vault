from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # App settings
    app_name: str = "Recipe Vault API"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # Supabase settings
    supabase_url: str
    supabase_key: str
    supabase_service_key: str
    
    # CORS settings
    cors_origins: list[str] = ["*"]
    
    # OCR settings
    tesseract_cmd: str = "/usr/bin/tesseract"
    ocr_method: str = "vision"  # Options: "vision" (OpenAI Vision - recommended), "hybrid" (Tesseract + OpenAI text), "tesseract" (Tesseract only)
    
    # OpenAI settings
    openai_api_key: Optional[str] = None
    openai_model: str = "gpt-4o-mini"  # Use gpt-4o-mini for cost efficiency, can be changed to gpt-4o
    openai_vision_model: str = "gpt-4o-mini"  # Vision model (gpt-4o-mini is cheaper, gpt-4o is more accurate)
    
    # Storage settings
    storage_bucket: str = "recipe-images"
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    
    # API settings
    api_v1_prefix: str = "/api/v1"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()

