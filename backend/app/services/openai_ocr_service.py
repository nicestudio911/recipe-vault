"""
OpenAI-based OCR service for recipe extraction from images.
Supports two methods:
1. Vision API: Direct image analysis (more accurate, more expensive)
2. Hybrid: Tesseract OCR + OpenAI text parsing (cheaper, good accuracy)
"""
import base64
import io
import json
import re
from typing import Dict, Optional
from PIL import Image
from openai import OpenAI
from app.core.config import settings


class OpenAIOCRService:
    """Extract recipes from images using OpenAI Vision API"""
    
    def __init__(self):
        if not settings.openai_api_key:
            raise ValueError("OpenAI API key is not configured. Set OPENAI_API_KEY in environment variables.")
        self.client = OpenAI(api_key=settings.openai_api_key)
        self.model = settings.openai_model
    
    async def extract_from_image_vision(self, image_data: bytes) -> Dict:
        """
        Extract recipe directly from image using OpenAI Vision API.
        More accurate but more expensive.
        
        Returns recipe data in format matching RecipeCreate schema.
        """
        # Encode image to base64
        image_base64 = base64.b64encode(image_data).decode('utf-8')
        
        # Determine image format
        image = Image.open(io.BytesIO(image_data))
        image_format = image.format.lower() if image.format else 'jpeg'
        mime_type = f"image/{image_format}"
        
        prompt = """Extract recipe information from this image and return it as a JSON object.

Extract the recipe information and return a JSON object with the following structure:
{
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
        {
            "name": "Ingredient name",
            "amount": <number or null>,
            "unit": "Unit (e.g., cups, tbsp, etc.)" | null,
            "order_index": <number starting from 1>
        }
    ],
    "steps": [
        {
            "description": "Step instruction",
            "order_index": <number starting from 1>,
            "duration": <number in minutes, or null>,
            "temperature": <number in Celsius, or null>
        }
    ]
}

Important:
- Return ONLY valid JSON, no markdown formatting, no code blocks
- If information is not available, use null
- Ensure all ingredients and steps have proper order_index values
- Parse ingredient amounts and units from the text (e.g., "2 cups flour" -> amount: 2, unit: "cups", name: "flour")
- Extract prep_time and cook_time as numbers in minutes
- If difficulty is mentioned, map it to "easy", "medium", or "hard"
- Read all text carefully from the image, including handwritten text if present
"""

        try:
            # Use gpt-4o-mini for vision (cheaper) or gpt-4o (more accurate)
            vision_model = settings.openai_vision_model or "gpt-4o-mini"
            
            response = self.client.chat.completions.create(
                model=vision_model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a recipe extraction assistant. Extract structured recipe data from images and return it as valid JSON only."
                    },
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": prompt
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:{mime_type};base64,{image_base64}"
                                }
                            }
                        ]
                    }
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            
            # Parse the JSON response
            content = response.choices[0].message.content
            recipe_data = json.loads(content)
            
            # Normalize the data
            recipe_data = self._normalize_recipe_data(recipe_data)
            
            return {
                "text": "Extracted from image using OpenAI Vision",
                "recipe": recipe_data,
            }
            
        except Exception as e:
            raise ValueError(f"OpenAI Vision API call failed: {str(e)}")
    
    def _normalize_recipe_data(self, data: Dict) -> Dict:
        """Normalize and validate recipe data to match expected schema"""
        import re
        
        normalized = {
            "title": data.get("title", "Untitled Recipe"),
            "description": data.get("description"),
            "prep_time": self._parse_time(data.get("prep_time")),
            "cook_time": self._parse_time(data.get("cook_time")),
            "servings": self._parse_int(data.get("servings")),
            "difficulty": self._normalize_difficulty(data.get("difficulty")),
            "cuisine_type": data.get("cuisine_type"),
            "image_url": data.get("image_url"),
            "source_url": data.get("source_url"),
            "ingredients": self._normalize_ingredients(data.get("ingredients", [])),
            "steps": self._normalize_steps(data.get("steps", []))
        }
        
        return normalized
    
    def _parse_time(self, value) -> Optional[int]:
        """Parse time value to minutes (int)"""
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
    
    def _parse_int(self, value) -> Optional[int]:
        """Parse value to int"""
        if value is None:
            return None
        if isinstance(value, (int, float)):
            return int(value)
        if isinstance(value, str):
            match = re.search(r'(\d+)', str(value))
            if match:
                return int(match.group(1))
        return None
    
    def _normalize_difficulty(self, value) -> Optional[str]:
        """Normalize difficulty to easy/medium/hard"""
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
    
    def _parse_float(self, value) -> Optional[float]:
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

