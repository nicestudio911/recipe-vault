from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID
from app.models.recipe import Recipe, RecipeCreate, RecipeUpdate
from app.services.recipe_service import RecipeService
from app.core.dependencies import get_current_user, get_supabase_client
from supabase import Client

router = APIRouter(prefix="/recipes", tags=["recipes"])


def get_recipe_service(supabase: Client = Depends(get_supabase_client)) -> RecipeService:
    return RecipeService(supabase)


@router.get("/", response_model=List[Recipe])
async def get_recipes(
    current_user: dict = Depends(get_current_user),
    service: RecipeService = Depends(get_recipe_service)
):
    """Get all recipes for the current user"""
    recipes = await service.get_user_recipes(UUID(current_user["id"]))
    return recipes


@router.get("/{recipe_id}", response_model=Recipe)
async def get_recipe(
    recipe_id: UUID,
    current_user: dict = Depends(get_current_user),
    service: RecipeService = Depends(get_recipe_service)
):
    """Get a single recipe by ID"""
    recipe = await service.get_recipe(recipe_id, UUID(current_user["id"]))
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return recipe


@router.post("/", response_model=Recipe, status_code=status.HTTP_201_CREATED)
async def create_recipe(
    recipe: RecipeCreate,
    current_user: dict = Depends(get_current_user),
    service: RecipeService = Depends(get_recipe_service)
):
    """Create a new recipe"""
    try:
        new_recipe = await service.create_recipe(recipe, UUID(current_user["id"]))
        return new_recipe
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{recipe_id}", response_model=Recipe)
async def update_recipe(
    recipe_id: UUID,
    recipe: RecipeUpdate,
    current_user: dict = Depends(get_current_user),
    service: RecipeService = Depends(get_recipe_service)
):
    """Update an existing recipe"""
    try:
        updated_recipe = await service.update_recipe(
            recipe_id, recipe, UUID(current_user["id"])
        )
        return updated_recipe
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_recipe(
    recipe_id: UUID,
    current_user: dict = Depends(get_current_user),
    service: RecipeService = Depends(get_recipe_service)
):
    """Delete a recipe"""
    try:
        await service.delete_recipe(recipe_id, UUID(current_user["id"]))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/search", response_model=List[Recipe])
async def search_recipes(
    q: str,
    current_user: dict = Depends(get_current_user),
    service: RecipeService = Depends(get_recipe_service)
):
    """Search recipes by query"""
    recipes = await service.search_recipes(q, UUID(current_user["id"]))
    return recipes

