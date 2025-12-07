import { ScrollView, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { RecipeForm } from '@/components/RecipeForm';
import { useCreateRecipe } from '@/hooks/useRecipes';

export default function AddRecipeScreen() {
  const router = useRouter();
  const createRecipe = useCreateRecipe();

  const handleSubmit = async (data: any) => {
    try {
      await createRecipe.mutateAsync(data);
      router.back();
    } catch (error: any) {
      Alert.alert(
        'Failed to Create Recipe',
        error?.message || 'An error occurred while creating the recipe. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <ScrollView style={styles.container}>
      <RecipeForm onSubmit={handleSubmit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});
