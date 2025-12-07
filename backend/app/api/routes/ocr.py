from fastapi import APIRouter, File, UploadFile, HTTPException, Query
from typing import Optional
from app.core.config import settings

router = APIRouter(prefix="/ocr", tags=["ocr"])


@router.post("/")
async def ocr_image(
    file: UploadFile = File(...),
    method: Optional[str] = Query(
        None,
        description="OCR method: 'vision' (OpenAI Vision, recommended), 'hybrid' (Tesseract + OpenAI, requires Tesseract), 'tesseract' (Tesseract only, requires Tesseract)"
    )
):
    """
    Extract recipe from image using OCR.
    
    Methods:
    - vision (default): Uses OpenAI Vision API directly (more accurate, recommended)
    - hybrid: Uses Tesseract OCR (free) + OpenAI text parsing (cheaper, requires Tesseract)
    - tesseract: Uses Tesseract OCR only (free, basic parsing, requires Tesseract)
    """
    # Use method from query param, or fall back to config, or default to vision
    ocr_method = method or settings.ocr_method or "vision"
    
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        image_data = await file.read()
        
        # Try OpenAI Vision first (default and recommended)
        if ocr_method == "vision" or ocr_method is None:
            try:
                from app.services.openai_ocr_service import OpenAIOCRService
                service = OpenAIOCRService()
                result = await service.extract_from_image_vision(image_data)
                return result
            except (ImportError, ValueError) as e:
                raise HTTPException(
                    status_code=503,
                    detail=f"OpenAI Vision API not available: {str(e)}. Please configure OPENAI_API_KEY in backend/.env file."
                )
        
        elif ocr_method == "tesseract":
            # Use Tesseract only (traditional method)
            try:
                from app.services.ocr_service import OCRService
                service = OCRService(use_openai=False)
                result = await service.process_image(image_data, use_openai_parsing=False)
                return result
            except ImportError:
                raise HTTPException(
                    status_code=503,
                    detail="OCR service not available. Please install pytesseract and Pillow."
                )
        
        else:  # hybrid (default)
            # Use Tesseract + OpenAI text parsing (cheaper)
            try:
                from app.services.ocr_service import OCRService
                service = OCRService(use_openai=True)
                result = await service.process_image(image_data, use_openai_parsing=True)
                return result
            except ImportError:
                raise HTTPException(
                    status_code=503,
                    detail="OCR service not available. Please install pytesseract and Pillow."
                )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(e)}")

