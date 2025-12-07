import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Recipe } from '@/types';

interface FeaturedRecipeCardProps {
  recipe: Recipe;
  onPress: () => void;
  onLike?: () => void;
  onAdd?: () => void;
  likesCount?: number;
}

export const FeaturedRecipeCard = ({
  recipe,
  onPress,
  onLike,
  onAdd,
  likesCount = 0,
}: FeaturedRecipeCardProps) => {
  const formatLikes = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(2)}K`;
    }
    return count.toString();
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.9}>
      {recipe.image_url && (
        <Image source={{ uri: recipe.image_url }} style={styles.image} />
      )}
      <View style={styles.card}>
        <Text style={styles.label}>Today's Recipe</Text>
        <View style={styles.cardContent}>
          <View style={styles.textContent}>
            <Text style={styles.title}>{recipe.title}</Text>
            {recipe.user_id && (
              <Text style={styles.author}>Recipe Author</Text>
            )}
          </View>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.likeButton} onPress={onLike}>
              <Ionicons name="heart" size={20} color="#fff" />
              <Text style={styles.likeText}>{formatLikes(likesCount)}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addButton} onPress={onAdd}>
              <Ionicons name="add" size={32} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: 400,
    resizeMode: 'cover',
  },
  card: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
  },
  label: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  textContent: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
    fontFamily: 'serif',
  },
  author: {
    fontSize: 14,
    color: '#f4511e',
    fontWeight: '500',
  },
  actions: {
    alignItems: 'flex-end',
    gap: 12,
  },
  likeButton: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  likeText: {
    color: '#2a2a2a',
    fontSize: 12,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#f4511e',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#f4511e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

