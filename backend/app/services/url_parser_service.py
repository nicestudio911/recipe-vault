try:
    import trafilatura
    TRAFILATURA_AVAILABLE = True
except ImportError:
    TRAFILATURA_AVAILABLE = False

try:
    from app.services.openai_recipe_extractor import OpenAIRecipeExtractor
    OPENAI_AVAILABLE = True
except (ImportError, ValueError):
    OPENAI_AVAILABLE = False

import httpx
from bs4 import BeautifulSoup
from typing import Dict, Optional
from app.services.recipe_parser import RecipeParser
from app.core.config import settings


class URLParserService:
    def __init__(self, use_openai: bool = True):
        """
        Initialize URL parser service.
        
        Args:
            use_openai: If True, use OpenAI API for extraction (requires OPENAI_API_KEY).
                       If False or OpenAI is unavailable, falls back to traditional parsing.
        """
        self.use_openai = use_openai and OPENAI_AVAILABLE
        self.openai_extractor = None
        self.parser = None
        
        # Initialize OpenAI extractor if requested and available
        if self.use_openai:
            try:
                self.openai_extractor = OpenAIRecipeExtractor()
            except (ValueError, ImportError) as e:
                # Fall back to traditional parsing if OpenAI is not configured
                self.use_openai = False
        
        # Initialize fallback parser (traditional method) if needed
        # Always initialize it if trafilatura is available, even if OpenAI is used,
        # so we can fall back if OpenAI fails
        if not self.use_openai or TRAFILATURA_AVAILABLE:
            if not TRAFILATURA_AVAILABLE:
                if not self.use_openai:
                    raise ImportError(
                        "Neither OpenAI API key nor trafilatura is available. "
                        "Please configure OPENAI_API_KEY or install trafilatura."
                    )
            else:
                self.parser = RecipeParser()

    async def parse_url(self, url: str) -> Dict:
        """
        Parse recipe from URL.
        
        Uses OpenAI API if available and configured, otherwise falls back to
        traditional parsing with trafilatura and recipe parser.
        """
        # Try OpenAI extraction first if available
        if self.use_openai and self.openai_extractor:
            try:
                recipe_data = await self.openai_extractor.extract_from_url(url)
                return recipe_data
            except Exception as e:
                # If OpenAI fails, fall back to traditional parsing
                if self.parser is None:
                    # If we don't have fallback parser, raise the error
                    raise ValueError(f"OpenAI extraction failed and no fallback available: {str(e)}")
                # Continue to fallback method
        
        # Fallback to traditional parsing
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(url, follow_redirects=True)
                response.raise_for_status()
                html_content = response.text

            # Extract content using trafilatura
            downloaded = trafilatura.fetch_url(url)
            text = trafilatura.extract(downloaded) or ""

            # Parse HTML for structured data
            soup = BeautifulSoup(html_content, "html.parser")

            # Try to find structured recipe data (JSON-LD, microdata, etc.)
            recipe_data = self.parser.parse_from_html(soup, text)

            return recipe_data
        except Exception as e:
            raise ValueError(f"URL parsing failed: {str(e)}")
