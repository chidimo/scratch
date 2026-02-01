import { useAuth } from '@/context/AuthContext';
import {
  ActivityIndicator,
  Linking,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { ThemedView } from './themed-view';
import { ThemedText } from './themed-text';

export const NewUser = () => {
  const { signIn, isLoading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.authContainer}>
        <ThemedText style={styles.title}>Welcome to Scratch</ThemedText>
        <ThemedText style={styles.subtitle}>
          Your personal scratchpad synced with GitHub Gists
        </ThemedText>
        <TouchableOpacity style={styles.signInButton} onPress={signIn}>
          <ThemedText style={styles.signInButtonThemedText}>
            Sign in with GitHub
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.extensionLinkButton}
          onPress={() => Linking.openURL('https://scratch.chidiorji.com')}
        >
          <ThemedText style={styles.extensionLinkText}>
            Get the VSCode Extension
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 24,
  },
  signInButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 200,
  },
  signInButtonThemedText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  extensionLinkButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  extensionLinkText: {
    color: '#007AFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
