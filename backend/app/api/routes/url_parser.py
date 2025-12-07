from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl

router = APIRouter(prefix="/parse-url", tags=["url-parser"])


class URLParseRequest(BaseModel):
    url: HttpUrl


@router.post("/")
async def parse_recipe_url(request: URLParseRequest):
    """Parse recipe from URL"""
    url_str = str(request.url)
    
    # Check if it's an Instagram URL
    if "instagram.com" in url_str and ("/p/" in url_str or "/reel/" in url_str):
        try:
            from app.services.instagram_parser_service import InstagramParserService
            service = InstagramParserService()
            recipe = await service.extract_from_instagram_url(url_str)
            return recipe
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Instagram parsing failed: {str(e)}")
    
    # Regular URL parsing
    try:
        from app.services.url_parser_service import URLParserService
    except ImportError:
        raise HTTPException(status_code=503, detail="URL parsing service not available. Please install trafilatura.")
    
    try:
        service = URLParserService()
        recipe = await service.parse_url(url_str)
        return recipe
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"URL parsing failed: {str(e)}")

