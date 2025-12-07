try:
    import pytesseract
    from PIL import Image
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False

try:
    from app.services.openai_recipe_extractor import OpenAIRecipeExtractor
    OPENAI_AVAILABLE = True
except (ImportError, ValueError):
    OPENAI_AVAILABLE = False

import io
import json
from typing import Dict, Optional
from app.services.recipe_parser import RecipeParser
from app.core.config import settings


class OCRService:
    def __init__(self, use_openai: bool = True):
        """
        Initialize OCR service.
        
        Args:
            use_openai: If True and OpenAI is available, use OpenAI to parse OCR text.
                       If False, use traditional RecipeParser.
        """
        if not OCR_AVAILABLE:
            raise ImportError("pytesseract and Pillow are required for OCR functionality")
        
        self.use_openai = use_openai and OPENAI_AVAILABLE
        self.openai_extractor = None
        
        if self.use_openai:
            try:
                self.openai_extractor = OpenAIRecipeExtractor()
            except (ValueError, ImportError):
                # Fall back to traditional parsing
                self.use_openai = False
        
        # Fallback parser
        if not self.use_openai:
            self.parser = RecipeParser()
        
        # Set Tesseract command path
        if settings.tesseract_cmd:
            pytesseract.pytesseract.tesseract_cmd = settings.tesseract_cmd
        
        # Verify Tesseract is accessible
        try:
            pytesseract.get_tesseract_version()
        except Exception as e:
            raise RuntimeError(
                f"Tesseract OCR is not installed or not accessible at '{settings.tesseract_cmd}'. "
                f"Please install Tesseract: sudo dnf install -y tesseract tesseract-langpack-eng (Fedora) "
                f"or sudo apt-get install -y tesseract-ocr (Ubuntu). "
                f"Error: {str(e)}"
            )

    async def process_image(self, image_data: bytes, use_openai_parsing: Optional[bool] = None) -> Dict:
        """
        Process image with OCR and extract recipe data.
        
        Args:
            image_data: Image bytes
            use_openai_parsing: Override the default OpenAI parsing setting for this call
        
        Returns:
            Dict with 'text' (extracted text) and 'recipe' (structured recipe data)
        """
        try:
            # Read image
            image = Image.open(io.BytesIO(image_data))
            
            # Run OCR with Tesseract (free)
            text = pytesseract.image_to_string(image)
            
            # Determine if we should use OpenAI for parsing
            should_use_openai = use_openai_parsing if use_openai_parsing is not None else self.use_openai
            
            # Parse recipe from text
            if should_use_openai and self.openai_extractor:
                # Use OpenAI to parse the extracted text (cheaper than Vision API)
                recipe_data = await self._parse_with_openai(text)
            else:
                # Use traditional parser
                recipe_data = self.parser.parse_from_text(text)
            
            return {
                "text": text,
                "recipe": recipe_data,
            }
        except Exception as e:
            raise ValueError(f"OCR processing failed: {str(e)}")
    
    async def _parse_with_openai(self, text: str) -> Dict:
        """Parse OCR text using OpenAI (cheaper than Vision API)"""
        # Truncate text if too long
        max_chars = 8000
        if len(text) > max_chars:
            text = text[:max_chars] + "..."
        
        prompt = f"""Extract recipe information from the following OCR text and return it as a JSON object.

OCR Text:
{text}

Extract the recipe information and return a JSON object with the following structure:
{{
    "title": "Recipe title",
    "description": "Recipe description or summary (optional)",
    "prep_time": <number in minutes, or null>,
    "cook_time": <number in minutes, or null>,
    "servings": <number, or null>,
    "difficulty": "easy" | "medium" | "hard" | null,
    "cuisine_type": "Cuisine type (e.g., Italian, Mexican, etc.)" | null,
    "image_url": null,
    "source_url": null,
    "ingredients": [
        {{
            "name": "Ingredient name",
            "amount": <number or null>,
            "unit": "Unit (e.g., cups, tbsp, etc.)" | null,
            "order_index": <number starting from 1>
        }}
    ],
    "steps": [
        {{
            "description": "Step instruction",
            "order_index": <number starting from 1>,
            "duration": <number in minutes, or null>,
            "temperature": <number in Celsius, or null>
        }}
    ]
}}

Important:
- Return ONLY valid JSON, no markdown formatting, no code blocks
- If information is not available, use null
- Ensure all ingredients and steps have proper order_index values
- Parse ingredient amounts and units from the text (e.g., "2 cups flour" -> amount: 2, unit: "cups", name: "flour")
- Extract prep_time and cook_time as numbers in minutes
- If difficulty is mentioned, map it to "easy", "medium", or "hard"
- The OCR text may have some errors, try to interpret it correctly
"""

        try:
            response = self.openai_extractor.client.chat.completions.create(
                model=self.openai_extractor.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a recipe extraction assistant. Extract structured recipe data from OCR text and return it as valid JSON only."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            
            content = response.choices[0].message.content
            recipe_data = json.loads(content)
            
            # Use the same normalization as OpenAIRecipeExtractor
            # We'll reuse the normalization logic
            return self._normalize_recipe_data(recipe_data)
            
        except Exception as e:
            # Fall back to traditional parser if OpenAI fails
            return self.parser.parse_from_text(text)
    
    def _normalize_recipe_data(self, data: Dict) -> Dict:
        """Normalize recipe data (reusing logic from OpenAIRecipeExtractor)"""
        import re
        
        def parse_time(value):
            if value is None:
                return None
            if isinstance(value, (int, float)):
                return int(value)
            if isinstance(value, str):
                match = re.search(r'(\d+)', str(value))
                if match:
                    num = int(match.group(1))
                    if 'hour' in value.lower() or 'hr' in value.lower():
                        return num * 60
                    return num
            return None
        
        def parse_int(value):
            if value is None:
                return None
            if isinstance(value, (int, float)):
                return int(value)
            if isinstance(value, str):
                match = re.search(r'(\d+)', str(value))
                if match:
                    return int(match.group(1))
            return None
        
        def normalize_difficulty(value):
            if value is None:
                return None
            value_lower = str(value).lower()
            if any(word in value_lower for word in ["easy", "simple", "beginner"]):
                return "easy"
            if any(word in value_lower for word in ["medium", "moderate", "intermediate"]):
                return "medium"
            if any(word in value_lower for word in ["hard", "difficult", "advanced", "expert"]):
                return "hard"
            return None
        
        normalized = {
            "title": data.get("title", "Untitled Recipe"),
            "description": data.get("description"),
            "prep_time": parse_time(data.get("prep_time")),
            "cook_time": parse_time(data.get("cook_time")),
            "servings": parse_int(data.get("servings")),
            "difficulty": normalize_difficulty(data.get("difficulty")),
            "cuisine_type": data.get("cuisine_type"),
            "image_url": data.get("image_url"),
            "source_url": data.get("source_url"),
            "ingredients": self._normalize_ingredients(data.get("ingredients", [])),
            "steps": self._normalize_steps(data.get("steps", []))
        }
        
        return normalized
    
    def _normalize_ingredients(self, ingredients: list) -> list:
        """Normalize ingredients list"""
        normalized = []
        for i, ing in enumerate(ingredients, start=1):
            if isinstance(ing, dict):
                normalized.append({
                    "name": str(ing.get("name", "")).strip(),
                    "amount": self._parse_float(ing.get("amount")),
                    "unit": str(ing.get("unit", "")).strip() if ing.get("unit") else None,
                    "order_index": int(ing.get("order_index", i))
                })
        return normalized
    
    def _normalize_steps(self, steps: list) -> list:
        """Normalize steps list"""
        normalized = []
        for i, step in enumerate(steps, start=1):
            if isinstance(step, dict):
                normalized.append({
                    "description": str(step.get("description", "")).strip(),
                    "order_index": int(step.get("order_index", i)),
                    "duration": self._parse_time(step.get("duration")),
                    "temperature": self._parse_int(step.get("temperature"))
                })
        return normalized
    
    def _parse_time(self, value):
        """Parse time value to minutes"""
        import re
        if value is None:
            return None
        if isinstance(value, (int, float)):
            return int(value)
        if isinstance(value, str):
            match = re.search(r'(\d+)', str(value))
            if match:
                num = int(match.group(1))
                if 'hour' in value.lower() or 'hr' in value.lower():
                    return num * 60
                return num
        return None
    
    def _parse_int(self, value):
        """Parse value to int"""
        import re
        if value is None:
            return None
        if isinstance(value, (int, float)):
            return int(value)
        if isinstance(value, str):
            match = re.search(r'(\d+)', str(value))
            if match:
                return int(match.group(1))
        return None
    
    def _parse_float(self, value):
        """Parse value to float"""
        if value is None:
            return None
        if isinstance(value, (int, float)):
            return float(value)
        if isinstance(value, str):
            try:
                return float(value)
            except ValueError:
                return None
        return None

    async def process_image_file(self, file_path: str) -> Dict:
        """Process image file with OCR"""
        with open(file_path, "rb") as f:
            image_data = f.read()
        return await self.process_image(image_data)
