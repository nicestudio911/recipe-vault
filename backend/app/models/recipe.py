from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class IngredientBase(BaseModel):
    name: str
    amount: Optional[float] = None
    unit: Optional[str] = None
    notes: Optional[str] = None
    order_index: int


class IngredientCreate(IngredientBase):
    pass


class IngredientUpdate(BaseModel):
    name: Optional[str] = None
    amount: Optional[float] = None
    unit: Optional[str] = None
    notes: Optional[str] = None
    order_index: Optional[int] = None


class Ingredient(IngredientBase):
    id: UUID
    recipe_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class StepBase(BaseModel):
    description: str
    order_index: int
    duration: Optional[int] = None
    temperature: Optional[int] = None


class StepCreate(StepBase):
    pass


class StepUpdate(BaseModel):
    description: Optional[str] = None
    order_index: Optional[int] = None
    duration: Optional[int] = None
    temperature: Optional[int] = None


class Step(StepBase):
    id: UUID
    recipe_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AttachmentBase(BaseModel):
    file_name: str
    file_path: str
    file_type: str
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    storage_bucket: str = "recipe-images"


class AttachmentCreate(AttachmentBase):
    step_id: Optional[UUID] = None


class Attachment(AttachmentBase):
    id: UUID
    recipe_id: Optional[UUID]
    step_id: Optional[UUID]
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TagBase(BaseModel):
    name: str
    color: Optional[str] = None


class TagCreate(TagBase):
    pass


class Tag(TagBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RecipeBase(BaseModel):
    title: str
    description: Optional[str] = None
    prep_time: Optional[int] = None
    cook_time: Optional[int] = None
    servings: Optional[int] = None
    difficulty: Optional[str] = Field(None, pattern="^(easy|medium|hard)$")
    cuisine_type: Optional[str] = None
    image_url: Optional[str] = None
    source_url: Optional[str] = None
    notes: Optional[str] = None


class RecipeCreate(RecipeBase):
    ingredients: List[IngredientCreate] = []
    steps: List[StepCreate] = []
    tag_ids: List[UUID] = []


class RecipeUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    prep_time: Optional[int] = None
    cook_time: Optional[int] = None
    servings: Optional[int] = None
    difficulty: Optional[str] = Field(None, pattern="^(easy|medium|hard)$")
    cuisine_type: Optional[str] = None
    image_url: Optional[str] = None
    source_url: Optional[str] = None
    notes: Optional[str] = None
    ingredients: Optional[List[IngredientCreate]] = None
    steps: Optional[List[StepCreate]] = None
    tag_ids: Optional[List[UUID]] = None


class Recipe(RecipeBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    synced_at: Optional[datetime] = None
    ingredients: List[Ingredient] = []
    steps: List[Step] = []
    tags: List[Tag] = []
    attachments: List[Attachment] = []

    class Config:
        from_attributes = True
