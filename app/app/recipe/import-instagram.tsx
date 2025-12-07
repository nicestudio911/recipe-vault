import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { RecipeForm } from '@/components/RecipeForm';
import { useCreateRecipe } from '@/hooks/useRecipes';
import { apiClient } from '@/services/api';

export default function ImportInstagramScreen() {
  const router = useRouter();
  const createRecipe = useCreateRecipe();
  const [instagramUrl, setInstagramUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [parsedRecipe, setParsedRecipe] = useState<any>(null);

  const handlePasteFromClipboard = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text.includes('instagram.com')) {
        setInstagramUrl(text);
      } else {
        Alert.alert('No Instagram URL', 'Clipboard does not contain an Instagram URL');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not read clipboard');
    }
  };

  const handleOpenInstagram = () => {
    Linking.openURL('https://www.instagram.com');
  };

  const handleParseInstagram = async () => {
    if (!instagramUrl.trim()) {
      Alert.alert('Error', 'Please enter an Instagram post URL');
      return;
    }

    // Validate Instagram URL
    const instagramRegex = /^https?:\/\/(www\.)?instagram\.com\/(p|reel)\/[a-zA-Z0-9_-]+\/?/;
    if (!instagramRegex.test(instagramUrl.trim())) {
      Alert.alert('Invalid URL', 'Please enter a valid Instagram post URL (e.g., https://www.instagram.com/p/ABC123/)');
      return;
    }

    setIsLoading(true);
    try {
      // Parse using the backend - it will extract description and use OpenAI to parse recipe
      const result = await apiClient.parseRecipeUrl(instagramUrl.trim());
      
      if (result) {
        setParsedRecipe({
          title: result.title || 'Recipe from Instagram',
          description: result.description,
          prep_time: result.prep_time,
          cook_time: result.cook_time,
          servings: result.servings,
          difficulty: result.difficulty,
          cuisine_type: result.cuisine_type,
          image_url: result.image_url,
          source_url: instagramUrl.trim(),
          ingredients: result.ingredients || [],
          steps: result.steps || [],
        });
      } else {
        // Fallback if no result
        setParsedRecipe({
          title: 'Recipe from Instagram',
          source_url: instagramUrl.trim(),
          description: 'Imported from Instagram post. Please fill in the details below.',
          ingredients: [],
          steps: [],
        });
      }
    } catch (error: any) {
      // Show error but still allow manual entry
      const errorMessage = error?.message || 'Could not extract recipe from Instagram post.';
      Alert.alert(
        'Extraction Failed',
        `${errorMessage}\n\nYou can still manually enter the recipe details below.`,
        [{ text: 'OK' }]
      );
      
      // Still allow manual entry
      setParsedRecipe({
        title: 'Recipe from Instagram',
        source_url: instagramUrl.trim(),
        description: 'Could not automatically extract recipe. Please fill in the details below.',
        ingredients: [],
        steps: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const extractInstagramHandle = (url: string): string => {
    // Try to extract username from URL
    const match = url.match(/instagram\.com\/([^\/\?]+)/);
    return match ? match[1] : 'Unknown';
  };

  const handleSubmit = async (data: any) => {
    try {
      await createRecipe.mutateAsync({
        ...data,
        source: data.source || parsedRecipe?.source,
        source_url: instagramUrl.trim() || parsedRecipe?.source_url,
      });
      router.back();
    } catch (error: any) {
      Alert.alert(
        'Failed to Create Recipe',
        error?.message || 'An error occurred while creating the recipe. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
    }
  };

  if (parsedRecipe) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setParsedRecipe(null)}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Recipe Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView style={styles.scrollView}>
          <View style={styles.successMessage}>
            <Ionicons name="checkmark-circle" size={20} color="#4caf50" />
            <Text style={styles.successText}>
              Recipe extracted from Instagram! Review and edit the details below.
            </Text>
          </View>
          <RecipeForm 
            initialData={{
              title: parsedRecipe.title || '',
              description: parsedRecipe.description,
              prep_time: parsedRecipe.prep_time,
              cook_time: parsedRecipe.cook_time,
              servings: parsedRecipe.servings,
              difficulty: parsedRecipe.difficulty,
              cuisine_type: parsedRecipe.cuisine_type,
              image_url: parsedRecipe.image_url,
              source_url: parsedRecipe.source_url,
              ingredients: parsedRecipe.ingredients || [],
              steps: parsedRecipe.steps || [],
            }} 
            onSubmit={handleSubmit} 
          />
        </ScrollView>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="logo-instagram" size={64} color="#E4405F" />
        </View>
        <Text style={styles.title}>Import from Instagram</Text>
        <Text style={styles.description}>
          Paste the Instagram post URL to import a recipe. You can then edit the details below.
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Instagram Post URL</Text>
          <TextInput
            style={styles.input}
            placeholder="https://www.instagram.com/p/..."
            value={instagramUrl}
            onChangeText={setInstagramUrl}
            autoCapitalize="none"
            keyboardType="url"
            editable={!isLoading}
          />
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handlePasteFromClipboard}
              disabled={isLoading}
            >
              <Ionicons name="clipboard-outline" size={20} color="#f4511e" />
              <Text style={styles.secondaryButtonText}>Paste</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleOpenInstagram}
              disabled={isLoading}
            >
              <Ionicons name="open-outline" size={20} color="#f4511e" />
              <Text style={styles.secondaryButtonText}>Open Instagram</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, styles.primaryButton, isLoading && styles.buttonDisabled]}
          onPress={handleParseInstagram}
          disabled={isLoading || !instagramUrl.trim()}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="download-outline" size={20} color="#fff" />
              <Text style={styles.primaryButtonText}>Import Recipe</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color="#666" />
          <Text style={styles.infoText}>
            The app will extract the recipe information from the Instagram post description using AI. 
            You can review and edit the extracted details before saving.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    padding: 24,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    color: '#333',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#f4511e',
    marginBottom: 24,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f4511e',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#f4511e',
    fontSize: 14,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  successMessage: {
    flexDirection: 'row',
    backgroundColor: '#e8f5e9',
    padding: 12,
    margin: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
    alignItems: 'center',
    gap: 8,
  },
  successText: {
    flex: 1,
    color: '#2e7d32',
    fontSize: 14,
    fontWeight: '500',
  },
});

