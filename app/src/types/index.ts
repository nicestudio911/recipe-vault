export interface Recipe {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  prep_time?: number;
  cook_time?: number;
  servings?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  cuisine_type?: string;
  image_url?: string;
  source_url?: string;
  source?: string; // Source name/author (e.g., "Julie Myers", "Instagram: @chefname")
  notes?: string;
  created_at: string;
  updated_at: string;
  synced_at?: string;
  ingredients: Ingredient[];
  steps: Step[];
  tags: Tag[];
  attachments: Attachment[];
  is_synced?: boolean;
}

export interface Ingredient {
  id: string;
  recipe_id: string;
  name: string;
  amount?: number;
  unit?: string;
  notes?: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface Step {
  id: string;
  recipe_id: string;
  description: string;
  order_index: number;
  duration?: number;
  temperature?: number;
  created_at: string;
  updated_at: string;
}

export interface Attachment {
  id: string;
  recipe_id?: string;
  step_id?: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size?: number;
  mime_type?: string;
  storage_bucket: string;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface SyncStatus {
  status: 'idle' | 'syncing' | 'success' | 'error';
  lastSync?: string;
  error?: string;
}

export interface OCRResult {
  text: string;
  recipe?: Partial<Recipe>;
}

export interface URLParseResult {
  title?: string;
  description?: string;
  ingredients?: Omit<Ingredient, 'id' | 'recipe_id' | 'created_at' | 'updated_at'>[];
  steps?: Omit<Step, 'id' | 'recipe_id' | 'created_at' | 'updated_at'>[];
  prep_time?: number;
  cook_time?: number;
  servings?: number;
  image_url?: string;
  source_url?: string;
}
