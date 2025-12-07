import { View, Text, Image, StyleSheet } from 'react-native';
import { Step } from '@/types';

interface StepsListProps {
  steps: Step[];
}

export const StepsList = ({ steps }: StepsListProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Instructions</Text>
      {steps.map((step, index) => (
        <View key={step.id || index} style={styles.step}>
          <View style={styles.stepHeader}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{step.order_index}</Text>
            </View>
            <Text style={styles.stepText}>{step.description}</Text>
          </View>
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
  step: {
    marginBottom: 24,
  },
  stepHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f4511e',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  stepText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },
});

