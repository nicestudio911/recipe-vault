import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Recipe } from '@/types';

interface RecipeCardProps {
  recipe: Recipe;
  onPress: () => void;
}

export const RecipeCard = ({ recipe, onPress }: RecipeCardProps) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      {recipe.image_url && (
        <Image source={{ uri: recipe.image_url }} style={styles.image} />
      )}
      <View style={styles.content}>
        <Text style={styles.title}>{recipe.title}</Text>
        {recipe.description && (
          <Text style={styles.description} numberOfLines={2}>
            {recipe.description}
          </Text>
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
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 20,
    marginHorizontal: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 220,
    resizeMode: 'cover',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  meta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaText: {
    fontSize: 12,
    color: '#999',
  },
});

