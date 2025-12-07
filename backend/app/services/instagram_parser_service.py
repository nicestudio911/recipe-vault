"""
Instagram recipe extraction service.
Extracts recipe information from Instagram post descriptions using OpenAI.
"""
import re
import httpx
from typing import Dict, Optional
from bs4 import BeautifulSoup
from app.services.openai_recipe_extractor import OpenAIRecipeExtractor
from app.core.config import settings


class InstagramParserService:
    """Extract recipes from Instagram post descriptions"""
    
    def __init__(self):
        self.openai_extractor = None
        try:
            if settings.openai_api_key:
                self.openai_extractor = OpenAIRecipeExtractor()
        except (ValueError, ImportError):
            pass
    
    async def extract_from_instagram_url(self, url: str) -> Dict:
        """
        Extract recipe from Instagram post URL.
        
        Steps:
        1. Fetch the Instagram post page
        2. Extract the description/caption text
        3. Use OpenAI to parse recipe information from the description
        
        Returns recipe data in format matching RecipeCreate schema.
        """
        # Validate Instagram URL
        if not self._is_valid_instagram_url(url):
            raise ValueError("Invalid Instagram URL. Must be a post or reel URL.")
        
        # Fetch Instagram post page
        description_text = await self._fetch_instagram_description(url)
        
        if not description_text:
            raise ValueError("Could not extract description from Instagram post. The post may be private or the URL is invalid.")
        
        # Use OpenAI to extract recipe information from description
        if self.openai_extractor:
            recipe_data = await self._parse_description_with_openai(url, description_text)
        else:
            # Fallback: basic parsing without OpenAI
            recipe_data = self._parse_description_basic(description_text, url)
        
        return recipe_data
    
    def _is_valid_instagram_url(self, url: str) -> bool:
        """Validate Instagram URL format"""
        pattern = r'^https?://(www\.)?instagram\.com/(p|reel)/[a-zA-Z0-9_-]+/?'
        return bool(re.match(pattern, url))
    
    async def _fetch_instagram_description(self, url: str) -> Optional[str]:
        """
        Fetch Instagram post and extract description.
        
        Note: Instagram doesn't provide a public API, so we try to extract
        from the HTML meta tags or embedded JSON-LD data.
        """
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            }
            
            async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
                response = await client.get(url, headers=headers)
                response.raise_for_status()
                html_content = response.text
            
            # Parse HTML
            soup = BeautifulSoup(html_content, "html.parser")
            
            # Try to extract from meta tags
            description = None
            
            # Method 1: Try og:description meta tag
            og_desc = soup.find("meta", property="og:description")
            if og_desc and og_desc.get("content"):
                description = og_desc.get("content")
            
            # Method 2: Try description meta tag
            if not description:
                desc_tag = soup.find("meta", attrs={"name": "description"})
                if desc_tag and desc_tag.get("content"):
                    description = desc_tag.get("content")
            
            # Method 3: Try to find JSON-LD with description
            if not description:
                scripts = soup.find_all("script", type="application/ld+json")
                for script in scripts:
                    try:
                        import json
                        data = json.loads(script.string)
                        if isinstance(data, dict):
                            # Look for description in various places
                            description = (
                                data.get("description") or
                                data.get("caption") or
                                (data.get("articleBody") if isinstance(data.get("articleBody"), str) else None)
                            )
                            if description:
                                break
                        elif isinstance(data, list):
                            for item in data:
                                if isinstance(item, dict):
                                    description = (
                                        item.get("description") or
                                        item.get("caption") or
                                        (item.get("articleBody") if isinstance(item.get("articleBody"), str) else None)
                                    )
                                    if description:
                                        break
                            if description:
                                break
                    except (json.JSONDecodeError, AttributeError):
                        continue
            
            # Method 4: Try to extract from script tags that contain post data
            if not description:
                scripts = soup.find_all("script")
                for script in scripts:
                    script_text = script.string or ""
                    # Look for common Instagram data patterns
                    if "edge_media_to_caption" in script_text or "caption" in script_text.lower():
                        # Try to extract caption from JavaScript object
                        caption_match = re.search(r'"caption":\s*"([^"]+)"', script_text)
                        if caption_match:
                            description = caption_match.group(1)
                            # Unescape common escape sequences
                            description = description.replace('\\n', '\n').replace('\\"', '"').replace('\\/', '/')
                            break
                        
                        # Try another pattern
                        caption_match = re.search(r'caption["\']?\s*:\s*["\']([^"\']+)["\']', script_text)
                        if caption_match:
                            description = caption_match.group(1)
                            description = description.replace('\\n', '\n').replace('\\"', '"').replace('\\/', '/')
                            break
            
            return description
            
        except Exception as e:
            raise ValueError(f"Failed to fetch Instagram post: {str(e)}")
    
    async def _parse_description_with_openai(self, url: str, description: str) -> Dict:
        """Parse Instagram description using OpenAI"""
        # Truncate if too long
        max_chars = 8000
        if len(description) > max_chars:
            description = description[:max_chars] + "..."
        
        prompt = f"""Extract recipe information from the following Instagram post description and return it as a JSON object.

Instagram Post URL: {url}

Post Description:
{description}

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
- Instagram descriptions often have emojis, hashtags, and mentions - extract only the recipe information
- Look for ingredients lists (often marked with emojis like 🥄, 📝, or bullet points)
- Look for instructions/steps (often marked with numbers, emojis, or "Step 1", "Step 2", etc.)
"""

        try:
            import json
            response = self.openai_extractor.client.chat.completions.create(
                model=self.openai_extractor.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a recipe extraction assistant. Extract structured recipe data from Instagram post descriptions and return it as valid JSON only. Ignore hashtags, mentions, and emojis that are not part of the recipe content."
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
            
            # Normalize the data using the same method as OpenAIRecipeExtractor
            recipe_data = self._normalize_recipe_data(recipe_data, url)
            
            return recipe_data
            
        except Exception as e:
            raise ValueError(f"Failed to parse Instagram description with OpenAI: {str(e)}")
    
    def _parse_description_basic(self, description: str, url: str) -> Dict:
        """Basic parsing without OpenAI (fallback)"""
        # Simple extraction - just use the description as-is
        return {
            "title": "Recipe from Instagram",
            "description": description,
            "source_url": url,
            "ingredients": [],
            "steps": [],
        }
    
    def _normalize_recipe_data(self, data: Dict, url: str) -> Dict:
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
            "title": data.get("title", "Recipe from Instagram"),
            "description": data.get("description"),
            "prep_time": parse_time(data.get("prep_time")),
            "cook_time": parse_time(data.get("cook_time")),
            "servings": parse_int(data.get("servings")),
            "difficulty": normalize_difficulty(data.get("difficulty")),
            "cuisine_type": data.get("cuisine_type"),
            "image_url": data.get("image_url"),
            "source_url": url,
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

