import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Recipe, Ingredient, Step } from '@/types';
import { Ionicons } from '@expo/vector-icons';

interface RecipeFormProps {
  initialData?: Partial<Recipe>;
  onSubmit: (data: Partial<Recipe>) => Promise<void>;
}

export const RecipeForm = ({ initialData, onSubmit }: RecipeFormProps) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [source, setSource] = useState(initialData?.source || '');
  const [imageUri, setImageUri] = useState(initialData?.image_url || '');
  const [prepTime, setPrepTime] = useState(initialData?.prep_time?.toString() || '');
  const [cookTime, setCookTime] = useState(initialData?.cook_time?.toString() || '');
  const [servings, setServings] = useState(initialData?.servings?.toString() || '');
  const [ingredients, setIngredients] = useState<Omit<Ingredient, 'id' | 'recipe_id' | 'created_at' | 'updated_at'>[]>(
    initialData?.ingredients?.map(ing => ({
      name: ing.name,
      amount: ing.amount,
      unit: ing.unit,
      notes: ing.notes,
      order_index: ing.order_index,
    })) || []
  );
  const [steps, setSteps] = useState<Omit<Step, 'id' | 'recipe_id' | 'created_at' | 'updated_at'>[]>(
    initialData?.steps?.map(step => ({
      description: step.description,
      order_index: step.order_index,
      duration: step.duration,
      temperature: step.temperature,
    })) || []
  );

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const addIngredient = () => {
    setIngredients([
      ...ingredients,
      {
        name: '',
        amount: undefined,
        unit: '',
        notes: '',
        order_index: ingredients.length,
      },
    ]);
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: any) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const removeIngredient = (index: number) => {
    const updated = ingredients.filter((_, i) => i !== index).map((ing, i) => ({
      ...ing,
      order_index: i,
    }));
    setIngredients(updated);
  };

  const addStep = () => {
    setSteps([
      ...steps,
      {
        description: '',
        order_index: steps.length,
        duration: undefined,
        temperature: undefined,
      },
    ]);
  };

  const updateStep = (index: number, field: keyof Step, value: any) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], [field]: value };
    setSteps(updated);
  };

  const removeStep = (index: number) => {
    const updated = steps.filter((_, i) => i !== index).map((step, i) => ({
      ...step,
      order_index: i,
    }));
    setSteps(updated);
  };

  const handleSubmit = async () => {
    // Filter out empty ingredients and steps
    const validIngredients = ingredients.filter(ing => ing.name.trim() !== '');
    const validSteps = steps.filter(step => step.description.trim() !== '');

    await onSubmit({
      title,
      description,
      source,
      image_url: imageUri,
      prep_time: prepTime ? parseInt(prepTime) : undefined,
      cook_time: cookTime ? parseInt(cookTime) : undefined,
      servings: servings ? parseInt(servings) : undefined,
      ingredients: validIngredients,
      steps: validSteps,
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Recipe title"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Source</Text>
        <TextInput
          style={styles.input}
          value={source}
          onChangeText={setSource}
          placeholder="e.g., Julie Myers, Instagram: @chefname"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Recipe description"
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Image</Text>
        {imageUri ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
            <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
              <Text style={styles.imageButtonText}>Change Image</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
            <Text style={styles.imageButtonText}>Pick Image</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.row}>
        <View style={styles.section}>
          <Text style={styles.label}>Prep Time (min)</Text>
          <TextInput
            style={styles.input}
            value={prepTime}
            onChangeText={setPrepTime}
            keyboardType="numeric"
            placeholder="0"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Cook Time (min)</Text>
          <TextInput
            style={styles.input}
            value={cookTime}
            onChangeText={setCookTime}
            keyboardType="numeric"
            placeholder="0"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Servings</Text>
          <TextInput
            style={styles.input}
            value={servings}
            onChangeText={setServings}
            keyboardType="numeric"
            placeholder="0"
          />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.label}>Ingredients</Text>
          <TouchableOpacity onPress={addIngredient} style={styles.addButton}>
            <Ionicons name="add" size={20} color="#f4511e" />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
        {ingredients.map((ingredient, index) => (
          <View key={index} style={styles.ingredientRow}>
            <View style={styles.ingredientInputs}>
              <TextInput
                style={[styles.input, styles.ingredientInput]}
                placeholder="Amount"
                value={ingredient.amount?.toString() || ''}
                onChangeText={(value) => updateIngredient(index, 'amount', value ? parseFloat(value) : undefined)}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.input, styles.ingredientInput]}
                placeholder="Unit"
                value={ingredient.unit || ''}
                onChangeText={(value) => updateIngredient(index, 'unit', value)}
              />
              <TextInput
                style={[styles.input, styles.ingredientInput, { flex: 1 }]}
                placeholder="Ingredient name *"
                value={ingredient.name}
                onChangeText={(value) => updateIngredient(index, 'name', value)}
              />
            </View>
            <TouchableOpacity onPress={() => removeIngredient(index)} style={styles.removeButton}>
              <Ionicons name="trash-outline" size={20} color="#f4511e" />
            </TouchableOpacity>
          </View>
        ))}
        {ingredients.length === 0 && (
          <Text style={styles.emptyText}>No ingredients added yet</Text>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.label}>Steps</Text>
          <TouchableOpacity onPress={addStep} style={styles.addButton}>
            <Ionicons name="add" size={20} color="#f4511e" />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
        {steps.map((step, index) => (
          <View key={index} style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <TouchableOpacity onPress={() => removeStep(index)} style={styles.removeButton}>
                <Ionicons name="trash-outline" size={20} color="#f4511e" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.input, styles.textArea, styles.stepInput]}
              placeholder="Step description *"
              value={step.description}
              onChangeText={(value) => updateStep(index, 'description', value)}
              multiline
              numberOfLines={3}
            />
          </View>
        ))}
        {steps.length === 0 && (
          <Text style={styles.emptyText}>No steps added yet</Text>
        )}
      </View>

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Save Recipe</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  imageContainer: {
    marginBottom: 12,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
    resizeMode: 'cover',
  },
  imageButton: {
    backgroundColor: '#f4511e',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  imageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  ingredientInputs: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  ingredientInput: {
    flex: 0.3,
  },
  stepContainer: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f4511e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  stepInput: {
    height: 80,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addButtonText: {
    color: '#f4511e',
    fontSize: 14,
    fontWeight: '600',
  },
  removeButton: {
    padding: 8,
  },
  emptyText: {
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
  submitButton: {
    backgroundColor: '#f4511e',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
