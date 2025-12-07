import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
// import { Camera } from 'expo-camera';
import { useOCR } from '@/hooks/useOCR';
import { RecipeForm } from '@/components/RecipeForm';
import { useCreateRecipe } from '@/hooks/useRecipes';
import { OCRProgressModal } from '@/components/OCRProgressModal';

const PROCESSING_STEPS = [
  'Uploading image to server...',
  'Extracting text from image...',
  'Analyzing recipe information...',
  'Finalizing recipe data...',
];

export default function OCRImportScreen() {
  const router = useRouter();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const { mutate: processOCR, data: ocrResult, isPending: isLoading, isError, error } = useOCR();
  const createRecipe = useCreateRecipe();

  // Simulate progress steps during OCR processing
  // Only start progress when we have an image and are actually loading
  useEffect(() => {
    if (isLoading && imageUri) {
      setCurrentStep(1);
      const stepInterval = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev < PROCESSING_STEPS.length) {
            return prev + 1;
          }
          return prev;
        });
      }, 2000); // Change step every 2 seconds

      return () => clearInterval(stepInterval);
    } else {
      setCurrentStep(1);
    }
  }, [isLoading, imageUri]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      processOCR({ imageUri: result.assets[0].uri }, {
        onError: (err: any) => {
          Alert.alert('Error', err?.message || 'Failed to process image');
        },
      });
    }
  };

  const takePhoto = async () => {
    // TODO: Use expo-camera for camera functionality
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera permissions');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      processOCR({ imageUri: result.assets[0].uri }, {
        onError: (err: any) => {
          Alert.alert('Error', err?.message || 'Failed to process image');
        },
      });
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      // Merge OCR result with form data
      const recipeData = {
        title: data.title || ocrResult?.recipe?.title || 'Untitled Recipe',
        description: data.description || ocrResult?.recipe?.description,
        prep_time: data.prep_time || ocrResult?.recipe?.prep_time,
        cook_time: data.cook_time || ocrResult?.recipe?.cook_time,
        servings: data.servings || ocrResult?.recipe?.servings,
        image_url: data.image_url || ocrResult?.recipe?.image_url || imageUri,
        ingredients: data.ingredients || ocrResult?.recipe?.ingredients || [],
        steps: data.steps || ocrResult?.recipe?.steps || [],
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
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.imageSection}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} />
          ) : (
            <View style={styles.placeholder}>
              <Ionicons name="image-outline" size={64} color="#999" />
              <Text style={styles.placeholderText}>No image selected</Text>
              <Text style={styles.placeholderSubtext}>Take a photo or choose from library</Text>
            </View>
          )}

          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.button, styles.buttonLeft, isLoading && styles.buttonDisabled]} 
              onPress={takePhoto}
              disabled={isLoading}
            >
              <Ionicons name="camera-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.buttonText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.buttonRight, isLoading && styles.buttonDisabled]} 
              onPress={pickImage}
              disabled={isLoading}
            >
              <Ionicons name="images-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.buttonText}>Choose from Library</Text>
            </TouchableOpacity>
          </View>

          {isError && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color="#d32f2f" />
              <Text style={styles.errorText}>
                {error instanceof Error 
                  ? error.message 
                  : (error as any)?.response?.data?.detail || (error as any)?.message || 'Failed to process image. Please try again.'}
              </Text>
            </View>
          )}
        </View>

        {ocrResult?.recipe && !isLoading && (
          <View style={styles.formSection}>
            <View style={styles.successMessage}>
              <Ionicons name="checkmark-circle" size={20} color="#4caf50" />
              <Text style={styles.successText}>Recipe extracted successfully! Review and edit if needed.</Text>
            </View>
            <RecipeForm
              initialData={{
                title: ocrResult.recipe.title || '',
                description: ocrResult.recipe.description,
                prep_time: ocrResult.recipe.prep_time,
                cook_time: ocrResult.recipe.cook_time,
                servings: ocrResult.recipe.servings,
                image_url: ocrResult.recipe.image_url || imageUri || undefined,
                ingredients: ocrResult.recipe.ingredients || [],
                steps: ocrResult.recipe.steps || [],
              }}
              onSubmit={handleSubmit}
            />
          </View>
        )}
      </ScrollView>

      {/* Progress Modal - Shows only when processing */}
      <OCRProgressModal
        visible={isLoading && !!imageUri}
        currentStep={currentStep}
        totalSteps={PROCESSING_STEPS.length}
        stepDescriptions={PROCESSING_STEPS}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  imageSection: {
    padding: 16,
    backgroundColor: '#fff',
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#f0f0f0',
  },
  placeholder: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  placeholderText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 12,
  },
  placeholderSubtext: {
    color: '#999',
    fontSize: 14,
    marginTop: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    backgroundColor: '#f4511e',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonLeft: {
    marginRight: 6,
  },
  buttonRight: {
    marginLeft: 6,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#d32f2f',
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    flex: 1,
    color: '#d32f2f',
    fontSize: 14,
  },
  formSection: {
    padding: 16,
  },
  successMessage: {
    backgroundColor: '#e8f5e9',
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
    flexDirection: 'row',
    alignItems: 'center',
  },
  successText: {
    flex: 1,
    color: '#2e7d32',
    fontSize: 14,
    fontWeight: '500',
  },
});

