import { View, Text, StyleSheet } from 'react-native';
import { Ingredient } from '@/types';

interface IngredientsListProps {
  ingredients: Ingredient[];
}

export const IngredientsList = ({ ingredients }: IngredientsListProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ingredients</Text>
      {ingredients.map((ingredient, index) => (
        <View key={ingredient.id || index} style={styles.item}>
          <Text style={styles.text}>
            {ingredient.amount && ingredient.unit
              ? `${ingredient.amount} ${ingredient.unit} ${ingredient.name}`
              : ingredient.name}
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  item: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  text: {
    fontSize: 16,
  },
});

