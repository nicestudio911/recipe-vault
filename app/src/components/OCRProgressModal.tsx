import { View, Text, StyleSheet, Modal, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';

interface OCRProgressModalProps {
  visible: boolean;
  currentStep: number;
  totalSteps: number;
  stepDescriptions: string[];
}

export const OCRProgressModal = ({
  visible,
  currentStep,
  totalSteps,
  stepDescriptions,
}: OCRProgressModalProps) => {
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      const progress = currentStep / totalSteps;
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      progressAnim.setValue(0);
    }
  }, [currentStep, totalSteps, visible, progressAnim]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <Ionicons name="camera-outline" size={48} color="#f4511e" />
          </View>
          
          <Text style={styles.title}>Processing Image</Text>
          <Text style={styles.subtitle}>Please wait while we extract your recipe</Text>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  { width: progressWidth },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round((currentStep / totalSteps) * 100)}%
            </Text>
          </View>

          {/* Step Descriptions */}
          <View style={styles.stepsContainer}>
            {stepDescriptions.map((description, index) => {
              const stepNumber = index + 1;
              const isActive = stepNumber === currentStep;
              const isCompleted = stepNumber < currentStep;

              return (
                <View key={index} style={styles.stepItem}>
                  <View style={[
                    styles.stepIcon,
                    isCompleted && styles.stepIconCompleted,
                    isActive && styles.stepIconActive,
                  ]}>
                    {isCompleted ? (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    ) : (
                      <Text style={[
                        styles.stepNumber,
                        isActive && styles.stepNumberActive,
                      ]}>
                        {stepNumber}
                      </Text>
                    )}
                  </View>
                  <Text style={[
                    styles.stepDescription,
                    isActive && styles.stepDescriptionActive,
                    isCompleted && styles.stepDescriptionCompleted,
                  ]}>
                    {description}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  progressBarContainer: {
    width: '100%',
    marginBottom: 24,
  },
  progressBarBackground: {
    width: '100%',
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#f4511e',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontWeight: '600',
  },
  stepsContainer: {
    width: '100%',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIconActive: {
    backgroundColor: '#f4511e',
  },
  stepIconCompleted: {
    backgroundColor: '#4caf50',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  stepNumberActive: {
    color: '#fff',
  },
  stepDescription: {
    flex: 1,
    fontSize: 14,
    color: '#999',
  },
  stepDescriptionActive: {
    color: '#333',
    fontWeight: '600',
  },
  stepDescriptionCompleted: {
    color: '#666',
  },
});

