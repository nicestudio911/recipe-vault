import { Platform } from 'react-native';
import { Recipe, Ingredient, Step, Tag } from '@/types';

const DB_NAME = 'recipe_vault.db';

let db: any = null;
let SQLite: any = null;

// Only import SQLite on native platforms
if (Platform.OS !== 'web') {
  SQLite = require('expo-sqlite');
}

export const initDatabase = async () => {
  // Skip database initialization on web
  if (Platform.OS === 'web') {
    console.log('SQLite not available on web platform. Using API-only mode.');
    return;
  }

  if (!SQLite) {
    console.warn('SQLite not available');
    return;
  }

  try {
    db = await SQLite.openDatabaseAsync(DB_NAME);
    await createTables();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};

const createTables = async () => {
  if (!db) throw new Error('Database not initialized');

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS recipes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      prep_time INTEGER,
      cook_time INTEGER,
      servings INTEGER,
      difficulty TEXT,
      cuisine_type TEXT,
      image_url TEXT,
      source_url TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced_at TEXT,
      is_synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS ingredients (
      id TEXT PRIMARY KEY,
      recipe_id TEXT NOT NULL,
      name TEXT NOT NULL,
      amount REAL,
      unit TEXT,
      notes TEXT,
      order_index INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS steps (
      id TEXT PRIMARY KEY,
      recipe_id TEXT NOT NULL,
      description TEXT NOT NULL,
      order_index INTEGER NOT NULL,
      duration INTEGER,
      temperature INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      color TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS recipe_tags (
      recipe_id TEXT NOT NULL,
      tag_id TEXT NOT NULL,
      PRIMARY KEY (recipe_id, tag_id),
      FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id);
    CREATE INDEX IF NOT EXISTS idx_recipes_updated_at ON recipes(updated_at);
    CREATE INDEX IF NOT EXISTS idx_ingredients_recipe_id ON ingredients(recipe_id);
    CREATE INDEX IF NOT EXISTS idx_steps_recipe_id ON steps(recipe_id);
    CREATE INDEX IF NOT EXISTS idx_recipe_tags_recipe_id ON recipe_tags(recipe_id);
    CREATE INDEX IF NOT EXISTS idx_recipe_tags_tag_id ON recipe_tags(tag_id);
  `);
};

export const getDatabase = () => {
  if (Platform.OS === 'web') {
    throw new Error('SQLite database is not available on web platform. Use API calls instead.');
  }
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
};

