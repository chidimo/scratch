import { useAuth } from '@/context/AuthContext';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import ParallaxScrollView from '../parallax-scroll-view';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';
import { AccountSection } from './account-section';
import { AppSettingsSection } from './app-settings-section';
import { GitHubApiSection } from './github-api-section';
import { SignOutSection } from './sign-out-section';
import { ThemeSelector } from './theme-selector';
import { HorizontalSeparator } from '../horizontal-separator';

export const SettingsScreen = () => {
  const { user, isLoading } = useAuth();

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
      <AccountSection />
      <HorizontalSeparator />
      <GitHubApiSection />
      <HorizontalSeparator />
      <ThemeSelector />
      <HorizontalSeparator />
      <AppSettingsSection />
      <HorizontalSeparator />
      <SignOutSection />
    </ParallaxScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  message: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
    fontSize: 16,
    padding: 16,
  },
});
