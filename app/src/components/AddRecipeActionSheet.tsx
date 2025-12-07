import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AddRecipeActionSheetProps {
  visible: boolean;
  onClose: () => void;
  onAddLink: () => void;
  onCreateNew: () => void;
  onImportOCR?: () => void;
  onImportInstagram?: () => void;
}

export const AddRecipeActionSheet = ({
  visible,
  onClose,
  onAddLink,
  onCreateNew,
  onImportOCR,
  onImportInstagram,
}: AddRecipeActionSheetProps) => {
  const handleAddLink = () => {
    onClose();
    onAddLink();
  };

  const handleCreateNew = () => {
    onClose();
    onCreateNew();
  };

  const handleImportOCR = () => {
    onClose();
    if (onImportOCR) {
      onImportOCR();
    }
  };

  const handleImportInstagram = () => {
    onClose();
    if (onImportInstagram) {
      onImportInstagram();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.container}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={styles.content}>
              <View style={styles.header}>
                <Text style={styles.title}>Add Recipe</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.option}
                onPress={handleAddLink}
                activeOpacity={0.7}
              >
                <View style={styles.optionIcon}>
                  <Ionicons name="link" size={24} color="#f4511e" />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Add from Link</Text>
                  <Text style={styles.optionDescription}>
                    Import recipe from a website URL
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.option}
                onPress={handleCreateNew}
                activeOpacity={0.7}
              >
                <View style={styles.optionIcon}>
                  <Ionicons name="create-outline" size={24} color="#f4511e" />
                </View>
                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Create New Recipe</Text>
                  <Text style={styles.optionDescription}>
                    Manually create a new recipe
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>

              {onImportOCR && (
                <TouchableOpacity
                  style={styles.option}
                  onPress={handleImportOCR}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionIcon}>
                    <Ionicons name="camera-outline" size={24} color="#f4511e" />
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={styles.optionTitle}>Import from Image</Text>
                    <Text style={styles.optionDescription}>
                      Extract recipe from photo or image
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#999" />
                </TouchableOpacity>
              )}

              {onImportInstagram && (
                <TouchableOpacity
                  style={styles.option}
                  onPress={handleImportInstagram}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionIcon}>
                    <Ionicons name="logo-instagram" size={24} color="#E4405F" />
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={styles.optionTitle}>Import from Instagram</Text>
                    <Text style={styles.optionDescription}>
                      Import recipe from an Instagram post
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: 32,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#f9f9f9',
    marginBottom: 12,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
  },
});

