import { View, Text, StyleSheet } from 'react-native';
import { Recipe } from '@/types';

interface RecipeHeaderProps {
  recipe: Recipe;
}

export const RecipeHeader = ({ recipe }: RecipeHeaderProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{recipe.title}</Text>
      {recipe.source && (
        <Text style={styles.source}>Source: {recipe.source}</Text>
      )}
      {recipe.description && (
        <Text style={styles.description}>{recipe.description}</Text>
      )}
      <View style={styles.meta}>
        {recipe.prep_time && (
          <Text style={styles.metaText}>Prep: {recipe.prep_time}m</Text>
        )}
        {recipe.cook_time && (
          <Text style={styles.metaText}>Cook: {recipe.cook_time}m</Text>
        )}
        {recipe.servings && (
          <Text style={styles.metaText}>Serves: {recipe.servings}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  source: {
    fontSize: 14,
    color: '#f4511e',
    fontWeight: '500',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  meta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaText: {
    fontSize: 14,
    color: '#999',
  },
});

