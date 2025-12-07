import { ScrollView, StyleSheet, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { RecipeForm } from '@/components/RecipeForm';
import { useRecipe, useUpdateRecipe } from '@/hooks/useRecipes';

export default function EditRecipeScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: recipe, isLoading } = useRecipe(id as string);
  const updateRecipe = useUpdateRecipe();

  const handleSubmit = async (data: any) => {
    if (!id) return;
    
    try {
      await updateRecipe.mutateAsync({
        id: id as string,
        ...data,
      });
      router.back();
    } catch (error: any) {
      Alert.alert(
        'Failed to Update Recipe',
        error?.message || 'An error occurred while updating the recipe. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  if (isLoading || !recipe) {
    return null; // Or return a loading component
  }

  return (
    <ScrollView style={styles.container}>
      <RecipeForm initialData={recipe} onSubmit={handleSubmit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});
