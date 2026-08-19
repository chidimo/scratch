import { ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';
import { AccountSection } from './account-section';
import { AppSettingsSection } from './app-settings-section';
import { GitHubApiSection } from './github-api-section';
import { SignOutSection } from './sign-out-section';
import { ThemeSelector } from './theme-selector';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useThemeColor } from '@/hooks/use-theme-color';
import { GetExtension } from './get-extension';

export const SettingsScreen = () => {
  const { data: user, isPending } = useUserProfile();
  const { tint } = useThemeColor({}, ['tint']);

  if (isPending) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color={tint} />
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
    <ThemedView style={styles.screen}>
      <ThemedText style={styles.title} type="title">
        Settings
      </ThemedText>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <AccountSection />
        <GetExtension />
        <GitHubApiSection />
        <ThemeSelector />
        <AppSettingsSection />
        <SignOutSection />
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  message: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    padding: 16,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 12,
  },
});
