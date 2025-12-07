from typing import List, Optional
from uuid import UUID
from app.db.session import get_supabase
from app.models.recipe import Recipe, RecipeCreate, RecipeUpdate, Ingredient, Step, Tag
from app.services.storage_service import StorageService
from supabase import Client


class RecipeService:
    def __init__(self, supabase: Client = None):
        self.supabase = supabase or get_supabase()
        self.storage = StorageService(self.supabase)

    async def get_user_recipes(self, user_id: UUID) -> List[Recipe]:
        """Get all recipes for a user"""
        response = self.supabase.table("recipes").select(
            """
            *,
            ingredients(*),
            steps(*),
            recipe_tags(
                tags(*)
            ),
            attachments(*)
            """
        ).eq("user_id", str(user_id)).order("updated_at", desc=True).execute()

        recipes = []
        for item in response.data:
            recipe = self._transform_recipe(item)
            recipes.append(recipe)
        return recipes

    async def get_recipe(self, recipe_id: UUID, user_id: UUID) -> Optional[Recipe]:
        """Get a single recipe by ID"""
        response = self.supabase.table("recipes").select(
            """
            *,
            ingredients(*),
            steps(*),
            recipe_tags(
                tags(*)
            ),
            attachments(*)
            """
        ).eq("id", str(recipe_id)).eq("user_id", str(user_id)).single().execute()

        if not response.data:
            return None
        return self._transform_recipe(response.data)

    async def create_recipe(self, recipe: RecipeCreate, user_id: UUID) -> Recipe:
        """Create a new recipe"""
        # Ensure user exists in public.users (safety net if trigger didn't run)
        try:
            user_check = self.supabase.table("users").select("id").eq("id", str(user_id)).execute()
            if not user_check.data:
                # User doesn't exist in public.users, create it
                # Get user info from auth
                auth_user = self.supabase.auth.admin.get_user_by_id(str(user_id))
                if auth_user and auth_user.user:
                    self.supabase.table("users").insert({
                        "id": str(user_id),
                        "email": auth_user.user.email,
                        "full_name": auth_user.user.user_metadata.get("full_name") if auth_user.user.user_metadata else None,
                    }).execute()
        except Exception as e:
            # If we can't create the user, continue anyway - the error will be more informative
            print(f"Warning: Could not ensure user exists: {e}")
        
        # Prepare recipe data
        recipe_data = {
            "user_id": str(user_id),
            "title": recipe.title,
            "description": recipe.description,
            "prep_time": recipe.prep_time,
            "cook_time": recipe.cook_time,
            "servings": recipe.servings,
            "difficulty": recipe.difficulty,
            "cuisine_type": recipe.cuisine_type,
            "image_url": recipe.image_url,
            "source_url": recipe.source_url,
            "notes": recipe.notes,
        }

        # Create recipe
        response = self.supabase.table("recipes").insert(recipe_data).execute()
        recipe_id = UUID(response.data[0]["id"])

        # Create ingredients
        if recipe.ingredients:
            ingredients_data = [
                {
                    "recipe_id": str(recipe_id),
                    "name": ing.name,
                    "amount": ing.amount,
                    "unit": ing.unit,
                    "notes": ing.notes,
                    "order_index": ing.order_index,
                }
                for ing in recipe.ingredients
            ]
            self.supabase.table("ingredients").insert(ingredients_data).execute()

        # Create steps
        if recipe.steps:
            steps_data = [
                {
                    "recipe_id": str(recipe_id),
                    "description": step.description,
                    "order_index": step.order_index,
                    "duration": step.duration,
                    "temperature": step.temperature,
                }
                for step in recipe.steps
            ]
            self.supabase.table("steps").insert(steps_data).execute()

        # Create recipe-tag associations
        if recipe.tag_ids:
            recipe_tags_data = [
                {"recipe_id": str(recipe_id), "tag_id": str(tag_id)}
                for tag_id in recipe.tag_ids
            ]
            self.supabase.table("recipe_tags").insert(recipe_tags_data).execute()

        # Fetch and return complete recipe
        return await self.get_recipe(recipe_id, user_id)

    async def update_recipe(
        self, recipe_id: UUID, recipe: RecipeUpdate, user_id: UUID
    ) -> Recipe:
        """Update an existing recipe"""
        # Verify ownership
        existing = await self.get_recipe(recipe_id, user_id)
        if not existing:
            raise ValueError("Recipe not found")

        # Update recipe fields
        recipe_data = {}
        for field, value in recipe.model_dump(exclude_unset=True, exclude={"ingredients", "steps", "tag_ids"}).items():
            if value is not None:
                recipe_data[field] = value

        if recipe_data:
            self.supabase.table("recipes").update(recipe_data).eq("id", str(recipe_id)).execute()

        # Update ingredients if provided
        if recipe.ingredients is not None:
            # Delete existing ingredients
            self.supabase.table("ingredients").delete().eq("recipe_id", str(recipe_id)).execute()
            # Insert new ingredients
            if recipe.ingredients:
                ingredients_data = [
                    {
                        "recipe_id": str(recipe_id),
                        "name": ing.name,
                        "amount": ing.amount,
                        "unit": ing.unit,
                        "notes": ing.notes,
                        "order_index": ing.order_index,
                    }
                    for ing in recipe.ingredients
                ]
                self.supabase.table("ingredients").insert(ingredients_data).execute()

        # Update steps if provided
        if recipe.steps is not None:
            # Delete existing steps
            self.supabase.table("steps").delete().eq("recipe_id", str(recipe_id)).execute()
            # Insert new steps
            if recipe.steps:
                steps_data = [
                    {
                        "recipe_id": str(recipe_id),
                        "description": step.description,
                        "order_index": step.order_index,
                        "duration": step.duration,
                        "temperature": step.temperature,
                    }
                    for step in recipe.steps
                ]
                self.supabase.table("steps").insert(steps_data).execute()

        # Update tags if provided
        if recipe.tag_ids is not None:
            # Delete existing recipe_tags
            self.supabase.table("recipe_tags").delete().eq("recipe_id", str(recipe_id)).execute()
            # Insert new recipe_tags
            if recipe.tag_ids:
                recipe_tags_data = [
                    {"recipe_id": str(recipe_id), "tag_id": str(tag_id)}
                    for tag_id in recipe.tag_ids
                ]
                self.supabase.table("recipe_tags").insert(recipe_tags_data).execute()

        # Fetch and return updated recipe
        return await self.get_recipe(recipe_id, user_id)

    async def delete_recipe(self, recipe_id: UUID, user_id: UUID) -> None:
        """Delete a recipe"""
        # Verify ownership
        existing = await self.get_recipe(recipe_id, user_id)
        if not existing:
            raise ValueError("Recipe not found")

        # Delete recipe (cascade will handle related records)
        self.supabase.table("recipes").delete().eq("id", str(recipe_id)).execute()

    async def search_recipes(self, query: str, user_id: UUID) -> List[Recipe]:
        """Search recipes by title, description, or ingredients"""
        # Use full-text search on title and description
        response = self.supabase.table("recipes").select(
            """
            *,
            ingredients(*),
            steps(*),
            recipe_tags(
                tags(*)
            ),
            attachments(*)
            """
        ).eq("user_id", str(user_id)).or_(
            f"title.ilike.%{query}%,description.ilike.%{query}%"
        ).execute()

        recipes = []
        for item in response.data:
            # Also search in ingredients
            ingredients_match = any(
                query.lower() in ing.get("name", "").lower()
                for ing in item.get("ingredients", [])
            )
            if ingredients_match or query.lower() in item.get("title", "").lower() or query.lower() in item.get("description", "").lower():
                recipes.append(self._transform_recipe(item))

        return recipes

    def _transform_recipe(self, data: dict) -> Recipe:
        """Transform database response to Recipe model"""
        # Extract tags from recipe_tags
        tags = []
        if "recipe_tags" in data and data["recipe_tags"]:
            tags = [tag_data["tags"] for tag_data in data["recipe_tags"] if "tags" in tag_data]

        return Recipe(
            id=UUID(data["id"]),
            user_id=UUID(data["user_id"]),
            title=data["title"],
            description=data.get("description"),
            prep_time=data.get("prep_time"),
            cook_time=data.get("cook_time"),
            servings=data.get("servings"),
            difficulty=data.get("difficulty"),
            cuisine_type=data.get("cuisine_type"),
            image_url=data.get("image_url"),
            source_url=data.get("source_url"),
            notes=data.get("notes"),
            created_at=data["created_at"],
            updated_at=data["updated_at"],
            synced_at=data.get("synced_at"),
            ingredients=[Ingredient(**ing) for ing in data.get("ingredients", [])],
            steps=[Step(**step) for step in data.get("steps", [])],
            tags=[Tag(**tag) for tag in tags],
            attachments=[Attachment(**att) for att in data.get("attachments", [])] if "attachments" in data else [],
        )
