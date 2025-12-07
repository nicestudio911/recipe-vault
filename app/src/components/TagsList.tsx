import { View, Text, StyleSheet } from 'react-native';
import { Tag } from '@/types';

interface TagsListProps {
  tags: Tag[];
}

export const TagsList = ({ tags }: TagsListProps) => {
  if (!tags || tags.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.tags}>
        {tags.map((tag) => (
          <View key={tag.id} style={styles.tag}>
            <Text style={styles.tagText}>{tag.name}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#f4511e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

