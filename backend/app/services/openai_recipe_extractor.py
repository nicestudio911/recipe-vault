"""
OpenAI-based recipe extraction service.
Extracts structured recipe data from URLs using OpenAI API.
"""
import json
import re
import httpx
from typing import Dict, Optional, List
from bs4 import BeautifulSoup
from openai import OpenAI
from app.core.config import settings


class OpenAIRecipeExtractor:
    """Extract recipes from URLs using OpenAI API"""
    
    def __init__(self):
        if not settings.openai_api_key:
            raise ValueError("OpenAI API key is not configured. Set OPENAI_API_KEY in environment variables.")
        self.client = OpenAI(api_key=settings.openai_api_key)
        self.model = settings.openai_model
    
    async def extract_from_url(self, url: str) -> Dict:
        """
        Extract recipe from URL using OpenAI API.
        
        Returns recipe data in format matching RecipeCreate schema:
        {
            "title": str,
            "description": Optional[str],
            "prep_time": Optional[int],  # in minutes
            "cook_time": Optional[int],  # in minutes
            "servings": Optional[int],
            "difficulty": Optional[str],  # "easy", "medium", or "hard"
            "cuisine_type": Optional[str],
            "image_url": Optional[str],
            "source_url": str,
            "ingredients": List[{
                "name": str,
                "amount": Optional[float],
                "unit": Optional[str],
                "order_index": int
            }],
            "steps": List[{
                "description": str,
                "order_index": int,
                "duration": Optional[int],  # in minutes
                "temperature": Optional[int]  # in Celsius
            }]
        }
        """
        # Fetch URL content
        html_content = await self._fetch_url_content(url)
        
        # Extract text content from HTML
        text_content = self._extract_text_from_html(html_content)
        
        # Use OpenAI to extract structured recipe data
        recipe_data = await self._extract_recipe_with_openai(url, text_content)
        
        return recipe_data
    
    async def _fetch_url_content(self, url: str) -> str:
        """Fetch HTML content from URL"""
        try:
            async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
                response = await client.get(url)
                response.raise_for_status()
                return response.text
        except Exception as e:
            raise ValueError(f"Failed to fetch URL content: {str(e)}")
    
    def _extract_text_from_html(self, html_content: str) -> str:
        """Extract clean text content from HTML"""
        soup = BeautifulSoup(html_content, "html.parser")
        
        # Remove script and style elements
        for script in soup(["script", "style", "meta", "link"]):
            script.decompose()
        
        # Get text
        text = soup.get_text()
        
        # Clean up whitespace
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        text = " ".join(chunk for chunk in chunks if chunk)
        
        return text
    
    async def _extract_recipe_with_openai(self, url: str, text_content: str) -> Dict:
        """Use OpenAI API to extract structured recipe data"""
        
        # Truncate text if too long (to avoid token limits)
        max_chars = 8000  # Leave room for prompt and response
        if len(text_content) > max_chars:
            text_content = text_content[:max_chars] + "..."
        
        prompt = f"""Extract recipe information from the following web page content and return it as a JSON object.

URL: {url}

Web page content:
{text_content}

Extract the recipe information and return a JSON object with the following structure:
{{
    "title": "Recipe title",
    "description": "Recipe description or summary (optional)",
    "prep_time": <number in minutes, or null>,
    "cook_time": <number in minutes, or null>,
    "servings": <number, or null>,
    "difficulty": "easy" | "medium" | "hard" | null,
    "cuisine_type": "Cuisine type (e.g., Italian, Mexican, etc.)" | null,
    "image_url": "URL to recipe image" | null,
    "source_url": "{url}",
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
- Include the source_url as the provided URL
"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a recipe extraction assistant. Extract structured recipe data from web content and return it as valid JSON only."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.3,  # Lower temperature for more consistent extraction
                response_format={"type": "json_object"}  # Ensure JSON response
            )
            
            # Parse the JSON response
            content = response.choices[0].message.content
            recipe_data = json.loads(content)
            
            # Validate and normalize the data
            recipe_data = self._normalize_recipe_data(recipe_data, url)
            
            return recipe_data
            
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse OpenAI response as JSON: {str(e)}")
        except Exception as e:
            raise ValueError(f"OpenAI API call failed: {str(e)}")
    
    def _normalize_recipe_data(self, data: Dict, url: str) -> Dict:
        """Normalize and validate recipe data to match expected schema"""
        
        # Ensure required fields
        normalized = {
            "title": data.get("title", "Untitled Recipe"),
            "description": data.get("description"),
            "prep_time": self._parse_time(data.get("prep_time")),
            "cook_time": self._parse_time(data.get("cook_time")),
            "servings": self._parse_int(data.get("servings")),
            "difficulty": self._normalize_difficulty(data.get("difficulty")),
            "cuisine_type": data.get("cuisine_type"),
            "image_url": data.get("image_url"),
            "source_url": url,
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
            # Try to parse string like "30 minutes", "1 hour", etc.
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
            import re
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
    
    def _normalize_ingredients(self, ingredients: List) -> List[Dict]:
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
    
    def _normalize_steps(self, steps: List) -> List[Dict]:
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

