import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useURLParser } from '@/hooks/useURLParser';
import { RecipeForm } from '@/components/RecipeForm';
import { useCreateRecipe } from '@/hooks/useRecipes';

export default function ImportURLScreen() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const { mutate: parseUrl, data: parsedRecipe, isLoading, isError, error } = useURLParser();
  const createRecipe = useCreateRecipe();

  const handleParse = () => {
    if (url.trim()) {
      parseUrl(url, {
        onError: (err: any) => {
          Alert.alert('Error', err?.message || 'Failed to parse recipe from URL');
        },
      });
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      // Merge parsed recipe data with form data
      const recipeData = {
        title: data.title || parsedRecipe?.title || 'Untitled Recipe',
        description: data.description || parsedRecipe?.description,
        prep_time: data.prep_time || parsedRecipe?.prep_time,
        cook_time: data.cook_time || parsedRecipe?.cook_time,
        servings: data.servings || parsedRecipe?.servings,
        image_url: data.image_url || parsedRecipe?.image_url,
        source_url: url,
        ingredients: data.ingredients || parsedRecipe?.ingredients || [],
        steps: data.steps || parsedRecipe?.steps || [],
      };
      await createRecipe.mutateAsync(recipeData);
      router.back();
    } catch (error: any) {
      Alert.alert(
        'Failed to Create Recipe',
        error?.message || 'An error occurred while creating the recipe. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputSection}>
        <Text style={styles.label}>Recipe URL</Text>
        <TextInput
          style={styles.input}
          placeholder="https://example.com/recipe"
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          keyboardType="url"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={[styles.button, (isLoading || !url.trim()) && styles.buttonDisabled]}
          onPress={handleParse}
          disabled={isLoading || !url.trim()}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Parse Recipe</Text>
          )}
        </TouchableOpacity>
        {isError && (
          <Text style={styles.errorText}>
            {error instanceof Error 
              ? error.message 
              : (error as any)?.response?.data?.detail || (error as any)?.message || 'Failed to parse recipe. Please check the URL and try again.'}
          </Text>
        )}
      </View>

      {parsedRecipe && (
        <ScrollView style={styles.formSection}>
          <View style={styles.successMessage}>
            <Text style={styles.successText}>✓ Recipe parsed successfully! Review and edit if needed.</Text>
          </View>
          <RecipeForm 
            initialData={{
              title: parsedRecipe.title || '',
              description: parsedRecipe.description,
              prep_time: parsedRecipe.prep_time,
              cook_time: parsedRecipe.cook_time,
              servings: parsedRecipe.servings,
              image_url: parsedRecipe.image_url,
              source_url: parsedRecipe.source_url || url,
              ingredients: parsedRecipe.ingredients || [],
              steps: parsedRecipe.steps || [],
            }} 
            onSubmit={handleSubmit} 
          />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  inputSection: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#f4511e',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    marginTop: 8,
  },
  formSection: {
    flex: 1,
  },
  successMessage: {
    backgroundColor: '#e8f5e9',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },
  successText: {
    color: '#2e7d32',
    fontSize: 14,
    fontWeight: '500',
  },
});

