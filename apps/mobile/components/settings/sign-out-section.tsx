import { useSignOut } from '@/hooks/use-sign-out';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Feather } from '@expo/vector-icons';
import { Alert, Pressable, StyleSheet } from 'react-native';
import { ThemedText } from '../themed-text';

export const SignOutSection = () => {
  const signOut = useSignOut();
  const { danger } = useThemeColor({}, ['danger']);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <Pressable style={styles.button} onPress={handleSignOut}>
      <Feather name="log-out" size={18} color={danger} />
      <ThemedText style={[styles.text, { color: danger }]}>
        Sign Out
      </ThemedText>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
  },
});
