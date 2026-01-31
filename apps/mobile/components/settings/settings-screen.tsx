import { useAuth } from '@/context/AuthContext';
import { getGithubClient } from '@/services/GithubClient';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import ParallaxScrollView from '../parallax-scroll-view';
import { ThemeSelector } from './theme-selector';
import { ThemedView } from '../themed-view';
import { ThemedText } from '../themed-text';

export const SettingsScreen = () => {
  const { user, signOut, isLoading } = useAuth();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  const handleCheckRateLimit = async () => {
    try {
      const githubClient = getGithubClient();
      const rateLimit = await githubClient.getRateLimitStatus();
      Alert.alert(
        'GitHub API Rate Limit',
        `Remaining: ${rateLimit.remaining}\nLimit: ${rateLimit.limit}\nResets: ${new Date(rateLimit.reset * 1000).toLocaleString()}`,
      );
    } catch {
      Alert.alert('Error', 'Failed to fetch rate limit status');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.message}>
          Please sign in to access settings.
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ParallaxScrollView headerImage={null}>
      <ThemedView style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Account</ThemedText>
        <View style={styles.userInfo}>
          <ThemedText style={styles.userName}>{user.name}</ThemedText>
          <ThemedText style={styles.userEmail}>{user.email}</ThemedText>
          <ThemedText style={styles.userLogin}>@{user.login}</ThemedText>
        </View>
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText style={styles.sectionTitle}>GitHub API</ThemedText>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={handleCheckRateLimit}
        >
          <ThemedText style={styles.settingThemedText}>
            Check Rate Limit
          </ThemedText>
          <ThemedText style={styles.settingDescription}>
            View GitHub API usage
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <ThemeSelector />

      <ThemedView style={styles.section}>
        <ThemedText style={styles.sectionTitle}>App Settings</ThemedText>
        <TouchableOpacity style={styles.settingItem}>
          <ThemedText style={styles.settingThemedText}>
            Sync Settings
          </ThemedText>
          <ThemedText style={styles.settingDescription}>
            Configure synchronization options
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <ThemedText style={styles.settingThemedText}>Export Data</ThemedText>
          <ThemedText style={styles.settingDescription}>
            Export all notes and settings
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <ThemedText style={styles.settingThemedText}>About</ThemedText>
          <ThemedText style={styles.settingDescription}>
            App version and information
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <ThemedView style={styles.section}>
        <TouchableOpacity
          style={[styles.settingItem, styles.dangerItem]}
          onPress={handleSignOut}
        >
          <ThemedText
            style={[styles.settingThemedText, styles.dangerThemedText]}
          >
            Sign Out
          </ThemedText>
          <ThemedText style={styles.settingDescription}>
            Sign out from your GitHub account
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ParallaxScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    marginBottom: 20,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  userInfo: {
    padding: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  userLogin: {
    fontSize: 14,
    color: '#666',
  },
  settingItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingThemedText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: '#666',
  },
  dangerItem: {
    backgroundColor: '#fff5f5',
  },
  dangerThemedText: {
    color: '#d32f2f',
  },
  message: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
    fontSize: 16,
    padding: 16,
  },
});
