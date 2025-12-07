-- Recipe Vault Database Schema
-- Supabase Postgres Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Recipes table
CREATE TABLE IF NOT EXISTS public.recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    prep_time INTEGER, -- in minutes
    cook_time INTEGER, -- in minutes
    total_time INTEGER, -- in minutes
    servings INTEGER,
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
    cuisine_type TEXT,
    image_url TEXT,
    source_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    synced_at TIMESTAMPTZ
);

-- Ingredients table
CREATE TABLE IF NOT EXISTS public.ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    amount DECIMAL(10, 2),
    unit TEXT,
    notes TEXT,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Steps table
CREATE TABLE IF NOT EXISTS public.steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    duration INTEGER, -- in minutes
    temperature INTEGER, -- in celsius
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Attachments table (for step images, recipe images, etc.)
CREATE TABLE IF NOT EXISTS public.attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE,
    step_id UUID REFERENCES public.steps(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT,
    mime_type TEXT,
    storage_bucket TEXT DEFAULT 'recipe-images',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tags table
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    color TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Recipe-Tags junction table
CREATE TABLE IF NOT EXISTS public.recipe_tags (
    recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (recipe_id, tag_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON public.recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_updated_at ON public.recipes(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_title ON public.recipes USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_recipes_description ON public.recipes USING gin(to_tsvector('english', description));
CREATE INDEX IF NOT EXISTS idx_ingredients_recipe_id ON public.ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_ingredients_order ON public.ingredients(recipe_id, order_index);
CREATE INDEX IF NOT EXISTS idx_steps_recipe_id ON public.steps(recipe_id);
CREATE INDEX IF NOT EXISTS idx_steps_order ON public.steps(recipe_id, order_index);
CREATE INDEX IF NOT EXISTS idx_attachments_recipe_id ON public.attachments(recipe_id);
CREATE INDEX IF NOT EXISTS idx_attachments_step_id ON public.attachments(step_id);
CREATE INDEX IF NOT EXISTS idx_attachments_user_id ON public.attachments(user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_tags_recipe_id ON public.recipe_tags(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_tags_tag_id ON public.recipe_tags(tag_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON public.recipes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ingredients_updated_at BEFORE UPDATE ON public.ingredients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_steps_updated_at BEFORE UPDATE ON public.steps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attachments_updated_at BEFORE UPDATE ON public.attachments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tags_updated_at BEFORE UPDATE ON public.tags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_tags ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

-- Recipes policies
CREATE POLICY "Users can view their own recipes"
    ON public.recipes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recipes"
    ON public.recipes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recipes"
    ON public.recipes FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recipes"
    ON public.recipes FOR DELETE
    USING (auth.uid() = user_id);

-- Ingredients policies
CREATE POLICY "Users can view ingredients of their recipes"
    ON public.ingredients FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.recipes
            WHERE recipes.id = ingredients.recipe_id
            AND recipes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert ingredients for their recipes"
    ON public.ingredients FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.recipes
            WHERE recipes.id = ingredients.recipe_id
            AND recipes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update ingredients of their recipes"
    ON public.ingredients FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.recipes
            WHERE recipes.id = ingredients.recipe_id
            AND recipes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete ingredients of their recipes"
    ON public.ingredients FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.recipes
            WHERE recipes.id = ingredients.recipe_id
            AND recipes.user_id = auth.uid()
        )
    );

-- Steps policies
CREATE POLICY "Users can view steps of their recipes"
    ON public.steps FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.recipes
            WHERE recipes.id = steps.recipe_id
            AND recipes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert steps for their recipes"
    ON public.steps FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.recipes
            WHERE recipes.id = steps.recipe_id
            AND recipes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update steps of their recipes"
    ON public.steps FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.recipes
            WHERE recipes.id = steps.recipe_id
            AND recipes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete steps of their recipes"
    ON public.steps FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.recipes
            WHERE recipes.id = steps.recipe_id
            AND recipes.user_id = auth.uid()
        )
    );

-- Attachments policies
CREATE POLICY "Users can view their own attachments"
    ON public.attachments FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own attachments"
    ON public.attachments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attachments"
    ON public.attachments FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own attachments"
    ON public.attachments FOR DELETE
    USING (auth.uid() = user_id);

-- Tags policies (read-only for all authenticated users, write for recipe owners)
CREATE POLICY "Authenticated users can view tags"
    ON public.tags FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can insert tags"
    ON public.tags FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update tags"
    ON public.tags FOR UPDATE
    TO authenticated
    USING (true);

-- Recipe_tags policies
CREATE POLICY "Users can view recipe_tags of their recipes"
    ON public.recipe_tags FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.recipes
            WHERE recipes.id = recipe_tags.recipe_id
            AND recipes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert recipe_tags for their recipes"
    ON public.recipe_tags FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.recipes
            WHERE recipes.id = recipe_tags.recipe_id
            AND recipes.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete recipe_tags of their recipes"
    ON public.recipe_tags FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.recipes
            WHERE recipes.id = recipe_tags.recipe_id
            AND recipes.user_id = auth.uid()
        )
    );

-- Storage bucket policies (to be configured in Supabase dashboard)
-- Bucket: recipe-images
-- Policy: Users can upload files to their own folder: {user_id}/*
-- Policy: Users can read files from their own folder: {user_id}/*
-- Policy: Users can delete files from their own folder: {user_id}/*
