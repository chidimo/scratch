import { useSignOut } from '@/hooks/use-sign-out';
import { Alert, TouchableOpacity } from 'react-native';
import { ThemedText } from '../themed-text';
import { ThemedView } from '../themed-view';

export const SignOutSection = () => {
  const signOut = useSignOut();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <ThemedView style={styles.section}>
      <TouchableOpacity
        style={[styles.settingItem, styles.dangerItem]}
        onPress={handleSignOut}
      >
        <ThemedText style={[styles.settingThemedText, styles.dangerThemedText]}>
          Sign Out
        </ThemedText>
        <ThemedText style={styles.settingDescription}>
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
    color: '#666',
  },
  dangerItem: {
    backgroundColor: '#fff5f5',
  },
  dangerThemedText: {
    color: '#d32f2f',
  },
};
