import { View, Text, ScrollView, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRecipe } from '@/hooks/useRecipes';
import { RecipeHeader } from '@/components/RecipeHeader';
import { IngredientsList } from '@/components/IngredientsList';
import { StepsList } from '@/components/StepsList';
import { TagsList } from '@/components/TagsList';
import { Ionicons } from '@expo/vector-icons';

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: recipe, isLoading } = useRecipe(id as string);

  if (isLoading || !recipe) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {recipe.image_url && (
        <Image source={{ uri: recipe.image_url }} style={styles.image} />
      )}
      <View style={styles.header}>
        <RecipeHeader recipe={recipe} />
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => router.push(`/recipe/edit/${recipe.id}`)}
        >
          <Ionicons name="create-outline" size={24} color="#f4511e" />
        </TouchableOpacity>
      </View>
      <TagsList tags={recipe.tags} />
      <IngredientsList ingredients={recipe.ingredients} />
      <StepsList steps={recipe.steps} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  image: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
  },
  editButton: {
    padding: 8,
  },
});
