# Database Schema Diagram

## Entity Relationship Diagram

```
┌─────────────┐
│    users    │
├─────────────┤
│ id (PK)     │
│ email       │
│ full_name   │
│ avatar_url  │
│ created_at  │
│ updated_at  │
└──────┬──────┘
       │
       │ 1:N
       │
┌──────▼──────────┐
│    recipes      │
├─────────────────┤
│ id (PK)         │
│ user_id (FK)    │──┐
│ title           │  │
│ description     │  │
│ prep_time       │  │
│ cook_time       │  │
│ servings        │  │
│ image_url       │  │
│ created_at      │  │
│ updated_at      │  │
└─────┬───────────┘  │
      │              │
      │ 1:N          │
      │              │
┌─────▼──────┐  ┌────▼──────────┐
│ingredients │  │     steps     │
├────────────┤  ├───────────────┤
│ id (PK)    │  │ id (PK)       │
│ recipe_id  │──┤ recipe_id (FK)│──┐
│ name       │  │ description   │  │
│ amount     │  │ order_index   │  │
│ unit       │  │ duration      │  │
│ order_index│  │ created_at    │  │
└────────────┘  └───────┬───────┘  │
                        │          │
                        │ 1:N      │
                        │          │
                  ┌─────▼──────────▼──┐
                  │   attachments     │
                  ├───────────────────┤
                  │ id (PK)           │
                  │ recipe_id (FK)    │
                  │ step_id (FK)      │
                  │ user_id (FK)      │
                  │ file_name         │
                  │ file_path         │
                  │ storage_bucket    │
                  └───────────────────┘

┌─────────────┐         ┌──────────────┐
│    tags     │         │ recipe_tags  │
├─────────────┤         ├──────────────┤
│ id (PK)     │◄────────┤ recipe_id(FK)│
│ name (UNIQ) │    N:M  │ tag_id (FK)  │
│ color       │         │ created_at   │
└─────────────┘         └──────┬───────┘
                               │
                               │ N:1
                               │
                        ┌──────▼──────┐
                        │   recipes   │
                        └─────────────┘
```

## Table Relationships

1. **users** → **recipes** (1:N)
   - One user can have many recipes
   - Foreign key: `recipes.user_id` → `users.id`

2. **recipes** → **ingredients** (1:N)
   - One recipe can have many ingredients
   - Foreign key: `ingredients.recipe_id` → `recipes.id`

3. **recipes** → **steps** (1:N)
   - One recipe can have many steps
   - Foreign key: `steps.recipe_id` → `recipes.id`

4. **recipes** → **attachments** (1:N)
   - One recipe can have many attachments
   - Foreign key: `attachments.recipe_id` → `recipes.id`

5. **steps** → **attachments** (1:N)
   - One step can have many attachments
   - Foreign key: `attachments.step_id` → `steps.id`

6. **users** → **attachments** (1:N)
   - One user can have many attachments
   - Foreign key: `attachments.user_id` → `users.id`

7. **recipes** ↔ **tags** (N:M)
   - Many recipes can have many tags
   - Junction table: `recipe_tags`
   - Foreign keys: `recipe_tags.recipe_id` → `recipes.id`
   - Foreign keys: `recipe_tags.tag_id` → `tags.id`

## Indexes

- `idx_recipes_user_id` - Fast lookup of user's recipes
- `idx_recipes_updated_at` - Sorting by update time
- `idx_recipes_title` - Full-text search on title
- `idx_recipes_description` - Full-text search on description
- `idx_ingredients_recipe_id` - Fast lookup of recipe ingredients
- `idx_ingredients_order` - Maintain ingredient order
- `idx_steps_recipe_id` - Fast lookup of recipe steps
- `idx_steps_order` - Maintain step order
- `idx_attachments_recipe_id` - Fast lookup of recipe attachments
- `idx_attachments_step_id` - Fast lookup of step attachments
- `idx_recipe_tags_recipe_id` - Fast lookup of recipe tags
- `idx_recipe_tags_tag_id` - Fast lookup of tag recipes

