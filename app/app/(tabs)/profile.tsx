import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { useSyncStore } from '@/store/syncStore';
import { useSync } from '@/hooks/useSync';

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();
  const { syncNow, status, lastSync } = useSync();

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <Text style={styles.info}>{user?.email || 'Not signed in'}</Text>
        <TouchableOpacity style={styles.button} onPress={signOut}>
          <Text style={styles.buttonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sync</Text>
        <Text style={styles.info}>Status: {status}</Text>
        {lastSync && (
          <Text style={styles.info}>Last sync: {new Date(lastSync).toLocaleString()}</Text>
        )}
        <TouchableOpacity
          style={[styles.button, status === 'syncing' && styles.buttonDisabled]}
          onPress={syncNow}
          disabled={status === 'syncing'}
        >
          <Text style={styles.buttonText}>
            {status === 'syncing' ? 'Syncing...' : 'Sync Now'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  info: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#f4511e',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
