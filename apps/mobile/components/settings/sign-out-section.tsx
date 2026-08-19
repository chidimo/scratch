import { useSignOut } from '@/hooks/use-sign-out';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Alert, TouchableOpacity } from 'react-native';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';

export const SignOutSection = () => {
  const signOut = useSignOut();
  const { danger, surface, mutedText } = useThemeColor({}, [
    'danger',
    'surface',
    'mutedText',
  ]);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <ThemedView style={styles.section}>
      <TouchableOpacity
        style={[styles.settingItem, { backgroundColor: surface }]}
        onPress={handleSignOut}
      >
        <ThemedText style={[styles.settingThemedText, { color: danger }]}>
          Sign Out
        </ThemedText>
        <ThemedText style={[styles.settingDescription, { color: mutedText }]}>
          Sign out from your GitHub account
        </ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
};

const styles = {
  section: {
    marginBottom: 20,
    paddingVertical: 4,
  },
  settingItem: {
    padding: 12,
    borderRadius: 12,
  },
  settingThemedText: {
    fontSize: 16,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
  },
};
