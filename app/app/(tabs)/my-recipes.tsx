import { useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useRecipes } from '@/hooks/useRecipes';
import { RecipeCard } from '@/components/RecipeCard';
import { useSync } from '@/hooks/useSync';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { AddRecipeActionSheet } from '@/components/AddRecipeActionSheet';

export default function MyRecipesScreen() {
  const router = useRouter();
  const { data: recipes = [], isLoading, refetch } = useRecipes();
  const { syncNow, status } = useSync();
  const [showActionSheet, setShowActionSheet] = useState(false);

  const onRefresh = async () => {
    await refetch();
    await syncNow();
  };

  const handleAdd = () => {
    setShowActionSheet(true);
  };

  const handleAddLink = () => {
    router.push('/recipe/import-url');
  };

  const handleCreateNew = () => {
    router.push('/recipe/add');
  };

  const handleImportOCR = () => {
    router.push('/recipe/import-ocr');
  };

  const handleImportInstagram = () => {
    router.push('/recipe/import-instagram');
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={recipes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RecipeCard
            recipe={item}
            onPress={() => router.push(`/recipe/${item.id}`)}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No recipes yet. Add your first recipe!</Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={status === 'syncing'} onRefresh={onRefresh} />
        }
      />
      <FloatingActionButton icon="add" onPress={handleAdd} />
      <AddRecipeActionSheet
        visible={showActionSheet}
        onClose={() => setShowActionSheet(false)}
        onAddLink={handleAddLink}
        onCreateNew={handleCreateNew}
        onImportOCR={handleImportOCR}
        onImportInstagram={handleImportInstagram}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  list: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
