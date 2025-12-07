import { useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useRecipes } from '@/hooks/useRecipes';
import { RecipeCard } from '@/components/RecipeCard';
import { FeaturedRecipeCard } from '@/components/FeaturedRecipeCard';
import { useSync } from '@/hooks/useSync';
import { AddRecipeActionSheet } from '@/components/AddRecipeActionSheet';
import { FloatingActionButton } from '@/components/FloatingActionButton';

type TabType = 'editors-choice' | 'for-you';

export default function HomeScreen() {
  const router = useRouter();
  const { data: recipes = [], isLoading, refetch } = useRecipes();
  const { syncNow, status } = useSync();
  const [activeTab, setActiveTab] = useState<TabType>('editors-choice');
  const [showActionSheet, setShowActionSheet] = useState(false);

  const onRefresh = async () => {
    await refetch();
    await syncNow();
  };

  // Get featured recipe (first recipe or random)
  const featuredRecipe = recipes[0];
  const otherRecipes = recipes.slice(1);

  const handleLike = () => {
    // TODO: Implement like functionality
    console.log('Like recipe');
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
      {/* Header Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'editors-choice' && styles.activeTab]}
          onPress={() => setActiveTab('editors-choice')}
        >
          <Text style={[styles.tabText, activeTab === 'editors-choice' && styles.activeTabText]}>
            Editor's Choice
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'for-you' && styles.activeTab]}
          onPress={() => setActiveTab('for-you')}
        >
          <Text style={[styles.tabText, activeTab === 'for-you' && styles.activeTabText]}>
            For You
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={otherRecipes}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          featuredRecipe ? (
            <FeaturedRecipeCard
              recipe={featuredRecipe}
              onPress={() => router.push(`/recipe/${featuredRecipe.id}`)}
              onLike={handleLike}
              onAdd={handleAdd}
              likesCount={4990}
            />
          ) : null
        }
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
        showsVerticalScrollIndicator={false}
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#f4511e',
  },
  tabText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#f4511e',
    fontWeight: '600',
  },
  list: {
    paddingBottom: 16,
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
