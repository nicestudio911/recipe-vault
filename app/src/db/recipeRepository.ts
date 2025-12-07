import { Platform } from 'react-native';
import { getDatabase } from './database';
import { Recipe, Ingredient, Step, Tag } from '@/types';

export const recipeRepository = {
  async getAllRecipes(userId: string): Promise<Recipe[]> {
    // On web, return empty array (use API directly)
    if (Platform.OS === 'web') {
      return [];
    }
    const db = getDatabase();
    const recipes = await db.getAllAsync<Recipe>(
      'SELECT * FROM recipes WHERE user_id = ? ORDER BY updated_at DESC',
      [userId]
    );

    for (const recipe of recipes) {
      recipe.ingredients = await db.getAllAsync<Ingredient>(
        'SELECT * FROM ingredients WHERE recipe_id = ? ORDER BY order_index',
        [recipe.id]
      );
      recipe.steps = await db.getAllAsync<Step>(
        'SELECT * FROM steps WHERE recipe_id = ? ORDER BY order_index',
        [recipe.id]
      );
      const tagRows = await db.getAllAsync<{ tag_id: string }>(
        'SELECT tag_id FROM recipe_tags WHERE recipe_id = ?',
        [recipe.id]
      );
      const tagIds = tagRows.map((r) => r.tag_id);
      if (tagIds.length > 0) {
        recipe.tags = await db.getAllAsync<Tag>(
          `SELECT * FROM tags WHERE id IN (${tagIds.map(() => '?').join(',')})`,
          tagIds
        );
      } else {
        recipe.tags = [];
      }
      recipe.attachments = [];
    }

    return recipes;
  },

  async getRecipeById(id: string): Promise<Recipe | null> {
    // On web, return null (use API directly)
    if (Platform.OS === 'web') {
      return null;
    }
    const db = getDatabase();
    const recipe = await db.getFirstAsync<Recipe>(
      'SELECT * FROM recipes WHERE id = ?',
      [id]
    );

    if (!recipe) return null;

    recipe.ingredients = await db.getAllAsync<Ingredient>(
      'SELECT * FROM ingredients WHERE recipe_id = ? ORDER BY order_index',
      [id]
    );
    recipe.steps = await db.getAllAsync<Step>(
      'SELECT * FROM steps WHERE recipe_id = ? ORDER BY order_index',
      [id]
    );
    const tagRows = await db.getAllAsync<{ tag_id: string }>(
      'SELECT tag_id FROM recipe_tags WHERE recipe_id = ?',
      [id]
    );
    const tagIds = tagRows.map((r) => r.tag_id);
    if (tagIds.length > 0) {
      recipe.tags = await db.getAllAsync<Tag>(
        `SELECT * FROM tags WHERE id IN (${tagIds.map(() => '?').join(',')})`,
        tagIds
      );
    } else {
      recipe.tags = [];
    }
    recipe.attachments = [];

    return recipe;
  },

  async createRecipe(recipe: Omit<Recipe, 'id' | 'created_at' | 'updated_at' | 'is_synced'>): Promise<Recipe> {
    // On web, throw error (use API directly)
    if (Platform.OS === 'web') {
      throw new Error('Local database not available on web. Use API client directly.');
    }
    const db = getDatabase();
    const id = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO recipes (id, user_id, title, description, prep_time, cook_time, servings, difficulty, cuisine_type, image_url, source_url, notes, created_at, updated_at, is_synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        id, recipe.user_id, recipe.title, recipe.description, recipe.prep_time,
        recipe.cook_time, recipe.servings, recipe.difficulty, recipe.cuisine_type,
        recipe.image_url, recipe.source_url, recipe.notes, now, now
      ]
    );

    // Insert ingredients
    for (const ing of recipe.ingredients) {
      const ingId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await db.runAsync(
        `INSERT INTO ingredients (id, recipe_id, name, amount, unit, notes, order_index, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [ingId, id, ing.name, ing.amount, ing.unit, ing.notes, ing.order_index, now, now]
      );
    }

    // Insert steps
    for (const step of recipe.steps) {
      const stepId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await db.runAsync(
        `INSERT INTO steps (id, recipe_id, description, order_index, duration, temperature, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [stepId, id, step.description, step.order_index, step.duration, step.temperature, now, now]
      );
    }

    // Insert tags
    for (const tag of recipe.tags) {
      // Check if tag exists
      let existingTag = await db.getFirstAsync<Tag>('SELECT * FROM tags WHERE id = ?', [tag.id]);
      if (!existingTag) {
        await db.runAsync(
          `INSERT INTO tags (id, name, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
          [tag.id, tag.name, tag.color, now, now]
        );
      }
      await db.runAsync(
        'INSERT OR IGNORE INTO recipe_tags (recipe_id, tag_id) VALUES (?, ?)',
        [id, tag.id]
      );
    }

    return await this.getRecipeById(id) as Recipe;
  },

  async updateRecipe(id: string, recipe: Partial<Recipe>): Promise<Recipe> {
    // On web, throw error (use API directly)
    if (Platform.OS === 'web') {
      throw new Error('Local database not available on web. Use API client directly.');
    }
    const db = getDatabase();
    const now = new Date().toISOString();

    const updates: string[] = [];
    const values: any[] = [];

    if (recipe.title !== undefined) {
      updates.push('title = ?');
      values.push(recipe.title);
    }
    if (recipe.description !== undefined) {
      updates.push('description = ?');
      values.push(recipe.description);
    }
    // Add other fields...

    if (updates.length > 0) {
      updates.push('updated_at = ?');
      values.push(now);
      values.push(id);
      await db.runAsync(
        `UPDATE recipes SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }

    // Update ingredients, steps, tags if provided
    if (recipe.ingredients) {
      await db.runAsync('DELETE FROM ingredients WHERE recipe_id = ?', [id]);
      for (const ing of recipe.ingredients) {
        const ingId = ing.id || `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await db.runAsync(
          `INSERT INTO ingredients (id, recipe_id, name, amount, unit, notes, order_index, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [ingId, id, ing.name, ing.amount, ing.unit, ing.notes, ing.order_index, now, now]
        );
      }
    }

    return await this.getRecipeById(id) as Recipe;
  },

  async deleteRecipe(id: string): Promise<void> {
    // On web, throw error (use API directly)
    if (Platform.OS === 'web') {
      throw new Error('Local database not available on web. Use API client directly.');
    }
    const db = getDatabase();
    await db.runAsync('DELETE FROM recipes WHERE id = ?', [id]);
  },

  async searchRecipes(query: string, userId: string): Promise<Recipe[]> {
    // On web, return empty array (use API directly)
    if (Platform.OS === 'web') {
      return [];
    }
    const db = getDatabase();
    const recipes = await db.getAllAsync<Recipe>(
      `SELECT * FROM recipes WHERE user_id = ? AND (title LIKE ? OR description LIKE ?) ORDER BY updated_at DESC`,
      [userId, `%${query}%`, `%${query}%`]
    );

    // Load related data for each recipe
    for (const recipe of recipes) {
      recipe.ingredients = await db.getAllAsync<Ingredient>(
        'SELECT * FROM ingredients WHERE recipe_id = ? ORDER BY order_index',
        [recipe.id]
      );
      recipe.steps = await db.getAllAsync<Step>(
        'SELECT * FROM steps WHERE recipe_id = ? ORDER BY order_index',
        [recipe.id]
      );
      recipe.tags = [];
      recipe.attachments = [];
    }

    return recipes;
  },

  async getUnsyncedRecipes(userId: string): Promise<Recipe[]> {
    // On web, return empty array (no offline sync needed)
    if (Platform.OS === 'web') {
      return [];
    }
    const db = getDatabase();
    const recipes = await db.getAllAsync<Recipe>(
      'SELECT * FROM recipes WHERE user_id = ? AND is_synced = 0 ORDER BY updated_at',
      [userId]
    );
    return recipes;
  },

  async updateRecipeId(oldId: string, newId: string): Promise<void> {
    // On web, throw error (use API directly)
    if (Platform.OS === 'web') {
      throw new Error('Local database not available on web. Use API client directly.');
    }
    const db = getDatabase();
    
    // Update recipe ID
    await db.runAsync('UPDATE recipes SET id = ? WHERE id = ?', [newId, oldId]);
    
    // Update all related records
    await db.runAsync('UPDATE ingredients SET recipe_id = ? WHERE recipe_id = ?', [newId, oldId]);
    await db.runAsync('UPDATE steps SET recipe_id = ? WHERE recipe_id = ?', [newId, oldId]);
    await db.runAsync('UPDATE recipe_tags SET recipe_id = ? WHERE recipe_id = ?', [newId, oldId]);
  },

  async markAsSynced(recipeId: string, syncedAt: string): Promise<void> {
    // On web, do nothing (no offline sync needed)
    if (Platform.OS === 'web') {
      return;
    }
    const db = getDatabase();
    await db.runAsync(
      'UPDATE recipes SET is_synced = 1, synced_at = ? WHERE id = ?',
      [syncedAt, recipeId]
    );
  },
};

