import { ActivityIndicator, StyleSheet } from 'react-native';
import ParallaxScrollView from '../parallax-scroll-view';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';
import { AccountSection } from './account-section';
import { AppSettingsSection } from './app-settings-section';
import { GitHubApiSection } from './github-api-section';
import { SignOutSection } from './sign-out-section';
import { ThemeSelector } from './theme-selector';
import { HorizontalSeparator } from '../horizontal-separator';
import { useUserProfile } from '@/hooks/use-user-profile';
import { GetExtension } from './get-extension';

export const SettingsScreen = () => {
  const { data: user, isPending } = useUserProfile();

  if (isPending) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" />
        <ThemedText style={{ textAlign: 'center' }}>
          Loading user profile...
        </ThemedText>
      </ThemedView>
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
      <GetExtension />
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
  },
  message: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    padding: 16,
  },
});
