import re
import json
from typing import Dict, List, Optional
from bs4 import BeautifulSoup


class RecipeParser:
    """Custom recipe parser for extracting recipe data from text and HTML"""

    def parse_from_text(self, text: str) -> Dict:
        """Parse recipe from plain text"""
        recipe = {
            "title": self._extract_title(text),
            "description": self._extract_description(text),
            "ingredients": self._extract_ingredients_from_text(text),
            "steps": self._extract_steps_from_text(text),
            "prep_time": self._extract_time(text, "prep"),
            "cook_time": self._extract_time(text, "cook"),
            "servings": self._extract_servings(text),
        }
        return recipe

    def parse_from_html(self, soup: BeautifulSoup, text: str) -> Dict:
        """Parse recipe from HTML"""
        # Try JSON-LD first
        json_ld = self._extract_json_ld(soup)
        if json_ld:
            return self._parse_json_ld(json_ld)

        # Try microdata
        microdata = self._extract_microdata(soup)
        if microdata:
            return self._parse_microdata(microdata)

        # Fall back to text parsing
        return self.parse_from_text(text)

    def _extract_title(self, text: str) -> Optional[str]:
        """Extract recipe title"""
        lines = text.strip().split("\n")
        for line in lines[:10]:
            line = line.strip()
            if line and len(line) < 100 and not line.startswith(("Ingredients", "Instructions", "Method")):
                return line
        return None

    def _extract_description(self, text: str) -> Optional[str]:
        """Extract recipe description"""
        lines = text.strip().split("\n")
        description_lines = []
        in_description = False
        
        for i, line in enumerate(lines):
            line = line.strip()
            if not line:
                continue
            if "description" in line.lower() or "about" in line.lower():
                in_description = True
                continue
            if in_description and any(keyword in line.lower() for keyword in ["ingredient", "instruction", "method", "step"]):
                break
            if in_description:
                description_lines.append(line)
        
        return " ".join(description_lines) if description_lines else None

    def _extract_ingredients_from_text(self, text: str) -> List[Dict]:
        """Extract ingredients from text"""
        ingredients = []
        lines = text.split("\n")
        
        ingredient_pattern = re.compile(
            r"(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?\s*(.+)", re.IGNORECASE
        )
        
        in_ingredients_section = False
        order = 0
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Detect ingredients section
            if "ingredient" in line.lower():
                in_ingredients_section = True
                continue
            
            if in_ingredients_section:
                if any(keyword in line.lower() for keyword in ["instruction", "direction", "step", "method", "preparation"]):
                    break
                
                match = ingredient_pattern.match(line)
                if match:
                    amount, unit, name = match.groups()
                    order += 1
                    ingredients.append({
                        "name": name.strip(),
                        "amount": float(amount) if amount else None,
                        "unit": unit.strip() if unit else None,
                        "order_index": order,
                    })
                elif line and len(line) > 2:
                    # Plain ingredient without amount
                    order += 1
                    ingredients.append({
                        "name": line,
                        "amount": None,
                        "unit": None,
                        "order_index": order,
                    })
        
        return ingredients

    def _extract_steps_from_text(self, text: str) -> List[Dict]:
        """Extract steps from text"""
        steps = []
        lines = text.split("\n")
        
        step_pattern = re.compile(r"^\s*(\d+)\.?\s*(.+)", re.IGNORECASE)
        in_steps_section = False
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Detect steps section
            if any(keyword in line.lower() for keyword in ["instruction", "direction", "step", "method", "preparation"]):
                in_steps_section = True
                continue
            
            if in_steps_section:
                match = step_pattern.match(line)
                if match:
                    order, description = match.groups()
                    steps.append({
                        "description": description.strip(),
                        "order_index": int(order),
                    })
                elif line and len(line) > 10:
                    # Unnumbered step
                    steps.append({
                        "description": line,
                        "order_index": len(steps) + 1,
                    })
        
        return steps

    def _extract_time(self, text: str, time_type: str) -> Optional[int]:
        """Extract prep or cook time in minutes"""
        patterns = [
            rf"{time_type}.*?(\d+)\s*(?:min|minute)",
            rf"{time_type}.*?(\d+)\s*(?:hour|hr)",
            rf"{time_type}.*?(\d+)\s*h\s*(\d+)\s*m",
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                if len(match.groups()) == 2:
                    # Hours and minutes
                    hours, minutes = match.groups()
                    return int(hours) * 60 + int(minutes)
                else:
                    minutes = int(match.group(1))
                    if "hour" in match.group(0).lower() or "hr" in match.group(0).lower():
                        return minutes * 60
                    return minutes
        return None

    def _extract_servings(self, text: str) -> Optional[int]:
        """Extract servings"""
        pattern = re.compile(r"serves?.*?(\d+)", re.IGNORECASE)
        match = pattern.search(text)
        if match:
            return int(match.group(1))
        return None

    def _extract_json_ld(self, soup: BeautifulSoup) -> Optional[Dict]:
        """Extract JSON-LD structured data"""
        scripts = soup.find_all("script", type="application/ld+json")
        for script in scripts:
            try:
                data = json.loads(script.string)
                if isinstance(data, dict) and data.get("@type") == "Recipe":
                    return data
                elif isinstance(data, list):
                    for item in data:
                        if isinstance(item, dict) and item.get("@type") == "Recipe":
                            return item
            except:
                continue
        return None

    def _extract_microdata(self, soup: BeautifulSoup) -> Optional[Dict]:
        """Extract microdata (schema.org/Recipe)"""
        recipe = soup.find(itemtype=re.compile(".*Recipe"))
        if recipe:
            data = {}
            # Extract properties
            for prop in recipe.find_all(attrs={"itemprop": True}):
                prop_name = prop.get("itemprop")
                prop_value = prop.get("content") or prop.string
                if prop_value:
                    data[prop_name] = prop_value.strip()
            return data if data else None
        return None

    def _parse_json_ld(self, data: Dict) -> Dict:
        """Parse JSON-LD recipe data"""
        def parse_duration(duration: Optional[str]) -> Optional[int]:
            if not duration:
                return None
            match = re.search(r"PT(?:(\d+)H)?(?:(\d+)M)?", duration)
            if match:
                hours = int(match.group(1) or 0)
                minutes = int(match.group(2) or 0)
                return hours * 60 + minutes
            return None

        ingredients = []
        if "recipeIngredient" in data:
            for i, ing in enumerate(data["recipeIngredient"], 1):
                if isinstance(ing, str):
                    ingredients.append({
                        "name": ing,
                        "order_index": i,
                    })
                elif isinstance(ing, dict):
                    ingredients.append({
                        "name": ing.get("name", ""),
                        "amount": ing.get("amount"),
                        "unit": ing.get("unit"),
                        "order_index": i,
                    })

        steps = []
        if "recipeInstructions" in data:
            instructions = data["recipeInstructions"]
            if isinstance(instructions, list):
                for i, step in enumerate(instructions, 1):
                    if isinstance(step, str):
                        steps.append({
                            "description": step,
                            "order_index": i,
                        })
                    elif isinstance(step, dict):
                        steps.append({
                            "description": step.get("text", ""),
                            "order_index": i,
                        })

        return {
            "title": data.get("name"),
            "description": data.get("description"),
            "prep_time": parse_duration(data.get("prepTime")),
            "cook_time": parse_duration(data.get("cookTime")),
            "servings": data.get("recipeYield"),
            "ingredients": ingredients,
            "steps": steps,
            "image_url": data.get("image"),
            "source_url": data.get("url"),
        }

    def _parse_microdata(self, data: Dict) -> Dict:
        """Parse microdata recipe data"""
        return {
            "title": data.get("name"),
            "description": data.get("description"),
            "prep_time": data.get("prepTime"),
            "cook_time": data.get("cookTime"),
            "servings": data.get("recipeYield"),
        }
